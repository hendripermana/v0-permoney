import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NotificationType,
  PushNotificationPayload,
} from '../types/notification.types';
import { RetryService } from '../../common/services/retry.service';
import { CircuitBreaker } from '../../common/patterns/circuit-breaker';
import { FallbackService } from '../../common/patterns/fallback.service';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly retryService: RetryService,
    private readonly circuitBreaker: CircuitBreaker,
    private readonly fallbackService: FallbackService
  ) {
    this.initializeWebPush();
  }

  private initializeWebPush() {
    const vapidKeys = {
      publicKey: this.configService.get('VAPID_PUBLIC_KEY'),
      privateKey: this.configService.get('VAPID_PRIVATE_KEY'),
    };

    const subject = this.configService.get(
      'VAPID_SUBJECT',
      'mailto:support@permoney.id'
    );

    if (vapidKeys.publicKey && vapidKeys.privateKey) {
      webpush.setVapidDetails(
        subject,
        vapidKeys.publicKey,
        vapidKeys.privateKey
      );
    } else {
      this.logger.warn(
        'VAPID keys not configured. Push notifications will not work.'
      );
    }
  }

  async subscribeToPush(
    userId: string,
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    },
    userAgent?: string
  ) {
    try {
      const existingSubscription = await this.prisma.pushSubscription.findFirst(
        {
          where: {
            userId,
            endpoint: subscription.endpoint,
          },
        }
      );

      if (existingSubscription) {
        // Update existing subscription
        return await this.prisma.pushSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            userAgent,
            isActive: true,
          },
        });
      }

      // Create new subscription
      return await this.prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          isActive: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to subscribe user ${userId} to push notifications:`,
        error
      );
      throw error;
    }
  }

  async unsubscribeFromPush(userId: string, endpoint: string) {
    try {
      await this.prisma.pushSubscription.updateMany({
        where: {
          userId,
          endpoint,
        },
        data: {
          isActive: false,
        },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe user ${userId} from push notifications:`,
        error
      );
      throw error;
    }
  }

  async sendPushNotification(
    userId: string,
    type: NotificationType,
    payload: PushNotificationPayload
  ): Promise<{ success: number; failed: number }> {
    try {
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      if (subscriptions.length === 0) {
        this.logger.log(
          `No active push subscriptions found for user ${userId}`
        );
        return { success: 0, failed: 0 };
      }

      let success = 0;
      let failed = 0;

      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        data: {
          ...payload.data,
          type,
          timestamp: Date.now(),
        },
        actions: payload.actions || [],
        requireInteraction: type === NotificationType.SECURITY_ALERT,
        silent: false,
      });

      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            pushPayload
          );

          success++;
          this.logger.log(
            `Push notification sent successfully to subscription ${subscription.id}`
          );
        } catch (error) {
          failed++;
          this.logger.error(
            `Failed to send push notification to subscription ${subscription.id}:`,
            error
          );

          // If subscription is invalid, mark as inactive
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.prisma.pushSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false },
            });
          }
        }
      }

      return { success, failed };
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to user ${userId}:`,
        error
      );
      return { success: 0, failed: 1 };
    }
  }

  async sendBulkPushNotifications(
    notifications: Array<{
      userId: string;
      type: NotificationType;
      payload: PushNotificationPayload;
    }>
  ): Promise<{ success: number; failed: number }> {
    let totalSuccess = 0;
    let totalFailed = 0;

    for (const notification of notifications) {
      const result = await this.sendPushNotification(
        notification.userId,
        notification.type,
        notification.payload
      );

      totalSuccess += result.success;
      totalFailed += result.failed;
    }

    return { success: totalSuccess, failed: totalFailed };
  }

  async getUserSubscriptions(userId: string) {
    return await this.prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
      },
    });
  }

  async cleanupInactiveSubscriptions() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.pushSubscription.deleteMany({
      where: {
        isActive: false,
        updatedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} inactive push subscriptions`);
    return result.count;
  }

  private getNotificationIcon(type: NotificationType): string {
    const icons = {
      [NotificationType.BUDGET_EXCEEDED]: '/icons/budget-alert.png',
      [NotificationType.BUDGET_WARNING]: '/icons/budget-warning.png',
      [NotificationType.DEBT_PAYMENT_DUE]: '/icons/debt-reminder.png',
      [NotificationType.ZAKAT_REMINDER]: '/icons/zakat.png',
      [NotificationType.TRANSACTION_CREATED]: '/icons/transaction.png',
      [NotificationType.ACCOUNT_BALANCE_LOW]: '/icons/balance-low.png',
      [NotificationType.RECURRING_TRANSACTION_FAILED]: '/icons/error.png',
      [NotificationType.MONTHLY_REPORT_READY]: '/icons/report.png',
      [NotificationType.SECURITY_ALERT]: '/icons/security.png',
      [NotificationType.HOUSEHOLD_INVITATION]: '/icons/invitation.png',
      [NotificationType.SYSTEM_MAINTENANCE]: '/icons/maintenance.png',
    };

    return icons[type] || '/icons/notification.png';
  }

  async testPushNotification(userId: string): Promise<boolean> {
    try {
      const result = await this.sendPushNotification(
        userId,
        NotificationType.SYSTEM_MAINTENANCE,
        {
          title: 'Test Notification',
          body: 'This is a test push notification from Permoney.',
          icon: this.getNotificationIcon(NotificationType.SYSTEM_MAINTENANCE),
          data: {
            test: true,
          },
        }
      );

      return result.success > 0;
    } catch (error) {
      this.logger.error(
        `Failed to send test push notification to user ${userId}:`,
        error
      );
      return false;
    }
  }
}
