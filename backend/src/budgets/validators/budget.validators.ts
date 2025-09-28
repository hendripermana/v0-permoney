import { Injectable, BadRequestException } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';
import { BudgetsRepository } from '../budgets.repository';
import { CreateBudgetDto, UpdateBudgetDto } from '../dto';
import { BudgetPeriod } from '../../../../node_modules/.prisma/client';

@Injectable()
export class BudgetValidators {
  constructor(private budgetsRepository: BudgetsRepository) {}

  async validateBudgetCreation(householdId: string, data: CreateBudgetDto): Promise<void> {
    // Validate date range
    this.validateDateRange(data.startDate, data.endDate);

    // Validate period consistency
    this.validatePeriodConsistency(data.period, data.startDate, data.endDate);

    // Validate category allocations
    this.validateCategoryAllocations(data.categories);

    // Check for overlapping budgets
    await this.validateNoOverlappingBudgets(householdId, data.startDate, data.endDate);

    // Validate budget limits
    this.validateBudgetLimits(data);
  }

  async validateBudgetUpdate(
    budgetId: string,
    householdId: string,
    data: UpdateBudgetDto
  ): Promise<void> {
    // Validate date range if provided
    if (data.startDate && data.endDate) {
      this.validateDateRange(data.startDate, data.endDate);
    }

    // Validate period consistency if both period and dates are provided
    if (data.period && data.startDate && data.endDate) {
      this.validatePeriodConsistency(data.period, data.startDate, data.endDate);
    }

    // Validate category allocations if provided
    if (data.categories) {
      this.validateCategoryAllocations(data.categories);
    }

    // Check for overlapping budgets if dates are being changed
    if (data.startDate || data.endDate) {
      const existingBudget = await this.budgetsRepository.findById(budgetId, householdId);
      if (!existingBudget) {
        throw new BadRequestException('Budget not found');
      }

      const startDate = data.startDate || existingBudget.startDate.toISOString();
      const endDate = data.endDate || existingBudget.endDate.toISOString();

      await this.validateNoOverlappingBudgets(householdId, startDate, endDate, budgetId);
    }

    // Validate budget limits if categories are being updated
    if (data.categories) {
      this.validateBudgetLimits({ ...data, categories: data.categories });
    }
  }

  private validateDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Validate dates are not too far in the past
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (start < oneYearAgo) {
      throw new BadRequestException('Start date cannot be more than one year in the past');
    }

    // Validate dates are not too far in the future
    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

    if (end > twoYearsFromNow) {
      throw new BadRequestException('End date cannot be more than two years in the future');
    }
  }

  private validatePeriodConsistency(
    period: BudgetPeriod,
    startDate: string,
    endDate: string
  ): void {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    switch (period) {
      case BudgetPeriod.WEEKLY:
        if (diffInDays < 6 || diffInDays > 8) {
          throw new BadRequestException('Weekly budget period should be approximately 7 days');
        }
        break;
      case BudgetPeriod.MONTHLY:
        if (diffInDays < 28 || diffInDays > 32) {
          throw new BadRequestException('Monthly budget period should be approximately 30 days');
        }
        break;
      case BudgetPeriod.YEARLY:
        if (diffInDays < 360 || diffInDays > 370) {
          throw new BadRequestException('Yearly budget period should be approximately 365 days');
        }
        break;
    }
  }

  private validateCategoryAllocations(categories: Array<{ categoryId: string; allocatedAmountCents: number; carryOverCents?: number }>): void {
    if (!categories || categories.length === 0) {
      throw new BadRequestException('At least one category allocation is required');
    }

    // Check for duplicate categories
    const categoryIds = categories.map(cat => cat.categoryId);
    const uniqueCategoryIds = new Set(categoryIds);
    if (categoryIds.length !== uniqueCategoryIds.size) {
      throw new BadRequestException('Duplicate category allocations are not allowed');
    }

    // Validate allocation amounts
    categories.forEach((category, index) => {
      if (category.allocatedAmountCents < 0) {
        throw new BadRequestException(`Category allocation at index ${index} cannot be negative`);
      }

      if (category.allocatedAmountCents > 100000000) { // 1 million IDR
        throw new BadRequestException(`Category allocation at index ${index} exceeds maximum limit`);
      }

      if (category.carryOverCents && category.carryOverCents < 0) {
        throw new BadRequestException(`Carry-over amount at index ${index} cannot be negative`);
      }
    });
  }

  private async validateNoOverlappingBudgets(
    householdId: string,
    startDate: string,
    endDate: string,
    excludeBudgetId?: string
  ): Promise<void> {
    const existingBudgets = await this.budgetsRepository.findByHousehold(householdId, {
      isActive: true,
    });

    const start = new Date(startDate);
    const end = new Date(endDate);

    const hasOverlap = existingBudgets.some(budget => {
      if (excludeBudgetId && budget.id === excludeBudgetId) {
        return false;
      }

      const budgetStart = new Date(budget.startDate);
      const budgetEnd = new Date(budget.endDate);

      return (
        (start >= budgetStart && start <= budgetEnd) ||
        (end >= budgetStart && end <= budgetEnd) ||
        (start <= budgetStart && end >= budgetEnd)
      );
    });

    if (hasOverlap) {
      throw new BadRequestException('Budget period overlaps with existing active budget');
    }
  }

  private validateBudgetLimits(data: { categories: Array<{ allocatedAmountCents: number; carryOverCents?: number }> }): void {
    const totalAllocated = data.categories.reduce(
      (sum, cat) => sum + cat.allocatedAmountCents + (cat.carryOverCents || 0),
      0
    );

    // Maximum budget limit: 1 billion IDR (10 million USD equivalent)
    const maxBudgetLimit = 100000000000;
    if (totalAllocated > maxBudgetLimit) {
      throw new BadRequestException('Total budget allocation exceeds maximum limit');
    }

    // Minimum budget limit: 10,000 IDR
    const minBudgetLimit = 1000000;
    if (totalAllocated < minBudgetLimit) {
      throw new BadRequestException('Total budget allocation is below minimum limit');
    }
  }

  validateBudgetProgress(
    allocatedAmountCents: number,
    spentAmountCents: number
  ): {
    utilizationPercentage: number;
    isOverspent: boolean;
    overspentAmountCents: number;
    remainingAmountCents: number;
  } {
    const utilizationPercentage = allocatedAmountCents > 0 
      ? (spentAmountCents / allocatedAmountCents) * 100 
      : 0;
    
    const isOverspent = spentAmountCents > allocatedAmountCents;
    const overspentAmountCents = isOverspent ? spentAmountCents - allocatedAmountCents : 0;
    const remainingAmountCents = allocatedAmountCents - spentAmountCents;

    return {
      utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
      isOverspent,
      overspentAmountCents,
      remainingAmountCents,
    };
  }

  validateRecommendationConfidence(
    historicalDataPoints: number,
    varianceCoefficient: number,
    seasonalityFactor: number
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence with more historical data
    if (historicalDataPoints >= 6) confidence += 0.2;
    if (historicalDataPoints >= 12) confidence += 0.1;

    // Decrease confidence with high variance
    if (varianceCoefficient > 0.5) confidence -= 0.2;
    if (varianceCoefficient > 1.0) confidence -= 0.1;

    // Adjust for seasonality
    confidence += seasonalityFactor * 0.1;

    return Math.max(0.1, Math.min(0.95, confidence));
  }
}

