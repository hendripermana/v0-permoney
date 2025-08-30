import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './services/push-notification.service';
import { NotificationSchedulerService } from './services/notification-scheduler.service';
import { NotificationType, NotificationChannel, NotificationPriority } from './types/notification.types';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: NotificationsService;
  let pushNotificationService: PushNotificationService;
  let schedulerService: NotificationSchedulerService;

  const mockNotificationsService = {
    createNotification: jest.fn(),
    getUserNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    getUserPreferences: jest.fn(),
    updateUserPreferences: jest.fn(),
  };

  const mockPushNotificationService = {
    subscribeToPush: jest.fn(),
    unsubscribeFromPush: jest.fn(),
    getUserSubscriptions: jest.fn(),
    testPushNotification: jest.fn(),
  };

  const mockSchedulerService = {
    triggerBudgetCheck: jest.fn(),
    triggerDebtReminders: jest.fn(),
    triggerZakatReminders: jest.fn(),
    triggerPriceAlerts: jest.fn(),
    triggerMonthlyReports: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: PushNotificationService,
          useValue: mockPushNotificationService,
        },
        {
          provide: NotificationSchedulerService,
          useValue: mockSchedulerService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    notificationsService = module.get<NotificationsService>(NotificationsService);
    pushNotificationService = module.get<PushNotificationService>(PushNotificationService);
    schedulerService = module.get<NotificationSchedulerService>(NotificationSchedulerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const req = { user: { id: 'user-1' } };
      const createDto = {
        userId: 'user-1', // Will be overridden
        householdId: 'household-1',
        type: NotificationType.BUDGET_EXCEEDED,
        title: 'Test Notification',
        message: 'Test message',
        channels: [NotificationChannel.IN_APP],
        priority: NotificationPriority.MEDIUM,
      };

      const mockNotification = {
        id: 'notification-1',
        ...createDto,
        userId: 'user-1', // Should be set from req.user.id
      };

      mockNotificationsService.createNotification.mockResolvedValue(mockNotification);

      const result = await controller.createNotification(req, createDto);

      expect(result).toEqual(mockNotification);
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith({
        ...createDto,
        userId: 'user-1', // Should use authenticated user's ID
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should get user notifications with default options', async () => {
      const req = { user: { id: 'user-1' } };
      const mockResponse = {
        notifications: [{ id: 'notification-1', title: 'Test' }],
        total: 1,
        hasMore: false,
      };

      mockNotificationsService.getUserNotifications.mockResolvedValue(mockResponse);

      const result = await controller.getUserNotifications(req);

      expect(result).toEqual(mockResponse);
      expect(mockNotificationsService.getUserNotifications).toHaveBeenCalledWith('user-1', {
        limit: undefined,
        offset: undefined,
        status: undefined,
        type: undefined,
      });
    });

    it('should get user notifications with custom options', async () => {
      const req = { user: { id: 'user-1' } };
      const mockResponse = {
        notifications: [{ id: 'notification-1', title: 'Test' }],
        total: 1,
        hasMore: false,
      };

      mockNotificationsService.getUserNotifications.mockResolvedValue(mockResponse);

      const result = await controller.getUserNotifications(
        req,
        '20',
        '10',
        'PENDING',
        NotificationType.BUDGET_EXCEEDED
      );

      expect(result).toEqual(mockResponse);
      expect(mockNotificationsService.getUserNotifications).toHaveBeenCalledWith('user-1', {
        limit: 20,
        offset: 10,
        status: 'PENDING',
        type: NotificationType.BUDGET_EXCEEDED,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const req = { user: { id: 'user-1' } };
      const mockCount = 5;

      mockNotificationsService.getUnreadCount.mockResolvedValue(mockCount);

      const result = await controller.getUnreadCount(req);

      expect(result).toEqual({ count: mockCount });
      expect(mockNotificationsService.getUnreadCount).toHaveBeenCalledWith('user-1');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const req = { user: { id: 'user-1' } };
      const notificationId = 'notification-1';
      const mockUpdatedNotification = {
        id: notificationId,
        status: 'READ',
        readAt: new Date(),
      };

      mockNotificationsService.markAsRead.mockResolvedValue(mockUpdatedNotification);

      const result = await controller.markAsRead(req, notificationId);

      expect(result).toEqual(mockUpdatedNotification);
      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith('user-1', {
        notificationId,
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const req = { user: { id: 'user-1' } };
      const mockResponse = { success: true };

      mockNotificationsService.markAllAsRead.mockResolvedValue(mockResponse);

      const result = await controller.markAllAsRead(req);

      expect(result).toEqual(mockResponse);
      expect(mockNotificationsService.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const req = { user: { id: 'user-1' } };
      const notificationId = 'notification-1';
      const mockResponse = { success: true };

      mockNotificationsService.deleteNotification.mockResolvedValue(mockResponse);

      const result = await controller.deleteNotification(req, notificationId);

      expect(result).toEqual(mockResponse);
      expect(mockNotificationsService.deleteNotification).toHaveBeenCalledWith('user-1', notificationId);
    });
  });

  describe('getUserPreferences', () => {
    it('should get user preferences', async () => {
      const req = { user: { id: 'user-1' } };
      const mockPreferences = {
        budgetAlerts: {
          enabled: true,
          channels: [NotificationChannel.IN_APP],
          threshold: 80,
        },
      };

      mockNotificationsService.getUserPreferences.mockResolvedValue(mockPreferences);

      const result = await controller.getUserPreferences(req);

      expect(result).toEqual(mockPreferences);
      expect(mockNotificationsService.getUserPreferences).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences', async () => {
      const req = { user: { id: 'user-1' } };
      const updateDto = {
        budgetAlerts: {
          enabled: false,
          channels: [NotificationChannel.EMAIL],
          threshold: 90,
        },
      };
      const mockUpdatedPreferences = {
        ...updateDto,
      };

      mockNotificationsService.updateUserPreferences.mockResolvedValue(mockUpdatedPreferences);

      const result = await controller.updateUserPreferences(req, updateDto);

      expect(result).toEqual(mockUpdatedPreferences);
      expect(mockNotificationsService.updateUserPreferences).toHaveBeenCalledWith('user-1', updateDto);
    });
  });

  describe('subscribeToPush', () => {
    it('should subscribe to push notifications', async () => {
      const req = {
        user: { id: 'user-1' },
        headers: { 'user-agent': 'Mozilla/5.0' },
      };
      const subscription = {
        endpoint: 'https://example.com/push',
        keys: {
          p256dh: 'key1',
          auth: 'key2',
        },
      };
      const mockResponse = { id: 'subscription-1' };

      mockPushNotificationService.subscribeToPush.mockResolvedValue(mockResponse);

      const result = await controller.subscribeToPush(req, subscription);

      expect(result).toEqual(mockResponse);
      expect(mockPushNotificationService.subscribeToPush).toHaveBeenCalledWith(
        'user-1',
        subscription,
        'Mozilla/5.0'
      );
    });
  });

  describe('sendTestNotification', () => {
    it('should send test notification', async () => {
      const req = { user: { id: 'user-1', householdId: 'household-1' } };
      const testDto = {
        type: NotificationType.BUDGET_EXCEEDED,
        channels: [NotificationChannel.IN_APP],
      };
      const mockNotification = { id: 'notification-1' };

      mockNotificationsService.createNotification.mockResolvedValue(mockNotification);

      const result = await controller.sendTestNotification(req, testDto);

      expect(result).toEqual({
        success: true,
        message: 'Test notification sent',
        notificationId: 'notification-1',
      });
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith({
        userId: 'user-1',
        householdId: 'household-1',
        type: testDto.type,
        title: 'Test Notification',
        message: 'This is a test notification to verify your notification settings.',
        channels: testDto.channels,
        priority: 'LOW',
      });
    });
  });

  describe('scheduler triggers', () => {
    it('should trigger budget check', async () => {
      mockSchedulerService.triggerBudgetCheck.mockResolvedValue(undefined);

      const result = await controller.triggerBudgetCheck();

      expect(result).toEqual({
        success: true,
        message: 'Budget check triggered',
      });
      expect(mockSchedulerService.triggerBudgetCheck).toHaveBeenCalled();
    });

    it('should trigger debt reminders', async () => {
      mockSchedulerService.triggerDebtReminders.mockResolvedValue(undefined);

      const result = await controller.triggerDebtReminders();

      expect(result).toEqual({
        success: true,
        message: 'Debt reminders triggered',
      });
      expect(mockSchedulerService.triggerDebtReminders).toHaveBeenCalled();
    });

    it('should trigger zakat reminders', async () => {
      mockSchedulerService.triggerZakatReminders.mockResolvedValue(undefined);

      const result = await controller.triggerZakatReminders();

      expect(result).toEqual({
        success: true,
        message: 'Zakat reminders triggered',
      });
      expect(mockSchedulerService.triggerZakatReminders).toHaveBeenCalled();
    });

    it('should trigger price alerts', async () => {
      mockSchedulerService.triggerPriceAlerts.mockResolvedValue(undefined);

      const result = await controller.triggerPriceAlerts();

      expect(result).toEqual({
        success: true,
        message: 'Price alerts triggered',
      });
      expect(mockSchedulerService.triggerPriceAlerts).toHaveBeenCalled();
    });

    it('should trigger monthly reports', async () => {
      mockSchedulerService.triggerMonthlyReports.mockResolvedValue(undefined);

      const result = await controller.triggerMonthlyReports();

      expect(result).toEqual({
        success: true,
        message: 'Monthly reports triggered',
      });
      expect(mockSchedulerService.triggerMonthlyReports).toHaveBeenCalled();
    });
  });
});
