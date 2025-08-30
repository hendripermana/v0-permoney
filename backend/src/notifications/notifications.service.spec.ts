import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { NotificationType, NotificationChannel, NotificationPriority } from './types/notification.types';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: PrismaService;
  let cacheService: CacheService;
  let mockQueue: unknown;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockNotificationQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: getQueueToken('notifications'),
          useValue: mockNotificationQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const createNotificationDto = {
        userId: 'user-1',
        householdId: 'household-1',
        type: NotificationType.BUDGET_EXCEEDED,
        title: 'Budget Exceeded',
        message: 'Your budget has been exceeded',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        priority: NotificationPriority.HIGH,
      };

      const mockPreferences = {
        budgetAlerts: {
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          threshold: 80,
        },
      };

      const mockNotification = {
        id: 'notification-1',
        ...createNotificationDto,
        createdAt: new Date(),
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        household: { id: 'household-1', name: 'Test Household' },
      };

      mockCacheService.get.mockResolvedValue(JSON.stringify(mockPreferences));
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);
      mockNotificationQueue.add.mockResolvedValue({});

      const result = await service.createNotification(createNotificationDto);

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: createNotificationDto.userId,
          householdId: createNotificationDto.householdId,
          type: createNotificationDto.type,
          title: createNotificationDto.title,
          message: createNotificationDto.message,
          channels: createNotificationDto.channels,
          priority: createNotificationDto.priority,
        }),
        include: expect.any(Object),
      });
      expect(mockNotificationQueue.add).toHaveBeenCalledWith('send-notification', {
        notificationId: mockNotification.id,
      });
    });

    it('should filter channels based on user preferences', async () => {
      const createNotificationDto = {
        userId: 'user-1',
        householdId: 'household-1',
        type: NotificationType.BUDGET_EXCEEDED,
        title: 'Budget Exceeded',
        message: 'Your budget has been exceeded',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
        priority: NotificationPriority.HIGH,
      };

      const mockPreferences = {
        budgetAlerts: {
          enabled: true,
          channels: [NotificationChannel.IN_APP], // Only IN_APP enabled
          threshold: 80,
        },
      };

      mockCacheService.get.mockResolvedValue(JSON.stringify(mockPreferences));
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notification-1',
        ...createNotificationDto,
        channels: [NotificationChannel.IN_APP], // Should be filtered
      });

      await service.createNotification(createNotificationDto);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channels: [NotificationChannel.IN_APP], // Should only include allowed channels
        }),
        include: expect.any(Object),
      });
    });

    it('should return null if no channels are allowed', async () => {
      const createNotificationDto = {
        userId: 'user-1',
        householdId: 'household-1',
        type: NotificationType.BUDGET_EXCEEDED,
        title: 'Budget Exceeded',
        message: 'Your budget has been exceeded',
        channels: [NotificationChannel.EMAIL],
        priority: NotificationPriority.HIGH,
      };

      const mockPreferences = {
        budgetAlerts: {
          enabled: false, // Disabled
          channels: [NotificationChannel.EMAIL],
          threshold: 80,
        },
      };

      mockCacheService.get.mockResolvedValue(JSON.stringify(mockPreferences));

      const result = await service.createNotification(createNotificationDto);

      expect(result).toBeNull();
      expect(mockPrismaService.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserNotifications', () => {
    it('should return cached notifications if available', async () => {
      const userId = 'user-1';
      const options = { limit: 10, offset: 0 };
      const cachedData = {
        notifications: [{ id: 'notification-1', title: 'Test' }],
        total: 1,
        hasMore: false,
      };

      mockCacheService.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getUserNotifications(userId, options);

      expect(result).toEqual(cachedData);
      expect(mockPrismaService.notification.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not cached', async () => {
      const userId = 'user-1';
      const options = { limit: 10, offset: 0 };
      const mockNotifications = [{ id: 'notification-1', title: 'Test' }];
      const mockTotal = 1;

      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrismaService.notification.count.mockResolvedValue(mockTotal);

      const result = await service.getUserNotifications(userId, options);

      expect(result).toEqual({
        notifications: mockNotifications,
        total: mockTotal,
        hasMore: false,
      });
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const userId = 'user-1';
      const notificationId = 'notification-1';
      const mockNotification = {
        id: notificationId,
        userId,
        status: 'PENDING',
      };
      const updatedNotification = {
        ...mockNotification,
        status: 'READ',
        readAt: expect.any(Date),
      };

      mockPrismaService.notification.findFirst.mockResolvedValue(mockNotification);
      mockPrismaService.notification.update.mockResolvedValue(updatedNotification);

      const result = await service.markAsRead(userId, { notificationId });

      expect(result).toEqual(updatedNotification);
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: {
          status: 'READ',
          readAt: expect.any(Date),
        },
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if notification not found', async () => {
      const userId = 'user-1';
      const notificationId = 'notification-1';

      mockPrismaService.notification.findFirst.mockResolvedValue(null);

      await expect(
        service.markAsRead(userId, { notificationId })
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('getUnreadCount', () => {
    it('should return cached count if available', async () => {
      const userId = 'user-1';
      const cachedCount = '5';

      mockCacheService.get.mockResolvedValue(cachedCount);

      const result = await service.getUnreadCount(userId);

      expect(result).toBe(5);
      expect(mockPrismaService.notification.count).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not cached', async () => {
      const userId = 'user-1';
      const mockCount = 3;

      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.notification.count.mockResolvedValue(mockCount);

      const result = await service.getUnreadCount(userId);

      expect(result).toBe(mockCount);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        `notifications:unread:${userId}`,
        mockCount.toString(),
        60
      );
    });
  });

  describe('getUserPreferences', () => {
    it('should create default preferences if none exist', async () => {
      const userId = 'user-1';
      const defaultPreferences = {
        userId,
        budgetAlerts: {
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          threshold: 80,
        },
      };

      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.notificationPreference.findUnique.mockResolvedValue(null);
      mockPrismaService.notificationPreference.create.mockResolvedValue(defaultPreferences);

      const result = await service.getUserPreferences(userId);

      expect(result).toEqual(expect.objectContaining({
        budgetAlerts: defaultPreferences.budgetAlerts,
      }));
      expect(mockPrismaService.notificationPreference.create).toHaveBeenCalled();
    });
  });
});
