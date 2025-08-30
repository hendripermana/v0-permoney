import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { BehaviorAnalysisService } from '../services/behavior-analysis.service';
import { PatternDetectionService } from '../services/pattern-detection.service';
import { InsightGenerationService } from '../services/insight-generation.service';
import { UserEventPayload, EventType } from '../types/event.types';

@Processor('events')
export class EventProcessor {
  private readonly logger = new Logger(EventProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly behaviorAnalysisService: BehaviorAnalysisService,
    private readonly patternDetectionService: PatternDetectionService,
    private readonly insightGenerationService: InsightGenerationService,
  ) {}

  /**
   * Process individual events
   */
  @Process('process-event')
  async processEvent(job: Job<UserEventPayload & { eventId: string }>) {
    const { eventId, eventType, householdId, userId } = job.data;

    try {
      this.logger.debug(`Processing event ${eventId}: ${eventType}`);

      // Update event processing status
      await this.prisma.userEvent.update({
        where: { id: eventId },
        data: {
          eventData: {
            ...job.data.eventData,
            processed: true,
            processedAt: new Date(),
          },
        },
      });

      // Trigger specific processing based on event type
      await this.handleSpecificEvent(job.data);

      // Update aggregated statistics
      await this.updateEventStatistics(householdId, eventType);

      this.logger.debug(`Successfully processed event ${eventId}`);
    } catch (error) {
      this.logger.error(`Failed to process event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Process batch of events
   */
  @Process('process-events-batch')
  async processEventsBatch(job: Job<{ events: UserEventPayload[]; count: number }>) {
    const { events, count } = job.data;

    try {
      this.logger.debug(`Processing batch of ${count} events`);

      // Process events in parallel (with concurrency limit)
      const batchSize = 10;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await Promise.all(
          batch.map(event => this.handleSpecificEvent(event))
        );
      }

      this.logger.debug(`Successfully processed batch of ${count} events`);
    } catch (error) {
      this.logger.error(`Failed to process events batch:`, error);
      throw error;
    }
  }

  /**
   * Analyze events for patterns and insights
   */
  @Process('analyze-event')
  async analyzeEvent(job: Job<UserEventPayload & { eventId: string }>) {
    const { eventId, eventType, householdId, userId } = job.data;

    try {
      this.logger.debug(`Analyzing event ${eventId}: ${eventType}`);

      // Trigger pattern detection for significant events
      if (this.isPatternTriggerEvent(eventType)) {
        await this.triggerPatternDetection(householdId, userId);
      }

      // Generate insights for insight-worthy events
      if (this.isInsightTriggerEvent(eventType)) {
        await this.triggerInsightGeneration(householdId);
      }

      this.logger.debug(`Successfully analyzed event ${eventId}`);
    } catch (error) {
      this.logger.error(`Failed to analyze event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Periodic pattern detection job
   */
  @Process('detect-patterns')
  async detectPatterns(job: Job<{ householdId: string; userId?: string }>) {
    const { householdId, userId } = job.data;

    try {
      this.logger.debug(`Detecting patterns for household ${householdId}`);

      // Detect spending patterns
      await this.behaviorAnalysisService.analyzeBehavior({
        householdId,
        userId,
        analysisType: 'SPENDING_PATTERNS' as any,
      });

      // Detect anomalies
      await this.patternDetectionService.detectSpendingAnomalies(householdId, userId);

      // Detect recurring patterns
      await this.patternDetectionService.detectRecurringPatterns(householdId, userId);

      // Detect seasonal patterns
      await this.patternDetectionService.detectSeasonalPatterns(householdId, userId);

      // Detect merchant loyalty patterns
      await this.patternDetectionService.detectMerchantLoyalty(householdId, userId);

      this.logger.debug(`Successfully detected patterns for household ${householdId}`);
    } catch (error) {
      this.logger.error(`Failed to detect patterns for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Periodic insight generation job
   */
  @Process('generate-insights')
  async generateInsights(job: Job<{ householdId: string }>) {
    const { householdId } = job.data;

    try {
      this.logger.debug(`Generating insights for household ${householdId}`);

      await this.insightGenerationService.generateInsights(householdId);

      this.logger.debug(`Successfully generated insights for household ${householdId}`);
    } catch (error) {
      this.logger.error(`Failed to generate insights for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old events
   */
  @Process('cleanup-events')
  async cleanupEvents(job: Job<{ retentionDays: number }>) {
    const { retentionDays } = job.data;

    try {
      this.logger.debug(`Cleaning up events older than ${retentionDays} days`);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.prisma.userEvent.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
        },
      });

      this.logger.log(`Cleaned up ${result.count} old events`);
    } catch (error) {
      this.logger.error(`Failed to cleanup old events:`, error);
      throw error;
    }
  }

  /**
   * Handle specific event types
   */
  private async handleSpecificEvent(event: UserEventPayload) {
    const { eventType, householdId, userId, eventData } = event;

    switch (eventType) {
      case EventType.TRANSACTION_CREATED:
        await this.handleTransactionCreated(householdId, userId, eventData);
        break;

      case EventType.BUDGET_EXCEEDED:
        await this.handleBudgetExceeded(householdId, userId, eventData);
        break;

      case EventType.USER_LOGIN:
        await this.handleUserLogin(householdId, userId, eventData);
        break;

      case EventType.FEATURE_USED:
        await this.handleFeatureUsed(householdId, userId, eventData);
        break;

      default:
        // Generic event handling
        this.logger.debug(`Processed generic event: ${eventType}`);
    }
  }

  /**
   * Handle transaction created events
   */
  private async handleTransactionCreated(householdId: string, userId: string, eventData: any) {
    // Update spending patterns immediately for large transactions
    if (eventData?.amount > 1000000) { // More than 10k IDR
      await this.triggerPatternDetection(householdId, userId);
    }

    // Check for budget impacts
    if (eventData?.categoryId) {
      await this.checkBudgetImpact(householdId, eventData.categoryId, eventData.amount);
    }
  }

  /**
   * Handle budget exceeded events
   */
  private async handleBudgetExceeded(householdId: string, userId: string, eventData: any) {
    // Generate immediate insight
    await this.insightGenerationService.generateInsights(householdId);

    // Log high-priority event
    this.logger.warn(`Budget exceeded for household ${householdId}, category: ${eventData?.categoryId}`);
  }

  /**
   * Handle user login events
   */
  private async handleUserLogin(householdId: string, userId: string, eventData: any) {
    // Update user activity statistics
    await this.updateUserActivityStats(userId, householdId);

    // Check if insights need to be refreshed (daily)
    const lastInsightGeneration = await this.getLastInsightGeneration(householdId);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (!lastInsightGeneration || lastInsightGeneration < oneDayAgo) {
      await this.triggerInsightGeneration(householdId);
    }
  }

  /**
   * Handle feature used events
   */
  private async handleFeatureUsed(householdId: string, userId: string, eventData: any) {
    // Track feature adoption
    await this.updateFeatureUsageStats(householdId, userId, eventData?.feature);
  }

  /**
   * Check if event should trigger pattern detection
   */
  private isPatternTriggerEvent(eventType: string): boolean {
    const triggerEvents = [
      EventType.TRANSACTION_CREATED,
      EventType.TRANSACTION_UPDATED,
      EventType.DEBT_PAYMENT_MADE,
    ];
    return triggerEvents.includes(eventType as EventType);
  }

  /**
   * Check if event should trigger insight generation
   */
  private isInsightTriggerEvent(eventType: string): boolean {
    const triggerEvents = [
      EventType.BUDGET_EXCEEDED,
      EventType.TRANSACTION_CREATED,
      EventType.DEBT_CREATED,
      EventType.ACCOUNT_CREATED,
    ];
    return triggerEvents.includes(eventType as EventType);
  }

  /**
   * Trigger pattern detection
   */
  private async triggerPatternDetection(householdId: string, userId?: string) {
    // Add to analytics queue with delay to batch similar requests
    await this.addToQueue('analytics', 'detect-patterns', {
      householdId,
      userId,
    }, {
      delay: 5000, // 5 second delay
      removeOnComplete: 10,
      removeOnFail: 5,
    });
  }

  /**
   * Trigger insight generation
   */
  private async triggerInsightGeneration(householdId: string) {
    // Add to analytics queue with delay to batch similar requests
    await this.addToQueue('analytics', 'generate-insights', {
      householdId,
    }, {
      delay: 10000, // 10 second delay
      removeOnComplete: 10,
      removeOnFail: 5,
    });
  }

  /**
   * Update event statistics
   */
  private async updateEventStatistics(householdId: string, eventType: string) {
    // This could be implemented with a separate statistics table
    // For now, we'll just log the statistics update
    this.logger.debug(`Updated statistics for ${eventType} in household ${householdId}`);
  }

  /**
   * Check budget impact
   */
  private async checkBudgetImpact(householdId: string, categoryId: string, amount: number) {
    const activeBudgets = await this.prisma.budget.findMany({
      where: {
        householdId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        categories: {
          where: { categoryId },
        },
      },
    });

    for (const budget of activeBudgets) {
      for (const budgetCategory of budget.categories) {
        const newSpentAmount = Number(budgetCategory.spentAmountCents) + amount;
        const allocatedAmount = Number(budgetCategory.allocatedAmountCents);

        if (newSpentAmount > allocatedAmount) {
          // Budget exceeded - this should trigger an event
          this.logger.warn(`Budget exceeded: ${budgetCategory.categoryId} in budget ${budget.id}`);
        }
      }
    }
  }

  /**
   * Update user activity statistics
   */
  private async updateUserActivityStats(userId: string, householdId: string) {
    // Update last activity timestamp
    await this.prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    });
  }

  /**
   * Get last insight generation time
   */
  private async getLastInsightGeneration(householdId: string): Promise<Date | null> {
    const lastInsight = await this.prisma.financialInsight.findFirst({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return lastInsight?.createdAt || null;
  }

  /**
   * Update feature usage statistics
   */
  private async updateFeatureUsageStats(householdId: string, userId: string, feature: string) {
    if (!feature) return;

    // This could be implemented with a feature usage statistics table
    this.logger.debug(`Feature ${feature} used by user ${userId} in household ${householdId}`);
  }

  /**
   * Add job to queue (helper method)
   */
  private async addToQueue(queueName: string, jobName: string, data: any, options: any = {}) {
    // This would need to be implemented with proper queue injection
    // For now, we'll just log the queue operation
    this.logger.debug(`Adding job ${jobName} to queue ${queueName}`, data);
  }
}
