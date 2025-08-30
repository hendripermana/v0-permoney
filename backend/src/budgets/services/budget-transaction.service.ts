import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { BudgetsRepository } from '../budgets.repository';
import { BudgetValidators } from '../validators/budget.validators';
import {
  BudgetOverspentEvent,
  BudgetThresholdReachedEvent,
} from '../events/budget.events';

export interface TransactionCreatedEvent {
  transactionId: string;
  householdId: string;
  categoryId: string;
  amountCents: number;
  date: Date;
}

export interface TransactionUpdatedEvent {
  transactionId: string;
  householdId: string;
  oldCategoryId?: string;
  newCategoryId?: string;
  oldAmountCents: number;
  newAmountCents: number;
  date: Date;
}

export interface TransactionDeletedEvent {
  transactionId: string;
  householdId: string;
  categoryId: string;
  amountCents: number;
  date: Date;
}

@Injectable()
export class BudgetTransactionService {
  private readonly logger = new Logger(BudgetTransactionService.name);

  constructor(
    private budgetsRepository: BudgetsRepository,
    private budgetValidators: BudgetValidators,
    private eventEmitter: EventEmitter2
  ) {}

  @OnEvent('transaction.created')
  async handleTransactionCreated(event: TransactionCreatedEvent) {
    this.logger.debug(`Processing transaction created: ${event.transactionId}`);
    
    if (event.amountCents <= 0) {
      return; // Only process expense transactions
    }

    await this.updateBudgetSpending(
      event.householdId,
      event.categoryId,
      event.amountCents,
      event.date
    );
  }

  @OnEvent('transaction.updated')
  async handleTransactionUpdated(event: TransactionUpdatedEvent) {
    this.logger.debug(`Processing transaction updated: ${event.transactionId}`);

    // Revert old spending if category or amount changed
    if (event.oldCategoryId && event.oldAmountCents > 0) {
      await this.updateBudgetSpending(
        event.householdId,
        event.oldCategoryId,
        -event.oldAmountCents,
        event.date
      );
    }

    // Apply new spending
    if (event.newCategoryId && event.newAmountCents > 0) {
      await this.updateBudgetSpending(
        event.householdId,
        event.newCategoryId,
        event.newAmountCents,
        event.date
      );
    }
  }

  @OnEvent('transaction.deleted')
  async handleTransactionDeleted(event: TransactionDeletedEvent) {
    this.logger.debug(`Processing transaction deleted: ${event.transactionId}`);
    
    if (event.amountCents <= 0) {
      return; // Only process expense transactions
    }

    await this.updateBudgetSpending(
      event.householdId,
      event.categoryId,
      -event.amountCents,
      event.date
    );
  }

