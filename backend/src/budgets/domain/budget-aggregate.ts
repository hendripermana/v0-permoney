import { BudgetDomainEntity, BudgetCategoryDomainEntity } from './budget.entity';
import { BudgetPeriod } from '@prisma/client';

export interface BudgetCreationData {
  name: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  currency: string;
  categories: Array<{
    categoryId: string;
    allocatedAmountCents: number;
    carryOverCents?: number;
  }>;
}

export interface BudgetUpdateData {
  name?: string;
  period?: BudgetPeriod;
  startDate?: Date;
  endDate?: Date;
  currency?: string;
  isActive?: boolean;
  categories?: Array<{
    categoryId: string;
    allocatedAmountCents: number;
    carryOverCents?: number;
  }>;
}

export class BudgetAggregate {
  private constructor(private budget: BudgetDomainEntity) {}

  static create(
    householdId: string,
    data: BudgetCreationData,
    existingBudgets: BudgetDomainEntity[] = []
  ): BudgetAggregate {
    // Validate business rules
    this.validateCreationRules(data, existingBudgets);

    const totalAllocatedCents = data.categories.reduce(
      (sum, cat) => sum + cat.allocatedAmountCents + (cat.carryOverCents || 0),
      0
    );

    // Create domain entity (simplified - in real implementation, you'd generate proper IDs)
    const budgetEntity = new BudgetDomainEntity(
      `budget-${Date.now()}`, // Temporary ID generation
      householdId,
      data.name,
      data.period,
      totalAllocatedCents,
      data.currency,
      data.startDate,
      data.endDate,
      true,
      data.categories.map((cat, index) => new BudgetCategoryDomainEntity(
        `budget-cat-${Date.now()}-${index}`,
        `budget-${Date.now()}`,
        cat.categoryId,
        cat.allocatedAmountCents,
        0, // Initial spent amount
        cat.carryOverCents || 0,
        { id: cat.categoryId, name: 'Category', icon: null, color: null }, // Simplified
        new Date(),
        new Date()
      )),
      new Date(),
      new Date()
    );

    return new BudgetAggregate(budgetEntity);
  }

  static fromDomain(budget: BudgetDomainEntity): BudgetAggregate {
    return new BudgetAggregate(budget);
  }

  update(data: BudgetUpdateData, existingBudgets: BudgetDomainEntity[] = []): void {
    this.validateUpdateRules(data, existingBudgets);

    // Create updated entity (in real implementation, you'd use proper immutable updates)
    const updatedCategories = data.categories 
      ? data.categories.map((cat, index) => new BudgetCategoryDomainEntity(
          `budget-cat-${Date.now()}-${index}`,
          this.budget.id,
          cat.categoryId,
          cat.allocatedAmountCents,
          0, // Keep existing spent amount in real implementation
          cat.carryOverCents || 0,
          { id: cat.categoryId, name: 'Category', icon: null, color: null },
          new Date(),
          new Date()
        ))
      : this.budget.categories;

    const totalAllocatedCents = data.categories
      ? data.categories.reduce((sum, cat) => sum + cat.allocatedAmountCents + (cat.carryOverCents || 0), 0)
      : this.budget.totalAllocatedCents;

    this.budget = new BudgetDomainEntity(
      this.budget.id,
      this.budget.householdId,
      data.name ?? this.budget.name,
      data.period ?? this.budget.period,
      totalAllocatedCents,
      data.currency ?? this.budget.currency,
      data.startDate ?? this.budget.startDate,
      data.endDate ?? this.budget.endDate,
      data.isActive ?? this.budget.isActive,
      updatedCategories,
      this.budget.createdAt,
      new Date()
    );
  }

  processTransaction(categoryId: string, amountCents: number, transactionDate: Date): void {
    if (!this.budget.isWithinPeriod(transactionDate)) {
      throw new Error('Transaction date is outside budget period');
    }

    if (!this.budget.hasCategory(categoryId)) {
      throw new Error('Category not found in budget');
    }

    // In real implementation, you'd update the spent amount properly
    // This is a simplified version for demonstration
  }

