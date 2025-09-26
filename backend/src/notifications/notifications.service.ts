import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPreferences,
  ScheduledNotification,
} from './types/notification.types';
import { 
  CreateNotificationDto, 
  UpdateNotificationPreferencesDto,
  MarkNotificationReadDto 
} from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  async createNotification(createNotificationDto: CreateNotificationDto) {
    const { 
      userId, 
      householdId, 
      type, 
      title, 
      message, 
      actionUrl, 
      actionText, 
      metadata, 
      channels, 
      priority, 
      scheduledAt 
    } = createNotificationDto;

    // Check user preferences to filter channels
    const userPreferences = await this.getUserPreferences(userId);
    const allowedChannels = this.filterChannelsByPreferences(type, channels, userPreferences);

    if (allowedChannels.length === 0) {
      this.logger.log(`No allowed channels for notification type ${type} for user ${userId}`);
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        householdId,
        type,
        title,
        message,
        actionUrl,
        actionText,
        metadata: metadata || {},
        channels: allowedChannels,
        priority,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        household: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // If scheduled, add to queue with delay
    if (scheduledAt) {
      const delay = new Date(scheduledAt).getTime() - Date.now();
      if (delay > 0) {
        await this.notificationQueue.add(
          'send-notification',
          { notificationId: notification.id },
          { delay }
        );
      }
    } else {
      // Send immediately
      await this.notificationQueue.add('send-notification', {
        notificationId: notification.id,
      });
    }

    // Invalidate user's notification cache
    await this.cacheService.del(`notifications:user:${userId}`);

    return notification;
  }

  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: NotificationStatus;
      type?: NotificationType;
    } = {}
  ) {
    const { limit = 20, offset = 0, status, type } = options;

    const cacheKey = `notifications:user:${userId}:${JSON.stringify(options)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = { userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          deliveries: true,
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const result = {
      notifications,
      total,
      hasMore: offset + limit < total,
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async markAsRead(userId: string, markReadDto: MarkNotificationReadDto) {
    const { notificationId } = markReadDto;

    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updatedNotification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    // Invalidate cache
    await this.cacheService.del(`notifications:user:${userId}`);

    return updatedNotification;
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        status: { not: NotificationStatus.READ },
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    // Invalidate cache
    await this.cacheService.del(`notifications:user:${userId}`);

    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `notifications:unread:${userId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return parseInt(cached, 10);
    }

    const count = await this.prisma.notification.count({
      where: {
        userId,
        status: { not: NotificationStatus.READ },
      },
    });

    // Cache for 1 minute
    await this.cacheService.set(cacheKey, count.toString(), 60);

    return count;
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const cacheKey = `notification-preferences:${userId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences
      const defaultPreferences = await this.createDefaultPreferences(userId);
      return this.parsePreferences(defaultPreferences);
    }

    const parsedPreferences = this.parsePreferences(preferences);
    
    // Cache for 1 hour
    await this.cacheService.set(cacheKey, JSON.stringify(parsedPreferences), 3600);

    return parsedPreferences;
  }

  async updateUserPreferences(
    userId: string,
    updateDto: UpdateNotificationPreferencesDto
  ) {
    const updatedPreferences = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        budgetAlerts: updateDto.budgetAlerts || {},
        debtReminders: updateDto.debtReminders || {},
        zakatReminders: updateDto.zakatReminders || {},
        priceAlerts: updateDto.priceAlerts || {},
        transactionAlerts: updateDto.transactionAlerts || {},
        monthlyReports: updateDto.monthlyReports || {},
        securityAlerts: updateDto.securityAlerts || {},
      },
      update: {
        ...(updateDto.budgetAlerts && { budgetAlerts: updateDto.budgetAlerts }),
        ...(updateDto.debtReminders && { debtReminders: updateDto.debtReminders }),
        ...(updateDto.zakatReminders && { zakatReminders: updateDto.zakatReminders }),
        ...(updateDto.priceAlerts && { priceAlerts: updateDto.priceAlerts }),
        ...(updateDto.transactionAlerts && { transactionAlerts: updateDto.transactionAlerts }),
        ...(updateDto.monthlyReports && { monthlyReports: updateDto.monthlyReports }),
        ...(updateDto.securityAlerts && { securityAlerts: updateDto.securityAlerts }),
      },
    });

    // Invalidate cache
    await this.cacheService.del(`notification-preferences:${userId}`);

    return this.parsePreferences(updatedPreferences);
  }

  async scheduleRecurringNotification(notification: ScheduledNotification) {
    if (!notification.recurring) {
      throw new Error('Notification must have recurring configuration');
    }

    const { frequency, interval, endDate } = notification.recurring;
    let nextDate = new Date(notification.scheduledAt);

    // Calculate next execution date based on frequency
    switch (frequency) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + (interval * 7));
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
    }

    // Check if we should continue scheduling
    if (endDate && nextDate > endDate) {
      return;
    }

    // Schedule next occurrence
    const delay = nextDate.getTime() - Date.now();
    if (delay > 0) {
      await this.notificationQueue.add(
        'send-recurring-notification',
        {
          ...notification,
          scheduledAt: nextDate,
        },
        { delay }
      );
    }
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    // Invalidate cache
    await this.cacheService.del(`notifications:user:${userId}`);

    return { success: true };
  }

  private async createDefaultPreferences(userId: string) {
    return await this.prisma.notificationPreference.create({
      data: {
        userId,
        budgetAlerts: {
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          threshold: 80,
        },
        debtReminders: {
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          daysBefore: 3,
        },
        zakatReminders: {
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          daysBefore: 30,
        },
        priceAlerts: {
          enabled: true,
          channels: [NotificationChannel.IN_APP],
          priceDropPercentage: 10,
        },
        transactionAlerts: {
          enabled: true,
          channels: [NotificationChannel.IN_APP],
          largeAmountThreshold: 1000000,
        },
        monthlyReports: {
          enabled: true,
          channels: [NotificationChannel.EMAIL],
          dayOfMonth: 1,
        },
        securityAlerts: {
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
        },
      },
    });
  }

  private parsePreferences(preferences: any): NotificationPreferences {
    return {
      budgetAlerts: typeof preferences.budgetAlerts === 'string' 
        ? JSON.parse(preferences.budgetAlerts) 
        : preferences.budgetAlerts,
      debtReminders: typeof preferences.debtReminders === 'string' 
        ? JSON.parse(preferences.debtReminders) 
        : preferences.debtReminders,
      zakatReminders: typeof preferences.zakatReminders === 'string' 
        ? JSON.parse(preferences.zakatReminders) 
        : preferences.zakatReminders,
      priceAlerts: typeof preferences.priceAlerts === 'string' 
        ? JSON.parse(preferences.priceAlerts) 
        : preferences.priceAlerts,
      transactionAlerts: typeof preferences.transactionAlerts === 'string' 
        ? JSON.parse(preferences.transactionAlerts) 
        : preferences.transactionAlerts,
      monthlyReports: typeof preferences.monthlyReports === 'string' 
        ? JSON.parse(preferences.monthlyReports) 
        : preferences.monthlyReports,
      securityAlerts: typeof preferences.securityAlerts === 'string' 
        ? JSON.parse(preferences.securityAlerts) 
        : preferences.securityAlerts,
    };
  }

  private filterChannelsByPreferences(
    type: NotificationType,
    requestedChannels: NotificationChannel[],
    preferences: NotificationPreferences
  ): NotificationChannel[] {
    let allowedChannels: NotificationChannel[] = [];

    switch (type) {
      case NotificationType.BUDGET_EXCEEDED:
      case NotificationType.BUDGET_WARNING:
        if (preferences.budgetAlerts.enabled) {
          allowedChannels = preferences.budgetAlerts.channels;
        }
        break;
      case NotificationType.DEBT_PAYMENT_DUE:
        if (preferences.debtReminders.enabled) {
          allowedChannels = preferences.debtReminders.channels;
        }
        break;
      case NotificationType.ZAKAT_REMINDER:
        if (preferences.zakatReminders.enabled) {
          allowedChannels = preferences.zakatReminders.channels;
        }
        break;
      case NotificationType.PRICE_ALERT:
        if (preferences.priceAlerts.enabled) {
          allowedChannels = preferences.priceAlerts.channels;
        }
        break;
      case NotificationType.TRANSACTION_CREATED:
      case NotificationType.ACCOUNT_BALANCE_LOW:
        if (preferences.transactionAlerts.enabled) {
          allowedChannels = preferences.transactionAlerts.channels;
        }
        break;
      case NotificationType.MONTHLY_REPORT_READY:
        if (preferences.monthlyReports.enabled) {
          allowedChannels = preferences.monthlyReports.channels;
        }
        break;
      case NotificationType.SECURITY_ALERT:
        if (preferences.securityAlerts.enabled) {
          allowedChannels = preferences.securityAlerts.channels;
        }
        break;
      default:
        allowedChannels = requestedChannels;
    }

    // Return intersection of requested and allowed channels
    return requestedChannels.filter(channel => allowedChannels.includes(channel));
  }
}