  private async updateBudgetSpending(
    householdId: string,
    categoryId: string,
    amountCents: number,
    transactionDate: Date
  ) {
    try {
      // Find active budgets that include this category and date
      const activeBudgets = await this.budgetsRepository.findByHousehold(householdId, {
        isActive: true,
      });

      for (const budget of activeBudgets) {
        // Check if transaction date falls within budget period
        if (transactionDate >= budget.startDate && transactionDate <= budget.endDate) {
          // Find the budget category
          const budgetCategory = budget.categories.find(bc => bc.categoryId === categoryId);
          
          if (budgetCategory) {
            // Update spent amount
            await this.budgetsRepository.updateSpentAmount(
              budget.id,
              categoryId,
              amountCents
            );

            // Check for budget alerts
            await this.checkBudgetAlerts(budget.id, householdId, categoryId);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to update budget spending: ${error.message}`, error.stack);
    }
  }

  private async checkBudgetAlerts(budgetId: string, householdId: string, categoryId: string) {
    try {
      // Get updated budget category
      const budget = await this.budgetsRepository.findById(budgetId, householdId);
      if (!budget) return;

      const budgetCategory = budget.categories.find(bc => bc.categoryId === categoryId);
      if (!budgetCategory) return;

      const allocatedCents = budgetCategory.allocatedAmountCents + budgetCategory.carryOverCents;
      const spentCents = budgetCategory.spentAmountCents;

      const progress = this.budgetValidators.validateBudgetProgress(Number(allocatedCents), Number(spentCents));

      // Emit overspent event
      if (progress.isOverspent) {
        this.eventEmitter.emit(
          'budget.overspent',
          new BudgetOverspentEvent(
            budgetId,
            householdId,
            categoryId,
            budgetCategory.category.name,
            Number(allocatedCents),
            Number(spentCents),
            progress.overspentAmountCents
          )
        );
      }
      // Emit threshold events
      else if (progress.utilizationPercentage >= 90) {
        this.eventEmitter.emit(
          'budget.threshold.reached',
          new BudgetThresholdReachedEvent(
            budgetId,
            householdId,
            categoryId,
            budgetCategory.category.name,
            90,
            progress.utilizationPercentage,
            progress.remainingAmountCents
          )
        );
      } else if (progress.utilizationPercentage >= 75) {
        this.eventEmitter.emit(
          'budget.threshold.reached',
          new BudgetThresholdReachedEvent(
            budgetId,
            householdId,
            categoryId,
            budgetCategory.category.name,
            75,
            progress.utilizationPercentage,
            progress.remainingAmountCents
          )
        );
      }
    } catch (error) {
      this.logger.error(`Failed to check budget alerts: ${error.message}`, error.stack);
    }
  }

  async recalculateBudgetSpending(budgetId: string, householdId: string): Promise<void> {
    try {
      const budget = await this.budgetsRepository.findById(budgetId, householdId);
      if (!budget) {
        throw new Error(`Budget ${budgetId} not found`);
      }

      // Get actual spending for each category
      const categoryIds = budget.categories.map(cat => cat.categoryId);
      const spendingData = await this.budgetsRepository.getSpendingByCategory(
        householdId,
        categoryIds,
        budget.startDate,
        budget.endDate
      );

      // Update each budget category with actual spending
      for (const spendingItem of spendingData) {
        const budgetCategory = budget.categories.find(bc => bc.categoryId === spendingItem.categoryId);
        if (budgetCategory) {
          // Reset and update spent amount
          await this.budgetsRepository.updateSpentAmount(
            budgetId,
            spendingItem.categoryId,
            spendingItem.totalSpentCents - Number(budgetCategory.spentAmountCents)
          );
        }
      }

      this.logger.log(`Recalculated budget spending for budget ${budgetId}`);
    } catch (error) {
      this.logger.error(`Failed to recalculate budget spending: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getBudgetUtilizationTrends(
    householdId: string,
    categoryId: string,
    months = 6
  ): Promise<{
    month: Date;
    budgetedAmountCents: number;
    spentAmountCents: number;
    utilizationPercentage: number;
  }[]> {
    try {
      const trends = [];
      const currentDate = new Date();

      for (let i = 0; i < months; i++) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

        // Find budget for this month
        const budgets = await this.budgetsRepository.findByHousehold(householdId, {
          startDate: monthStart.toISOString(),
          endDate: monthEnd.toISOString(),
        });

        let budgetedAmount = 0;
        let spentAmount = 0;

        for (const budget of budgets) {
          const budgetCategory = budget.categories.find(bc => bc.categoryId === categoryId);
          if (budgetCategory) {
            budgetedAmount += Number(budgetCategory.allocatedAmountCents) + Number(budgetCategory.carryOverCents);
            spentAmount += Number(budgetCategory.spentAmountCents);
          }
        }

        const utilizationPercentage = budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0;

        trends.unshift({
          month: monthStart,
          budgetedAmountCents: budgetedAmount,
          spentAmountCents: spentAmount,
          utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
        });
      }

      return trends;
    } catch (error) {
      this.logger.error(`Failed to get budget utilization trends: ${error.message}`, error.stack);
      throw error;
    }
  }
}