  generateCarryOverData(): Array<{
    categoryId: string;
    categoryName: string;
    carryOverAmountCents: number;
  }> {
    return this.budget.getCategoriesWithUnusedBudget().map(category => ({
      categoryId: category.categoryId,
      categoryName: category.category.name,
      carryOverAmountCents: category.getRemainingAmount(),
    }));
  }

  createCarryOverBudget(nextPeriodStart: Date, nextPeriodEnd: Date): BudgetCreationData {
    const carryOverData = this.generateCarryOverData();
    
    return {
      name: `${this.budget.name} (Carry-over)`,
      period: this.budget.period,
      startDate: nextPeriodStart,
      endDate: nextPeriodEnd,
      currency: this.budget.currency,
      categories: this.budget.categories.map(category => {
        const carryOver = carryOverData.find(co => co.categoryId === category.categoryId);
        return {
          categoryId: category.categoryId,
          allocatedAmountCents: category.allocatedAmountCents,
          carryOverCents: carryOver?.carryOverAmountCents || 0,
        };
      }),
    };
  }

  getBudgetProgress(): {
    totalAllocatedCents: number;
    totalSpentCents: number;
    totalRemainingCents: number;
    utilizationPercentage: number;
    isOverBudget: boolean;
    overBudgetAmountCents: number;
    categories: Array<{
      categoryId: string;
      categoryName: string;
      allocatedAmountCents: number;
      spentAmountCents: number;
      remainingAmountCents: number;
      utilizationPercentage: number;
      isOverspent: boolean;
      overspentAmountCents: number;
    }>;
  } {
    return {
      totalAllocatedCents: this.budget.totalAllocatedCents,
      totalSpentCents: this.budget.calculateTotalSpent(),
      totalRemainingCents: this.budget.getUnusedBudgetAmount(),
      utilizationPercentage: this.budget.calculateUtilizationPercentage(),
      isOverBudget: this.budget.isOverBudget(),
      overBudgetAmountCents: this.budget.getOverBudgetAmount(),
      categories: this.budget.categories.map(category => ({
        categoryId: category.categoryId,
        categoryName: category.category.name,
        allocatedAmountCents: category.getTotalAllocatedAmount(),
        spentAmountCents: category.spentAmountCents,
        remainingAmountCents: category.getRemainingAmount(),
        utilizationPercentage: category.getUtilizationPercentage(),
        isOverspent: category.isOverspent(),
        overspentAmountCents: category.getOverspentAmount(),
      })),
    };
  }

  getDomainEntity(): BudgetDomainEntity {
    return this.budget;
  }

  private static validateCreationRules(
    data: BudgetCreationData,
    existingBudgets: BudgetDomainEntity[]
  ): void {
    // Validate date range
    if (data.startDate >= data.endDate) {
      throw new Error('Start date must be before end date');
    }

    // Validate period consistency
    this.validatePeriodConsistency(data.period, data.startDate, data.endDate);

    // Validate no overlapping budgets
    const hasOverlap = existingBudgets.some(budget => {
      if (!budget.isActive) return false;
      
      return (
        (data.startDate >= budget.startDate && data.startDate <= budget.endDate) ||
        (data.endDate >= budget.startDate && data.endDate <= budget.endDate) ||
        (data.startDate <= budget.startDate && data.endDate >= budget.endDate)
      );
    });

    if (hasOverlap) {
      throw new Error('Budget period overlaps with existing active budget');
    }

    // Validate categories
    if (!data.categories || data.categories.length === 0) {
      throw new Error('At least one category allocation is required');
    }

    // Check for duplicate categories
    const categoryIds = data.categories.map(cat => cat.categoryId);
    const uniqueCategoryIds = new Set(categoryIds);
    if (categoryIds.length !== uniqueCategoryIds.size) {
      throw new Error('Duplicate category allocations are not allowed');
    }

    // Validate allocation amounts
    data.categories.forEach((category, index) => {
      if (category.allocatedAmountCents < 0) {
        throw new Error(`Category allocation at index ${index} cannot be negative`);
      }

      if (category.allocatedAmountCents > 100000000) { // 1 million IDR
        throw new Error(`Category allocation at index ${index} exceeds maximum limit`);
      }

      if (category.carryOverCents && category.carryOverCents < 0) {
        throw new Error(`Carry-over amount at index ${index} cannot be negative`);
      }
    });

    // Validate total budget limits
    const totalAllocated = data.categories.reduce(
      (sum, cat) => sum + cat.allocatedAmountCents + (cat.carryOverCents || 0),
      0
    );

    const maxBudgetLimit = 100000000000; // 1 billion IDR
    if (totalAllocated > maxBudgetLimit) {
      throw new Error('Total budget allocation exceeds maximum limit');
    }

    const minBudgetLimit = 1000000; // 10,000 IDR
    if (totalAllocated < minBudgetLimit) {
      throw new Error('Total budget allocation is below minimum limit');
    }
  }

