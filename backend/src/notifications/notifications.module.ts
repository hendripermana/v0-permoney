import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailService } from './services/email.service';
import { PushNotificationService } from './services/push-notification.service';
import { NotificationSchedulerService } from './services/notification-scheduler.service';
import { NotificationProcessor } from './processors/notification.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailService,
    PushNotificationService,
    NotificationSchedulerService,
    NotificationProcessor,
  ],
  exports: [
    NotificationsService,
    EmailService,
    PushNotificationService,
    NotificationSchedulerService,
  ],
})
export class NotificationsModule {}