// Custom decorators used in DTOs
export function IsValidBudgetPeriod(
  startField: string,
  endField: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsValidBudgetPeriod',
      target: object.constructor,
      propertyName,
      constraints: [startField, endField],
      options: validationOptions,
      validator: {
        validate(_value: any, args: ValidationArguments) {
          const [startKey, endKey] = args.constraints as [string, string];
          const start = new Date((args.object as any)[startKey]);
          const end = new Date((args.object as any)[endKey]);
          return start instanceof Date && !isNaN(start.getTime()) && end instanceof Date && !isNaN(end.getTime()) && start < end;
        },
      },
    });
  };
}

export function IsValidBudgetAllocation(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsValidBudgetAllocation',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: Array<{ allocatedAmountCents: number; carryOverCents?: number }>) {
          if (!Array.isArray(value) || value.length === 0) return false;
          return value.every((v) => v.allocatedAmountCents >= 0 && (v.carryOverCents ?? 0) >= 0);
        },
      },
    });
  };
}

export function IsFutureOrCurrentDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsFutureOrCurrentDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          const date = new Date(value);
          if (!(date instanceof Date) || isNaN(date.getTime())) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today;
        },
      },
    });
  };
}

// Constraint classes for use in DTOs
@ValidatorConstraint({ name: 'IsValidBudgetPeriodConstraint', async: false })
export class IsValidBudgetPeriodConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [startField, endField] = args.constraints;
    const object = args.object as any;

    const startDate = object[startField];
    const endDate = object[endField];

    if (!startDate || !endDate) return false;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

    return start < end;
  }

  defaultMessage(args: ValidationArguments) {
    const [startField, endField] = args.constraints;
    return `${endField} must be after ${startField}`;
  }
}

@ValidatorConstraint({ name: 'IsValidBudgetAllocationConstraint', async: false })
export class IsValidBudgetAllocationConstraint implements ValidatorConstraintInterface {
  validate(value: Array<{ allocatedAmountCents: number; carryOverCents?: number }>, args: ValidationArguments) {
    if (!Array.isArray(value)) return false;

    return value.every(item => {
      return item.allocatedAmountCents > 0 &&
             (item.carryOverCents === undefined || item.carryOverCents >= 0);
    });
  }

  defaultMessage(args: ValidationArguments) {
    return 'Budget allocation must have positive allocated amounts and non-negative carry over amounts';
  }
}

@ValidatorConstraint({ name: 'IsFutureOrCurrentDateConstraint', async: false })
export class IsFutureOrCurrentDateConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const date = new Date(value);
    if (!(date instanceof Date) || isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date >= today;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Date must be today or in the future';
  }
}
