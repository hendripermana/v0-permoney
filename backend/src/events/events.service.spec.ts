import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';
import { EventType } from './types/event.types';

describe('EventsService', () => {
  let service: EventsService;
  let prismaService: PrismaService;
  let eventsQueue: any;
  let analyticsQueue: any;

  const mockPrismaService = {
    userEvent: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('events'),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken('analytics'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventsQueue = module.get(getQueueToken('events'));
    analyticsQueue = module.get(getQueueToken('analytics'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track an event successfully', async () => {
      const eventPayload = {
        userId: 'user-1',
        householdId: 'household-1',
        eventType: EventType.TRANSACTION_CREATED,
        eventData: { amount: 100000 },
        resourceType: 'transaction',
        resourceId: 'transaction-1',
      };

      const mockEvent = {
        id: 'event-1',
        ...eventPayload,
        timestamp: new Date(),
      };

      mockPrismaService.userEvent.create.mockResolvedValue(mockEvent);

      await service.trackEvent(eventPayload);

      expect(mockPrismaService.userEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: eventPayload.userId,
          householdId: eventPayload.householdId,
          eventType: eventPayload.eventType,
          eventData: eventPayload.eventData,
          resourceType: eventPayload.resourceType,
          resourceId: eventPayload.resourceId,
        }),
      });

      expect(eventsQueue.add).toHaveBeenCalledWith('process-event', {
        eventId: mockEvent.id,
        ...eventPayload,
      });

      expect(analyticsQueue.add).toHaveBeenCalledWith('analyze-event', {
        eventId: mockEvent.id,
        ...eventPayload,
      });
    });

    it('should handle errors gracefully', async () => {
      const eventPayload = {
        userId: 'user-1',
        householdId: 'household-1',
        eventType: EventType.USER_LOGIN,
      };

      mockPrismaService.userEvent.create.mockRejectedValue(new Error('Database error'));

      await expect(service.trackEvent(eventPayload)).rejects.toThrow('Database error');
    });
  });

  describe('trackEvents', () => {
    it('should batch track multiple events', async () => {
      const events = [
        {
          userId: 'user-1',
          householdId: 'household-1',
          eventType: EventType.TRANSACTION_CREATED,
        },
        {
          userId: 'user-1',
          householdId: 'household-1',
          eventType: EventType.ACCOUNT_CREATED,
        },
      ];

      mockPrismaService.userEvent.createMany.mockResolvedValue({ count: 2 });

      await service.trackEvents(events);

      expect(mockPrismaService.userEvent.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            householdId: 'household-1',
            eventType: EventType.TRANSACTION_CREATED,
          }),
          expect.objectContaining({
            userId: 'user-1',
            householdId: 'household-1',
            eventType: EventType.ACCOUNT_CREATED,
          }),
        ]),
      });

      expect(eventsQueue.add).toHaveBeenCalledWith('process-events-batch', {
        events,
        count: 2,
      });
    });
  });

  describe('queryEvents', () => {
    it('should query events with filters', async () => {
      const query = {
        householdId: 'household-1',
        eventType: EventType.TRANSACTION_CREATED,
        limit: 10,
        offset: 0,
      };

      const mockEvents = [
        {
          id: 'event-1',
          eventType: EventType.TRANSACTION_CREATED,
          timestamp: new Date(),
          user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
          household: { id: 'household-1', name: 'Test Household' },
        },
      ];

      mockPrismaService.userEvent.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.userEvent.count.mockResolvedValue(1);

      const result = await service.queryEvents(query);

      expect(result).toEqual({
        events: mockEvents,
        total: 1,
        limit: 10,
        offset: 0,
        hasMore: false,
      });

      expect(mockPrismaService.userEvent.findMany).toHaveBeenCalledWith({
        where: {
          householdId: 'household-1',
          eventType: EventType.TRANSACTION_CREATED,
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
        skip: 0,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          household: {
            select: { id: true, name: true },
          },
        },
      });
    });
  });

  describe('getEventStats', () => {
    it('should return event statistics', async () => {
      const householdId = 'household-1';
      
      mockPrismaService.userEvent.count.mockResolvedValue(100);
      mockPrismaService.userEvent.groupBy
        .mockResolvedValueOnce([
          { eventType: EventType.TRANSACTION_CREATED, _count: { eventType: 50 } },
          { eventType: EventType.USER_LOGIN, _count: { eventType: 30 } },
        ])
        .mockResolvedValueOnce([
          { userId: 'user-1', _count: { userId: 60 } },
          { userId: 'user-2', _count: { userId: 40 } },
        ]);
      
      mockPrismaService.userEvent.findMany.mockResolvedValue([
        {
          id: 'event-1',
          eventType: EventType.TRANSACTION_CREATED,
          timestamp: new Date(),
          user: { name: 'Test User' },
        },
      ]);

      const result = await service.getEventStats(householdId);

      expect(result).toEqual({
        totalEvents: 100,
        eventsByType: [
          { eventType: EventType.TRANSACTION_CREATED, count: 50 },
          { eventType: EventType.USER_LOGIN, count: 30 },
        ],
        eventsByUser: [
          { userId: 'user-1', count: 60 },
          { userId: 'user-2', count: 40 },
        ],
        recentEvents: expect.any(Array),
      });
    });
  });

  describe('cleanupOldEvents', () => {
    it('should clean up old events', async () => {
      mockPrismaService.userEvent.deleteMany.mockResolvedValue({ count: 50 });

      const result = await service.cleanupOldEvents(365);

      expect(result).toBe(50);
      expect(mockPrismaService.userEvent.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: { lt: expect.any(Date) },
        },
      });
    });
  });
});
