import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

export class BudgetNotFoundException extends NotFoundException {
  constructor(budgetId: string, householdId?: string) {
    const message = householdId 
      ? `Budget with ID ${budgetId} not found for household ${householdId}`
      : `Budget with ID ${budgetId} not found`;
    super(message);
  }
}

export class BudgetPeriodOverlapException extends ConflictException {
  constructor(startDate: Date, endDate: Date, existingBudgetName?: string) {
    const message = existingBudgetName
      ? `Budget period ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} overlaps with existing budget "${existingBudgetName}"`
      : `Budget period ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} overlaps with existing active budget`;
    super(message);
  }
}

export class InvalidBudgetPeriodException extends BadRequestException {
  constructor(startDate: Date, endDate: Date) {
    super(`Invalid budget period: start date ${startDate.toISOString().split('T')[0]} must be before end date ${endDate.toISOString().split('T')[0]}`);
  }
}

export class BudgetCategoryNotFoundException extends NotFoundException {
  constructor(categoryId: string, budgetId: string) {
    super(`Category ${categoryId} not found in budget ${budgetId}`);
  }
}

export class InvalidBudgetAllocationException extends BadRequestException {
  constructor(message: string) {
    super(`Invalid budget allocation: ${message}`);
  }
}

export class BudgetInactiveException extends BadRequestException {
  constructor(budgetId: string) {
    super(`Cannot perform operation on inactive budget ${budgetId}`);
  }
}

export class BudgetPeriodExpiredException extends BadRequestException {
  constructor(budgetId: string, endDate: Date) {
    super(`Budget ${budgetId} has expired on ${endDate.toISOString().split('T')[0]}`);
  }
}
