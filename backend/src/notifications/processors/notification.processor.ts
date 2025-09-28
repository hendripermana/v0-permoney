import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../services/email.service';
import { PushNotificationService } from '../services/push-notification.service';
import { NotificationSchedulerService } from '../services/notification-scheduler.service';
import { 
  NotificationChannel, 
  NotificationStatus, 
  NotificationType 
} from '../types/notification.types';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly schedulerService: NotificationSchedulerService,
  ) {}

  @Process('send-notification')
  async handleSendNotification(job: Job<{ notificationId: string }>) {
    const { notificationId } = job.data;
    this.logger.log(`Processing notification: ${notificationId}`);

    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
        include: {
          user: true,
          household: true,
        },
      });

      if (!notification) {
        this.logger.error(`Notification not found: ${notificationId}`);
        return;
      }

      const results = await Promise.allSettled(
        notification.channels.map(channel =>
          this.sendNotificationByChannel(notification, channel)
        )
      );

      // Update notification status based on results
      const hasSuccess = results.some(result => result.status === 'fulfilled' && result.value);

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: hasSuccess ? NotificationStatus.SENT : NotificationStatus.FAILED,
          sentAt: hasSuccess ? new Date() : null,
        },
      });

      this.logger.log(`Notification ${notificationId} processed. Success: ${hasSuccess}`);
    } catch (error) {
      this.logger.error(`Failed to process notification ${notificationId}:`, error);
      
      // Mark notification as failed
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
        },
      });

      throw error;
    }
  }

  @Process('send-recurring-notification')
  async handleRecurringNotification(job: Job<any>) {
    const notificationData = job.data;
    this.logger.log(`Processing recurring notification: ${notificationData.type}`);

    try {
      // Create new notification instance
      const notification = await this.prisma.notification.create({
        data: {
          userId: notificationData.userId,
          householdId: notificationData.householdId,
          type: notificationData.type,
          title: notificationData.data.title,
          message: notificationData.data.message,
          actionUrl: notificationData.data.actionUrl,
          actionText: notificationData.data.actionText,
          metadata: notificationData.data.metadata || {},
          channels: notificationData.channels,
          priority: notificationData.priority,
        },
        include: {
          user: true,
          household: true,
        },
      });

      // Send the notification
      const results = await Promise.allSettled(
        notification.channels.map(channel =>
          this.sendNotificationByChannel(notification, channel)
        )
      );

      const hasSuccess = results.some(result => result.status === 'fulfilled' && result.value);

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: hasSuccess ? NotificationStatus.SENT : NotificationStatus.FAILED,
          sentAt: hasSuccess ? new Date() : null,
        },
      });

      // Schedule next occurrence if recurring
      if (notificationData.recurring) {
        await this.schedulerService.scheduleRecurringNotification(notificationData);
      }

      this.logger.log(`Recurring notification processed. Success: ${hasSuccess}`);
    } catch (error) {
      this.logger.error(`Failed to process recurring notification:`, error);
      throw error;
    }
  }

  @Process('generate-monthly-report')
  async handleMonthlyReportGeneration(job: Job<{ householdId: string }>) {
    const { householdId } = job.data;
    this.logger.log(`Generating monthly report for household: ${householdId}`);

    try {
      // This would integrate with the AI insights service to generate the actual report
      // For now, we'll create a placeholder implementation
      
      const household = await this.prisma.household.findUnique({
        where: { id: householdId },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!household) {
        this.logger.error(`Household not found: ${householdId}`);
        return;
      }

      // Simulate report generation delay
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Notify household members that report is ready
      for (const member of household.members) {
        await this.prisma.notification.create({
          data: {
            userId: member.user.id,
            householdId,
            type: NotificationType.MONTHLY_REPORT_READY,
            title: 'Monthly Report Ready',
            message: `Your monthly financial report for ${household.name} has been generated and is ready to view.`,
            actionUrl: `/reports/monthly`,
            actionText: 'View Report',
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            priority: 'LOW',
            status: NotificationStatus.PENDING,
          },
        });
      }

      this.logger.log(`Monthly report generated for household: ${householdId}`);
    } catch (error) {
      this.logger.error(`Failed to generate monthly report for household ${householdId}:`, error);
      throw error;
    }
  }

  @Process('cleanup-notifications')
  async handleNotificationCleanup(job: Job) {
    this.logger.log('Starting notification cleanup job');

    try {
      // Clean up old read notifications
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedNotifications = await this.prisma.notification.deleteMany({
        where: {
          status: NotificationStatus.READ,
          readAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      // Clean up failed notification deliveries
      const deletedDeliveries = await this.prisma.notificationDelivery.deleteMany({
        where: {
          status: NotificationStatus.FAILED,
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      // Clean up inactive push subscriptions
      const cleanedSubscriptions = await this.pushNotificationService.cleanupInactiveSubscriptions();

      this.logger.log(`Cleanup completed: ${deletedNotifications.count} notifications, ${deletedDeliveries.count} deliveries, ${cleanedSubscriptions} subscriptions`);
    } catch (error) {
      this.logger.error('Failed to cleanup notifications:', error);
      throw error;
    }
  }

  private async sendNotificationByChannel(notification: any, channel: NotificationChannel): Promise<boolean> {
    try {
      await this.createDeliveryRecord(notification.id, channel, NotificationStatus.PENDING);

      let success = false;

      switch (channel) {
        case NotificationChannel.IN_APP:
          // In-app notifications are already stored in the database
          success = true;
          break;

        case NotificationChannel.EMAIL:
          success = await this.emailService.sendNotificationEmail(
            notification.user.email,
            notification.type,
            {
              title: notification.title,
              message: notification.message,
              actionUrl: notification.actionUrl,
              actionText: notification.actionText,
              metadata: notification.metadata,
              userName: notification.user.name,
              householdName: notification.household.name,
            }
          );
          break;

        case NotificationChannel.PUSH: {
          const pushResult = await this.pushNotificationService.sendPushNotification(
            notification.userId,
            notification.type,
            {
              title: notification.title,
              body: notification.message,
              data: {
                notificationId: notification.id,
                actionUrl: notification.actionUrl,
                ...notification.metadata,
              },
              actions: notification.actionUrl
                ? [
                    {
                      action: 'view',
                      title: notification.actionText || 'View',
                    },
                  ]
                : undefined,
            }
          );
          success = pushResult.success > 0;
          break;
        }

        default:
          this.logger.warn(`Unknown notification channel: ${channel}`);
          success = false;
      }

      // Update delivery record
      await this.updateDeliveryRecord(
        notification.id,
        channel,
        success ? NotificationStatus.DELIVERED : NotificationStatus.FAILED,
        success ? new Date() : undefined,
        success ? undefined : 'Delivery failed'
      );

      return success;
    } catch (error) {
      this.logger.error(`Failed to send notification via ${channel}:`, error);
      
      await this.updateDeliveryRecord(
        notification.id,
        channel,
        NotificationStatus.FAILED,
        undefined,
        error.message
      );

      return false;
    }
  }

  private async createDeliveryRecord(
    notificationId: string,
    channel: NotificationChannel,
    status: NotificationStatus
  ) {
    return await this.prisma.notificationDelivery.create({
      data: {
        notificationId,
        channel,
        status,
      },
    });
  }

  private async updateDeliveryRecord(
    notificationId: string,
    channel: NotificationChannel,
    status: NotificationStatus,
    deliveredAt?: Date,
    failureReason?: string
  ) {
    return await this.prisma.notificationDelivery.updateMany({
      where: {
        notificationId,
        channel,
      },
      data: {
        status,
        deliveredAt,
        failureReason,
      },
    });
  }
}