  private validateUpdateRules(
    data: BudgetUpdateData,
    existingBudgets: BudgetDomainEntity[]
  ): void {
    // Validate date range if provided
    if (data.startDate && data.endDate) {
      if (data.startDate >= data.endDate) {
        throw new Error('Start date must be before end date');
      }
    }

    // Validate period consistency if both period and dates are provided
    if (data.period && data.startDate && data.endDate) {
      BudgetAggregate.validatePeriodConsistency(data.period, data.startDate, data.endDate);
    }

    // Validate no overlapping budgets if dates are being changed
    if (data.startDate || data.endDate) {
      const startDate = data.startDate || this.budget.startDate;
      const endDate = data.endDate || this.budget.endDate;

      const hasOverlap = existingBudgets.some(budget => {
        if (!budget.isActive || budget.id === this.budget.id) return false;
        
        return (
          (startDate >= budget.startDate && startDate <= budget.endDate) ||
          (endDate >= budget.startDate && endDate <= budget.endDate) ||
          (startDate <= budget.startDate && endDate >= budget.endDate)
        );
      });

      if (hasOverlap) {
        throw new Error('Budget period overlaps with existing active budget');
      }
    }

    // Validate categories if provided
    if (data.categories) {
      if (data.categories.length === 0) {
        throw new Error('At least one category allocation is required');
      }

      // Check for duplicate categories
      const categoryIds = data.categories.map(cat => cat.categoryId);
      const uniqueCategoryIds = new Set(categoryIds);
      if (categoryIds.length !== uniqueCategoryIds.size) {
        throw new Error('Duplicate category allocations are not allowed');
      }

      // Validate allocation amounts
      data.categories.forEach((category, index) => {
        if (category.allocatedAmountCents < 0) {
          throw new Error(`Category allocation at index ${index} cannot be negative`);
        }

        if (category.allocatedAmountCents > 100000000) {
          throw new Error(`Category allocation at index ${index} exceeds maximum limit`);
        }

        if (category.carryOverCents && category.carryOverCents < 0) {
          throw new Error(`Carry-over amount at index ${index} cannot be negative`);
        }
      });

      // Validate total budget limits
      const totalAllocated = data.categories.reduce(
        (sum, cat) => sum + cat.allocatedAmountCents + (cat.carryOverCents || 0),
        0
      );

      const maxBudgetLimit = 100000000000;
      if (totalAllocated > maxBudgetLimit) {
        throw new Error('Total budget allocation exceeds maximum limit');
      }

      const minBudgetLimit = 1000000;
      if (totalAllocated < minBudgetLimit) {
        throw new Error('Total budget allocation is below minimum limit');
      }
    }
  }

  private static validatePeriodConsistency(
    period: BudgetPeriod,
    startDate: Date,
    endDate: Date
  ): void {
    const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (period) {
      case BudgetPeriod.WEEKLY:
        if (diffInDays < 6 || diffInDays > 8) {
          throw new Error('Weekly budget period should be approximately 7 days');
        }
        break;
      case BudgetPeriod.MONTHLY:
        if (diffInDays < 28 || diffInDays > 32) {
          throw new Error('Monthly budget period should be approximately 30 days');
        }
        break;
      case BudgetPeriod.YEARLY:
        if (diffInDays < 360 || diffInDays > 370) {
          throw new Error('Yearly budget period should be approximately 365 days');
        }
        break;
    }
  }
}
