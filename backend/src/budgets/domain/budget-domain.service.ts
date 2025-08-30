import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BudgetAggregate, BudgetCreationData, BudgetUpdateData } from './budget-aggregate';
import { BudgetDomainEntity } from './budget.entity';
import { BudgetsRepository } from '../budgets.repository';
import {
  BudgetCreatedEvent,
  BudgetUpdatedEvent,
  BudgetDeletedEvent,
  BudgetCarryOverCreatedEvent,
} from '../events/budget.events';

export interface IBudgetDomainService {
  createBudget(householdId: string, data: BudgetCreationData): Promise<BudgetDomainEntity>;
  updateBudget(budgetId: string, householdId: string, data: BudgetUpdateData): Promise<BudgetDomainEntity>;
  deleteBudget(budgetId: string, householdId: string): Promise<void>;
  getBudget(budgetId: string, householdId: string): Promise<BudgetDomainEntity>;
  getBudgets(householdId: string, filters?: any): Promise<BudgetDomainEntity[]>;
  carryOverBudget(budgetId: string, householdId: string): Promise<BudgetDomainEntity>;
}

@Injectable()
export class BudgetDomainService implements IBudgetDomainService {
  private readonly logger = new Logger(BudgetDomainService.name);

  constructor(
    private readonly budgetsRepository: BudgetsRepository,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async createBudget(householdId: string, data: BudgetCreationData): Promise<BudgetDomainEntity> {
    this.logger.debug(`Creating budget for household ${householdId}`);

    try {
      // Get existing budgets to validate against overlaps
      const existingBudgets = await this.getBudgets(householdId, { isActive: true });

      // Create budget aggregate with business rules validation
      const budgetAggregate = BudgetAggregate.create(householdId, data, existingBudgets);
      const budgetEntity = budgetAggregate.getDomainEntity();

      // Persist to database
      const persistedBudget = await this.budgetsRepository.create(householdId, {
        name: data.name,
        period: data.period,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        currency: data.currency,
        categories: data.categories.map(cat => ({
          categoryId: cat.categoryId,
          allocatedAmountCents: cat.allocatedAmountCents,
          carryOverCents: cat.carryOverCents || 0,
        })),
      });

      const domainEntity = BudgetDomainEntity.fromPersistence(persistedBudget);

      // Emit domain event
      this.eventEmitter.emit(
        'budget.created',
        new BudgetCreatedEvent(
          domainEntity.id,
          domainEntity.householdId,
          domainEntity.name,
          domainEntity.totalAllocatedCents,
          domainEntity.period,
          domainEntity.startDate,
          domainEntity.endDate
        )
      );

      this.logger.log(`Budget created successfully: ${domainEntity.id}`);
      return domainEntity;
    } catch (error) {
      this.logger.error(`Failed to create budget: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateBudget(budgetId: string, householdId: string, data: BudgetUpdateData): Promise<BudgetDomainEntity> {
    this.logger.debug(`Updating budget ${budgetId} for household ${householdId}`);

    try {
      // Get existing budget
      const existingBudget = await this.getBudget(budgetId, householdId);
      
      // Get other budgets to validate against overlaps
      const otherBudgets = (await this.getBudgets(householdId, { isActive: true }))
        .filter(budget => budget.id !== budgetId);

      // Create aggregate and apply update with validation
      const budgetAggregate = BudgetAggregate.fromDomain(existingBudget);
      
      // Store previous values for event
      const previousValues = {
        name: existingBudget.name,
        period: existingBudget.period,
        startDate: existingBudget.startDate,
        endDate: existingBudget.endDate,
        isActive: existingBudget.isActive,
      };

      budgetAggregate.update(data, otherBudgets);
      const updatedEntity = budgetAggregate.getDomainEntity();

      // Persist changes
      const persistedBudget = await this.budgetsRepository.update(budgetId, householdId, {
        name: data.name,
        period: data.period,
        startDate: data.startDate?.toISOString(),
        endDate: data.endDate?.toISOString(),
        currency: data.currency,
        isActive: data.isActive,
        categories: data.categories?.map(cat => ({
          categoryId: cat.categoryId,
          allocatedAmountCents: cat.allocatedAmountCents,
          carryOverCents: cat.carryOverCents || 0,
        })),
      });

      const domainEntity = BudgetDomainEntity.fromPersistence(persistedBudget);

      // Emit domain event
      this.eventEmitter.emit(
        'budget.updated',
        new BudgetUpdatedEvent(budgetId, householdId, data, previousValues)
      );

      this.logger.log(`Budget updated successfully: ${budgetId}`);
      return domainEntity;
    } catch (error) {
      this.logger.error(`Failed to update budget: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteBudget(budgetId: string, householdId: string): Promise<void> {
    this.logger.debug(`Deleting budget ${budgetId} for household ${householdId}`);

    try {
      // Get budget to emit event with name
      const budget = await this.getBudget(budgetId, householdId);

      // Delete from repository
      await this.budgetsRepository.delete(budgetId, householdId);

      // Emit domain event
      this.eventEmitter.emit(
        'budget.deleted',
        new BudgetDeletedEvent(budgetId, householdId, budget.name)
      );

      this.logger.log(`Budget deleted successfully: ${budgetId}`);
    } catch (error) {
      this.logger.error(`Failed to delete budget: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getBudget(budgetId: string, householdId: string): Promise<BudgetDomainEntity> {
    try {
      const budget = await this.budgetsRepository.findById(budgetId, householdId);
      if (!budget) {
        throw new Error(`Budget ${budgetId} not found`);
      }
      return BudgetDomainEntity.fromPersistence(budget);
    } catch (error) {
      this.logger.error(`Failed to get budget: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getBudgets(householdId: string, filters: any = {}): Promise<BudgetDomainEntity[]> {
    try {
      const budgets = await this.budgetsRepository.findByHousehold(householdId, filters);
      return budgets.map(budget => BudgetDomainEntity.fromPersistence(budget));
    } catch (error) {
      this.logger.error(`Failed to get budgets: ${error.message}`, error.stack);
      throw error;
    }
  }

  async carryOverBudget(budgetId: string, householdId: string): Promise<BudgetDomainEntity> {
    this.logger.debug(`Creating carry-over budget from ${budgetId} for household ${householdId}`);

    try {
      // Get existing budget
      const existingBudget = await this.getBudget(budgetId, householdId);
      const budgetAggregate = BudgetAggregate.fromDomain(existingBudget);

      // Generate carry-over data
      const carryOverData = budgetAggregate.generateCarryOverData();
      
      if (carryOverData.length === 0) {
        this.logger.warn(`No unused budget to carry over for budget ${budgetId}`);
        return existingBudget;
      }

      // Calculate next period dates
      const nextStartDate = new Date(existingBudget.endDate);
      nextStartDate.setDate(nextStartDate.getDate() + 1);
      
      const nextEndDate = new Date(nextStartDate);
      if (existingBudget.period === 'MONTHLY') {
        nextEndDate.setMonth(nextEndDate.getMonth() + 1);
      } else if (existingBudget.period === 'WEEKLY') {
        nextEndDate.setDate(nextEndDate.getDate() + 7);
      } else if (existingBudget.period === 'YEARLY') {
        nextEndDate.setFullYear(nextEndDate.getFullYear() + 1);
      }

      // Create carry-over budget
      const carryOverBudgetData = budgetAggregate.createCarryOverBudget(nextStartDate, nextEndDate);
      const newBudget = await this.createBudget(householdId, carryOverBudgetData);

      // Emit carry-over event
      const totalCarryOverCents = carryOverData.reduce((sum, co) => sum + co.carryOverAmountCents, 0);
      this.eventEmitter.emit(
        'budget.carryover.created',
        new BudgetCarryOverCreatedEvent(
          budgetId,
          newBudget.id,
          householdId,
          totalCarryOverCents,
          carryOverData
        )
      );

      this.logger.log(`Carry-over budget created successfully: ${newBudget.id}`);
      return newBudget;
    } catch (error) {
      this.logger.error(`Failed to create carry-over budget: ${error.message}`, error.stack);
      throw error;
    }
  }

  async processTransactionForBudgets(
    householdId: string,
    categoryId: string,
    amountCents: number,
    transactionDate: Date
  ): Promise<void> {
    this.logger.debug(`Processing transaction for budgets: ${amountCents} cents in category ${categoryId}`);

    try {
      // Get active budgets that might be affected
      const activeBudgets = await this.getBudgets(householdId, { isActive: true });

      for (const budget of activeBudgets) {
        if (budget.isWithinPeriod(transactionDate) && budget.hasCategory(categoryId)) {
          // Update spent amount in repository
          await this.budgetsRepository.updateSpentAmount(budget.id, categoryId, amountCents);
          
          this.logger.debug(`Updated spent amount for budget ${budget.id}, category ${categoryId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process transaction for budgets: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getBudgetProgress(budgetId: string, householdId: string) {
    try {
      const budget = await this.getBudget(budgetId, householdId);
      
      // Get actual spending data
      const categoryIds = budget.categories.map(cat => cat.categoryId);
      const spendingData = await this.budgetsRepository.getSpendingByCategory(
        householdId,
        categoryIds,
        budget.startDate,
        budget.endDate
      );

      // Create aggregate with updated spending data
      const budgetAggregate = BudgetAggregate.fromDomain(budget);
      
      // Update spending amounts (in real implementation, this would be handled differently)
      const spendingMap = new Map(spendingData.map(item => [item.categoryId, item.totalSpentCents]));
      
      // Return progress data
      return budgetAggregate.getBudgetProgress();
    } catch (error) {
      this.logger.error(`Failed to get budget progress: ${error.message}`, error.stack);
      throw error;
    }
  }
}
