import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BudgetsRepository } from '../budgets.repository';
import { BudgetsService } from '../budgets.service';
import {
  BudgetPeriodEndedEvent,
  BudgetOverspentEvent,
  BudgetThresholdReachedEvent,
} from '../events/budget.events';

@Injectable()
export class BudgetScheduler {
  private readonly logger = new Logger(BudgetScheduler.name);

  constructor(
    private budgetsRepository: BudgetsRepository,
    private budgetsService: BudgetsService,
    private eventEmitter: EventEmitter2
  ) {}

  // Run every hour to check for budget alerts
  @Cron(CronExpression.EVERY_HOUR)
  async checkBudgetAlerts() {
    this.logger.log('Checking budget alerts...');

    try {
      // Get all active budgets
      const households = await this.getAllHouseholdsWithActiveBudgets();

      for (const household of households) {
        const budgets = await this.budgetsRepository.findByHousehold(household.id, {
          isActive: true,
        });

        for (const budget of budgets) {
          await this.checkBudgetThresholds(budget.id, household.id);
        }
      }

      this.logger.log('Budget alerts check completed');
    } catch (error) {
      this.logger.error(`Failed to check budget alerts: ${error.message}`);
    }
  }

  // Run daily at midnight to check for ended budget periods
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkEndedBudgetPeriods() {
    this.logger.log('Checking for ended budget periods...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find budgets that ended yesterday
      const endedBudgets = await this.getEndedBudgets(today);

      for (const budget of endedBudgets) {
        const progress = await this.budgetsService.getBudgetProgress(budget.id, budget.householdId);

        // Emit budget period ended event
        this.eventEmitter.emit(
          'budget.period.ended',
          new BudgetPeriodEndedEvent(
            budget.id,
            budget.householdId,
            budget.name,
            budget.totalAllocatedCents,
            progress.totalSpentCents,
            progress.totalRemainingCents,
            budget.endDate
          )
        );

        // Deactivate the budget
        await this.budgetsRepository.update(budget.id, budget.householdId, {
          isActive: false,
        });
      }

      this.logger.log(`Processed ${endedBudgets.length} ended budget periods`);
    } catch (error) {
      this.logger.error(`Failed to check ended budget periods: ${error.message}`);
    }
  }

  // Run weekly on Sundays to generate budget recommendations
  @Cron(CronExpression.EVERY_WEEK)
  async generateWeeklyBudgetRecommendations() {
    this.logger.log('Generating weekly budget recommendations...');

    try {
      const households = await this.getAllHouseholdsWithActiveBudgets();

      for (const household of households) {
        const recommendations = await this.budgetsService.generateBudgetRecommendations(household.id);

        if (recommendations.length > 0) {
          // Create financial insights for recommendations
          await this.createRecommendationInsights(household.id, recommendations);
        }
      }

      this.logger.log('Weekly budget recommendations generated');
    } catch (error) {
      this.logger.error(`Failed to generate weekly budget recommendations: ${error.message}`);
    }
  }

  // Run monthly on the 1st to suggest budget carry-overs
  @Cron('0 0 1 * *') // First day of every month at midnight
  async suggestBudgetCarryOvers() {
    this.logger.log('Checking for budget carry-over opportunities...');

    try {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);

      const endOfLastMonth = new Date(lastMonth);
      endOfLastMonth.setMonth(endOfLastMonth.getMonth() + 1);
      endOfLastMonth.setDate(0);

      // Find budgets that ended last month with unused amounts
      const budgetsWithUnusedAmounts = await this.getBudgetsWithUnusedAmounts(
        lastMonth,
        endOfLastMonth
      );

      for (const budget of budgetsWithUnusedAmounts) {
        const progress = await this.budgetsService.getBudgetProgress(budget.id, budget.householdId);

        if (progress.totalRemainingCents > 0) {
          await this.createCarryOverSuggestion(budget, progress);
        }
      }

      this.logger.log('Budget carry-over suggestions completed');
    } catch (error) {
      this.logger.error(`Failed to suggest budget carry-overs: ${error.message}`);
    }
  }

  private async checkBudgetThresholds(budgetId: string, householdId: string) {
    try {
      const progress = await this.budgetsService.getBudgetProgress(budgetId, householdId);

      for (const category of progress.categories) {
        // Check for overspending
        if (category.isOverspent) {
          this.eventEmitter.emit(
            'budget.overspent',
            new BudgetOverspentEvent(
              budgetId,
              householdId,
              category.categoryId,
              category.categoryName,
              category.allocatedAmountCents,
              category.spentAmountCents,
              category.overspentAmountCents
            )
          );
        }
        // Check for threshold alerts (75%, 90%)
        else if (category.utilizationPercentage >= 90) {
          this.eventEmitter.emit(
            'budget.threshold.reached',
            new BudgetThresholdReachedEvent(
              budgetId,
              householdId,
              category.categoryId,
              category.categoryName,
              90,
              category.utilizationPercentage,
              category.remainingAmountCents
            )
          );
        } else if (category.utilizationPercentage >= 75) {
          this.eventEmitter.emit(
            'budget.threshold.reached',
            new BudgetThresholdReachedEvent(
              budgetId,
              householdId,
              category.categoryId,
              category.categoryName,
              75,
              category.utilizationPercentage,
              category.remainingAmountCents
            )
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to check budget thresholds for budget ${budgetId}: ${error.message}`);
    }
  }

  private async getAllHouseholdsWithActiveBudgets() {
    // This is a simplified query - in a real implementation, you'd optimize this
    const budgets = await this.budgetsRepository.findByHousehold('', { isActive: true });
    const householdIds = Array.from(new Set(budgets.map(b => b.householdId)));
    
    return householdIds.map(id => ({ id }));
  }

  private async getEndedBudgets(today: Date) {
    // This would need to be implemented in the repository
    // For now, returning empty array as placeholder
    return [];
  }

  private async getBudgetsWithUnusedAmounts(startDate: Date, endDate: Date) {
    // This would need to be implemented in the repository
    // For now, returning empty array as placeholder
    return [];
  }

  private async createRecommendationInsights(householdId: string, recommendations: any[]) {
    // Implementation would create financial insights for recommendations
    this.logger.log(`Created ${recommendations.length} recommendation insights for household ${householdId}`);
  }

  private async createCarryOverSuggestion(budget: any, progress: any) {
    // Implementation would create carry-over suggestions
    this.logger.log(`Created carry-over suggestion for budget ${budget.id}`);
  }
}
