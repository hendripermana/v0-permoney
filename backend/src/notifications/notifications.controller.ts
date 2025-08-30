import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './services/push-notification.service';
import { NotificationSchedulerService } from './services/notification-scheduler.service';
import {
  CreateNotificationDto,
  UpdateNotificationPreferencesDto,
  MarkNotificationReadDto,
  SendTestNotificationDto,
} from './dto/create-notification.dto';
import { NotificationStatus, NotificationType } from './types/notification.types';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly schedulerService: NotificationSchedulerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNotification(
    @Request() req: any,
    @Body() createNotificationDto: CreateNotificationDto
  ) {
    // Ensure the notification is created for the authenticated user
    createNotificationDto.userId = req.user.id;
    
    return await this.notificationsService.createNotification(createNotificationDto);
  }

  @Get()
  async getUserNotifications(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: NotificationStatus,
    @Query('type') type?: NotificationType,
  ) {
    const options = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      status,
      type,
    };

    return await this.notificationsService.getUserNotifications(req.user.id, options);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Request() req: any,
    @Param('id') notificationId: string
  ) {
    return await this.notificationsService.markAsRead(req.user.id, {
      notificationId,
    });
  }

  @Put('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: any) {
    return await this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(
    @Request() req: any,
    @Param('id') notificationId: string
  ) {
    return await this.notificationsService.deleteNotification(req.user.id, notificationId);
  }

  @Get('preferences')
  async getUserPreferences(@Request() req: any) {
    return await this.notificationsService.getUserPreferences(req.user.id);
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  async updateUserPreferences(
    @Request() req: any,
    @Body() updateDto: UpdateNotificationPreferencesDto
  ) {
    return await this.notificationsService.updateUserPreferences(req.user.id, updateDto);
  }

  @Post('push/subscribe')
  @HttpCode(HttpStatus.CREATED)
  async subscribeToPush(
    @Request() req: any,
    @Body() subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    }
  ) {
    const userAgent = req.headers['user-agent'];
    return await this.pushNotificationService.subscribeToPush(
      req.user.id,
      subscription,
      userAgent
    );
  }

  @Post('push/unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribeFromPush(
    @Request() req: any,
    @Body() body: { endpoint: string }
  ) {
    return await this.pushNotificationService.unsubscribeFromPush(
      req.user.id,
      body.endpoint
    );
  }

  @Get('push/subscriptions')
  async getPushSubscriptions(@Request() req: any) {
    return await this.pushNotificationService.getUserSubscriptions(req.user.id);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async sendTestNotification(
    @Request() req: any,
    @Body() testDto: SendTestNotificationDto
  ) {
    const testNotification = await this.notificationsService.createNotification({
      userId: req.user.id,
      householdId: req.user.householdId, // Assuming this is available in the JWT
      type: testDto.type,
      title: 'Test Notification',
      message: 'This is a test notification to verify your notification settings.',
      channels: testDto.channels,
      priority: 'LOW',
    });

    return {
      success: true,
      message: 'Test notification sent',
      notificationId: testNotification?.id,
    };
  }

  @Post('push/test')
  @HttpCode(HttpStatus.OK)
  async testPushNotification(@Request() req: any) {
    const success = await this.pushNotificationService.testPushNotification(req.user.id);
    return {
      success,
      message: success ? 'Test push notification sent' : 'Failed to send test push notification',
    };
  }

  // Admin/Debug endpoints (should be protected with admin guard in production)
  @Post('scheduler/budget-check')
  @HttpCode(HttpStatus.OK)
  async triggerBudgetCheck() {
    await this.schedulerService.triggerBudgetCheck();
    return { success: true, message: 'Budget check triggered' };
  }

  @Post('scheduler/debt-reminders')
  @HttpCode(HttpStatus.OK)
  async triggerDebtReminders() {
    await this.schedulerService.triggerDebtReminders();
    return { success: true, message: 'Debt reminders triggered' };
  }

  @Post('scheduler/zakat-reminders')
  @HttpCode(HttpStatus.OK)
  async triggerZakatReminders() {
    await this.schedulerService.triggerZakatReminders();
    return { success: true, message: 'Zakat reminders triggered' };
  }

  @Post('scheduler/price-alerts')
  @HttpCode(HttpStatus.OK)
  async triggerPriceAlerts() {
    await this.schedulerService.triggerPriceAlerts();
    return { success: true, message: 'Price alerts triggered' };
  }

  @Post('scheduler/monthly-reports')
  @HttpCode(HttpStatus.OK)
  async triggerMonthlyReports() {
    await this.schedulerService.triggerMonthlyReports();
    return { success: true, message: 'Monthly reports triggered' };
  }
}
