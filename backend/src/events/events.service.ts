import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { UserEventPayload, EventType } from './types/event.types';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('events') private readonly eventsQueue: Queue,
    @InjectQueue('analytics') private readonly analyticsQueue: Queue,
  ) {}

  /**
   * Track a user event - stores immediately and queues for processing
   */
  async trackEvent(payload: UserEventPayload): Promise<void> {
    try {
      // Store event immediately for real-time queries
      const event = await this.prisma.userEvent.create({
        data: {
          userId: payload.userId,
          householdId: payload.householdId,
          eventType: payload.eventType,
          eventData: payload.eventData || {},
          resourceType: payload.resourceType,
          resourceId: payload.resourceId,
          sessionId: payload.sessionId,
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
          timestamp: payload.timestamp || new Date(),
        },
      });

      // Queue for background processing
      await this.eventsQueue.add('process-event', {
        eventId: event.id,
        ...payload,
      });

      // Queue for analytics processing if it's a significant event
      if (this.isAnalyticsEvent(payload.eventType)) {
        await this.analyticsQueue.add('analyze-event', {
          eventId: event.id,
          ...payload,
        });
      }

      this.logger.debug(`Event tracked: ${payload.eventType} for user ${payload.userId}`);
    } catch (error) {
      this.logger.error(`Failed to track event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Batch track multiple events for performance
   */
  async trackEvents(events: UserEventPayload[]): Promise<void> {
    try {
      const eventData = events.map(event => ({
        userId: event.userId,
        householdId: event.householdId,
        eventType: event.eventType,
        eventData: event.eventData || {},
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        sessionId: event.sessionId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        timestamp: event.timestamp || new Date(),
      }));

      const createdEvents = await this.prisma.userEvent.createMany({
        data: eventData,
      });

      // Queue batch processing
      await this.eventsQueue.add('process-events-batch', {
        events: events,
        count: createdEvents.count,
      });

      this.logger.debug(`Batch tracked ${createdEvents.count} events`);
    } catch (error) {
      this.logger.error(`Failed to batch track events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Query events with filtering and pagination
   */
  async queryEvents(query: QueryEventsDto) {
    const where: any = {};

    if (query.userId) where.userId = query.userId;
    if (query.householdId) where.householdId = query.householdId;
    if (query.eventType) where.eventType = query.eventType;
    if (query.resourceType) where.resourceType = query.resourceType;
    if (query.resourceId) where.resourceId = query.resourceId;

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    const [events, total] = await Promise.all([
      this.prisma.userEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: query.limit,
        skip: query.offset,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          household: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.userEvent.count({ where }),
    ]);

    return {
      events,
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + query.limit < total,
    };
  }

  /**
   * Get event statistics for a household
   */
  async getEventStats(householdId: string, startDate?: Date, endDate?: Date) {
    const where: any = { householdId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [totalEvents, eventsByType, eventsByUser, recentEvents] = await Promise.all([
      this.prisma.userEvent.count({ where }),
      
      this.prisma.userEvent.groupBy({
        by: ['eventType'],
        where,
        _count: { eventType: true },
        orderBy: { _count: { eventType: 'desc' } },
        take: 10,
      }),

      this.prisma.userEvent.groupBy({
        by: ['userId'],
        where,
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
      }),

      this.prisma.userEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true,
          eventType: true,
          timestamp: true,
          user: { select: { name: true } },
        },
      }),
    ]);

    return {
      totalEvents,
      eventsByType: eventsByType.map(item => ({
        eventType: item.eventType,
        count: item._count.eventType,
      })),
      eventsByUser: eventsByUser.map(item => ({
        userId: item.userId,
        count: item._count.userId,
      })),
      recentEvents,
    };
  }

  /**
   * Get user activity timeline
   */
  async getUserActivityTimeline(userId: string, householdId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.prisma.userEvent.findMany({
      where: {
        userId,
        householdId,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        eventType: true,
        eventData: true,
        resourceType: true,
        resourceId: true,
        timestamp: true,
      },
    });

    // Group events by date
    const timeline = events.reduce((acc, event) => {
      const date = event.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, typeof events>);

    return timeline;
  }

  /**
   * Clean up old events (data retention)
   */
  async cleanupOldEvents(retentionDays = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.userEvent.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up ${result.count} events older than ${retentionDays} days`);
    return result.count;
  }

  /**
   * Check if an event type should trigger analytics processing
   */
  private isAnalyticsEvent(eventType: string): boolean {
    const analyticsEvents = [
      EventType.TRANSACTION_CREATED,
      EventType.TRANSACTION_UPDATED,
      EventType.TRANSACTION_CATEGORIZED,
      EventType.BUDGET_EXCEEDED,
      EventType.ACCOUNT_BALANCE_CHECKED,
      EventType.WISHLIST_ITEM_ADDED,
      EventType.DEBT_PAYMENT_MADE,
      EventType.PAGE_VIEWED,
      EventType.FEATURE_USED,
    ];

    return analyticsEvents.includes(eventType as EventType);
  }
}
