import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  BudgetCreatedEvent,
  BudgetUpdatedEvent,
  BudgetDeletedEvent,
  BudgetOverspentEvent,
  BudgetThresholdReachedEvent,
  BudgetPeriodEndedEvent,
  BudgetCarryOverCreatedEvent,
} from '../events/budget.events';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class BudgetEventListener {
  private readonly logger = new Logger(BudgetEventListener.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService
  ) {}

  @OnEvent('budget.created')
  async handleBudgetCreated(event: BudgetCreatedEvent) {
    this.logger.log(`Budget created: ${event.budgetName} for household ${event.householdId}`);

    try {
      // Create financial insight for budget creation
      await this.prisma.financialInsight.create({
        data: {
          householdId: event.householdId,
          insightType: 'BUDGET_CREATED',
          title: 'New Budget Created',
          description: `You've created a new ${event.period.toLowerCase()} budget "${event.budgetName}" with total allocation of ${this.formatCurrency(event.totalAllocatedCents)}.`,
          data: {
            budgetId: event.budgetId,
            budgetName: event.budgetName,
            totalAllocatedCents: event.totalAllocatedCents,
            period: event.period,
            startDate: event.startDate,
            endDate: event.endDate,
          },
          priority: 'LOW',
          isActionable: false,
        },
      });

      // Log user event
      await this.logUserEvent(event.householdId, 'BUDGET_CREATED', {
        budgetId: event.budgetId,
        budgetName: event.budgetName,
        totalAllocatedCents: event.totalAllocatedCents,
      });

      // Clear cache
      await this.cacheService.del(`budgets:${event.householdId}`);
    } catch (error) {
      this.logger.error(`Failed to handle budget created event: ${error.message}`);
    }
  }

  @OnEvent('budget.updated')
  async handleBudgetUpdated(event: BudgetUpdatedEvent) {
    this.logger.log(`Budget updated: ${event.budgetId} for household ${event.householdId}`);

    try {
      // Log user event
      await this.logUserEvent(event.householdId, 'BUDGET_UPDATED', {
        budgetId: event.budgetId,
        changes: event.changes,
        previousValues: event.previousValues,
      });

      // Clear cache
      await this.cacheService.del(`budgets:${event.householdId}`);
    } catch (error) {
      this.logger.error(`Failed to handle budget updated event: ${error.message}`);
    }
  }

  @OnEvent('budget.deleted')
  async handleBudgetDeleted(event: BudgetDeletedEvent) {
    this.logger.log(`Budget deleted: ${event.budgetName} for household ${event.householdId}`);

    try {
      // Create financial insight for budget deletion
      await this.prisma.financialInsight.create({
        data: {
          householdId: event.householdId,
          insightType: 'BUDGET_DELETED',
          title: 'Budget Deleted',
          description: `Budget "${event.budgetName}" has been deleted. Consider creating a new budget to maintain financial discipline.`,
          data: {
            budgetId: event.budgetId,
            budgetName: event.budgetName,
          },
          priority: 'MEDIUM',
          isActionable: true,
        },
      });

      // Log user event
      await this.logUserEvent(event.householdId, 'BUDGET_DELETED', {
        budgetId: event.budgetId,
        budgetName: event.budgetName,
      });

      // Clear cache
      await this.cacheService.del(`budgets:${event.householdId}`);
    } catch (error) {
      this.logger.error(`Failed to handle budget deleted event: ${error.message}`);
    }
  }

  @OnEvent('budget.overspent')
  async handleBudgetOverspent(event: BudgetOverspentEvent) {
    this.logger.warn(
      `Budget overspent: ${event.categoryName} in budget ${event.budgetId} for household ${event.householdId}`
    );

    try {
      // Create high-priority financial insight
      await this.prisma.financialInsight.create({
        data: {
          householdId: event.householdId,
          insightType: 'BUDGET_OVERSPENT',
          title: `Budget Exceeded: ${event.categoryName}`,
          description: `You've exceeded your ${event.categoryName} budget by ${this.formatCurrency(event.overspentAmountCents)}. Consider reviewing your spending or adjusting your budget allocation.`,
          data: {
            budgetId: event.budgetId,
            categoryId: event.categoryId,
            categoryName: event.categoryName,
            allocatedAmountCents: event.allocatedAmountCents,
            spentAmountCents: event.spentAmountCents,
            overspentAmountCents: event.overspentAmountCents,
          },
          priority: 'HIGH',
          isActionable: true,
        },
      });

      // Log user event
      await this.logUserEvent(event.householdId, 'BUDGET_OVERSPENT', {
        budgetId: event.budgetId,
        categoryId: event.categoryId,
        categoryName: event.categoryName,
        overspentAmountCents: event.overspentAmountCents,
      });
    } catch (error) {
      this.logger.error(`Failed to handle budget overspent event: ${error.message}`);
    }
  }

  @OnEvent('budget.threshold.reached')
  async handleBudgetThresholdReached(event: BudgetThresholdReachedEvent) {
    this.logger.log(
      `Budget threshold reached: ${event.threshold}% for ${event.categoryName} in budget ${event.budgetId}`
    );

    try {
      const priority = event.threshold >= 90 ? 'HIGH' : 'MEDIUM';
      const title = `Budget Alert: ${event.categoryName} (${event.threshold}% used)`;
      const description = `You've used ${event.utilizationPercentage}% of your ${event.categoryName} budget. ${this.formatCurrency(event.remainingAmountCents)} remaining.`;

      // Create financial insight
      await this.prisma.financialInsight.create({
        data: {
          householdId: event.householdId,
          insightType: 'BUDGET_THRESHOLD_REACHED',
          title,
          description,
          data: {
            budgetId: event.budgetId,
            categoryId: event.categoryId,
            categoryName: event.categoryName,
            threshold: event.threshold,
            utilizationPercentage: event.utilizationPercentage,
            remainingAmountCents: event.remainingAmountCents,
          },
          priority,
          isActionable: true,
        },
      });

      // Log user event
      await this.logUserEvent(event.householdId, 'BUDGET_THRESHOLD_REACHED', {
        budgetId: event.budgetId,
        categoryId: event.categoryId,
        threshold: event.threshold,
        utilizationPercentage: event.utilizationPercentage,
      });
    } catch (error) {
      this.logger.error(`Failed to handle budget threshold reached event: ${error.message}`);
    }
  }

  @OnEvent('budget.period.ended')
  async handleBudgetPeriodEnded(event: BudgetPeriodEndedEvent) {
    this.logger.log(`Budget period ended: ${event.budgetName} for household ${event.householdId}`);

    try {
      const utilizationPercentage = event.totalAllocatedCents > 0 
        ? (event.totalSpentCents / event.totalAllocatedCents) * 100 
        : 0;

      // Create financial insight for budget period end
      await this.prisma.financialInsight.create({
        data: {
          householdId: event.householdId,
          insightType: 'BUDGET_PERIOD_ENDED',
          title: `Budget Period Completed: ${event.budgetName}`,
          description: `Your budget period has ended. You used ${utilizationPercentage.toFixed(1)}% of your allocated budget with ${this.formatCurrency(event.unusedAmountCents)} remaining.`,
          data: {
            budgetId: event.budgetId,
            budgetName: event.budgetName,
            totalAllocatedCents: event.totalAllocatedCents,
            totalSpentCents: event.totalSpentCents,
            unusedAmountCents: event.unusedAmountCents,
            utilizationPercentage,
            endDate: event.endDate,
          },
          priority: 'MEDIUM',
          isActionable: event.unusedAmountCents > 0, // Actionable if there's unused budget to carry over
        },
      });

      // Log user event
      await this.logUserEvent(event.householdId, 'BUDGET_PERIOD_ENDED', {
        budgetId: event.budgetId,
        budgetName: event.budgetName,
        utilizationPercentage,
        unusedAmountCents: event.unusedAmountCents,
      });
    } catch (error) {
      this.logger.error(`Failed to handle budget period ended event: ${error.message}`);
    }
  }

  @OnEvent('budget.carryover.created')
  async handleBudgetCarryOverCreated(event: BudgetCarryOverCreatedEvent) {
    this.logger.log(
      `Budget carry-over created: ${event.carryOverAmountCents} cents for household ${event.householdId}`
    );

    try {
      // Create financial insight for carry-over
      await this.prisma.financialInsight.create({
        data: {
          householdId: event.householdId,
          insightType: 'BUDGET_CARRYOVER_CREATED',
          title: 'Budget Carry-Over Applied',
          description: `${this.formatCurrency(event.carryOverAmountCents)} from your previous budget has been carried over to your new budget across ${event.categoriesWithCarryOver.length} categories.`,
          data: {
            originalBudgetId: event.originalBudgetId,
            newBudgetId: event.newBudgetId,
            carryOverAmountCents: event.carryOverAmountCents,
            categoriesWithCarryOver: event.categoriesWithCarryOver,
          },
          priority: 'LOW',
          isActionable: false,
        },
      });

      // Log user event
      await this.logUserEvent(event.householdId, 'BUDGET_CARRYOVER_CREATED', {
        originalBudgetId: event.originalBudgetId,
        newBudgetId: event.newBudgetId,
        carryOverAmountCents: event.carryOverAmountCents,
        categoriesCount: event.categoriesWithCarryOver.length,
      });

      // Clear cache
      await this.cacheService.del(`budgets:${event.householdId}`);
    } catch (error) {
      this.logger.error(`Failed to handle budget carry-over created event: ${error.message}`);
    }
  }

  private async logUserEvent(
    householdId: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<void> {
    try {
      // Get the first user from the household for logging
      const householdMember = await this.prisma.householdMember.findFirst({
        where: { householdId },
        include: { user: true },
      });

      if (householdMember) {
        await this.prisma.userEvent.create({
          data: {
            userId: householdMember.userId,
            householdId,
            eventType,
            eventData,
            resourceType: 'BUDGET',
            resourceId: eventData.budgetId,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to log user event: ${error.message}`);
    }
  }

  private formatCurrency(amountCents: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amountCents / 100);
  }
}
