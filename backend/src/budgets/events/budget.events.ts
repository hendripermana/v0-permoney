export class BudgetCreatedEvent {
  constructor(
    public readonly budgetId: string,
    public readonly householdId: string,
    public readonly budgetName: string,
    public readonly totalAllocatedCents: number,
    public readonly period: string,
    public readonly startDate: Date,
    public readonly endDate: Date
  ) {}
}

export class BudgetUpdatedEvent {
  constructor(
    public readonly budgetId: string,
    public readonly householdId: string,
    public readonly changes: Record<string, any>,
    public readonly previousValues: Record<string, any>
  ) {}
}

export class BudgetDeletedEvent {
  constructor(
    public readonly budgetId: string,
    public readonly householdId: string,
    public readonly budgetName: string
  ) {}
}

export class BudgetOverspentEvent {
  constructor(
    public readonly budgetId: string,
    public readonly householdId: string,
    public readonly categoryId: string,
    public readonly categoryName: string,
    public readonly allocatedAmountCents: number,
    public readonly spentAmountCents: number,
    public readonly overspentAmountCents: number
  ) {}
}

export class BudgetThresholdReachedEvent {
  constructor(
    public readonly budgetId: string,
    public readonly householdId: string,
    public readonly categoryId: string,
    public readonly categoryName: string,
    public readonly threshold: number, // 75, 90, etc.
    public readonly utilizationPercentage: number,
    public readonly remainingAmountCents: number
  ) {}
}

export class BudgetPeriodEndedEvent {
  constructor(
    public readonly budgetId: string,
    public readonly householdId: string,
    public readonly budgetName: string,
    public readonly totalAllocatedCents: number,
    public readonly totalSpentCents: number,
    public readonly unusedAmountCents: number,
    public readonly endDate: Date
  ) {}
}

export class BudgetCarryOverCreatedEvent {
  constructor(
    public readonly originalBudgetId: string,
    public readonly newBudgetId: string,
    public readonly householdId: string,
    public readonly carryOverAmountCents: number,
    public readonly categoriesWithCarryOver: Array<{
      categoryId: string;
      categoryName: string;
      carryOverAmountCents: number;
    }>
  ) {}
}
