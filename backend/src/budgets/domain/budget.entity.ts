import { BudgetPeriod } from '../../../../node_modules/.prisma/client';

export interface BudgetEntity {
  id: string;
  householdId: string;
  name: string;
  period: BudgetPeriod;
  totalAllocatedCents: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  categories: BudgetCategoryEntity[];
}

export interface BudgetCategoryEntity {
  id: string;
  budgetId: string;
  categoryId: string;
  allocatedAmountCents: number;
  spentAmountCents: number;
  carryOverCents: number;
  createdAt: Date;
  updatedAt: Date;
  category: CategoryInfo;
}

export interface CategoryInfo {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export class BudgetDomainEntity {
  constructor(
    public readonly id: string,
    public readonly householdId: string,
    public readonly name: string,
    public readonly period: BudgetPeriod,
    public readonly totalAllocatedCents: number,
    public readonly currency: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly isActive: boolean,
    public readonly categories: BudgetCategoryDomainEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromPersistence(data: BudgetEntity): BudgetDomainEntity {
    const coerceNumber = (value: any): number =>
      typeof value === 'bigint' ? Number(value) : (value as number);
    return new BudgetDomainEntity(
      data.id,
      data.householdId,
      data.name,
      data.period,
      coerceNumber((data as any).totalAllocatedCents),
      data.currency,
      data.startDate,
      data.endDate,
      data.isActive,
      data.categories.map(cat => BudgetCategoryDomainEntity.fromPersistence(cat as any)),
      data.createdAt,
      data.updatedAt
    );
  }

  calculateTotalSpent(): number {
    return this.categories.reduce((total, category) => total + category.spentAmountCents, 0);
  }

  calculateUtilizationPercentage(): number {
    const totalSpent = this.calculateTotalSpent();
    return this.totalAllocatedCents > 0 ? (totalSpent / this.totalAllocatedCents) * 100 : 0;
  }

  isOverBudget(): boolean {
    return this.calculateTotalSpent() > this.totalAllocatedCents;
  }

  getOverBudgetAmount(): number {
    const totalSpent = this.calculateTotalSpent();
    return totalSpent > this.totalAllocatedCents ? totalSpent - this.totalAllocatedCents : 0;
  }

  isWithinPeriod(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  hasCategory(categoryId: string): boolean {
    return this.categories.some(cat => cat.categoryId === categoryId);
  }

  getCategoryBudget(categoryId: string): BudgetCategoryDomainEntity | null {
    return this.categories.find(cat => cat.categoryId === categoryId) || null;
  }

  getUnusedBudgetAmount(): number {
    return Math.max(0, this.totalAllocatedCents - this.calculateTotalSpent());
  }

  getCategoriesWithUnusedBudget(): BudgetCategoryDomainEntity[] {
    return this.categories.filter(cat => cat.getRemainingAmount() > 0);
  }

  validatePeriodOverlap(otherBudget: BudgetDomainEntity): boolean {
    return (
      (this.startDate >= otherBudget.startDate && this.startDate <= otherBudget.endDate) ||
      (this.endDate >= otherBudget.startDate && this.endDate <= otherBudget.endDate) ||
      (this.startDate <= otherBudget.startDate && this.endDate >= otherBudget.endDate)
    );
  }
}

export class BudgetCategoryDomainEntity {
  constructor(
    public readonly id: string,
    public readonly budgetId: string,
    public readonly categoryId: string,
    public readonly allocatedAmountCents: number,
    public readonly spentAmountCents: number,
    public readonly carryOverCents: number,
    public readonly category: CategoryInfo,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromPersistence(data: BudgetCategoryEntity): BudgetCategoryDomainEntity {
    const coerceNumber = (value: any): number =>
      typeof value === 'bigint' ? Number(value) : (value as number);
    return new BudgetCategoryDomainEntity(
      data.id,
      data.budgetId,
      data.categoryId,
      coerceNumber((data as any).allocatedAmountCents),
      coerceNumber((data as any).spentAmountCents),
      coerceNumber((data as any).carryOverCents),
      data.category,
      data.createdAt,
      data.updatedAt
    );
  }

  getTotalAllocatedAmount(): number {
    return this.allocatedAmountCents + this.carryOverCents;
  }

  getRemainingAmount(): number {
    return this.getTotalAllocatedAmount() - this.spentAmountCents;
  }

  getUtilizationPercentage(): number {
    const totalAllocated = this.getTotalAllocatedAmount();
    return totalAllocated > 0 ? (this.spentAmountCents / totalAllocated) * 100 : 0;
  }

  isOverspent(): boolean {
    return this.spentAmountCents > this.getTotalAllocatedAmount();
  }

  getOverspentAmount(): number {
    return this.isOverspent() ? this.spentAmountCents - this.getTotalAllocatedAmount() : 0;
  }

  isNearingLimit(threshold = 90): boolean {
    return this.getUtilizationPercentage() >= threshold && !this.isOverspent();
  }

  canAccommodateExpense(amountCents: number): boolean {
    return this.getRemainingAmount() >= amountCents;
  }
}
