import { 
  IsString, 
  IsEnum, 
  IsDateString, 
  IsArray, 
  ValidateNested, 
  IsOptional, 
  IsPositive, 
  Min, 
  Max,
  Length,
  Matches,
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BudgetPeriod } from '../../../../node_modules/.prisma/client';
import { IsValidBudgetPeriod, IsValidBudgetAllocation, IsFutureOrCurrentDate } from '../validators/budget.validators';

export class BudgetCategoryAllocationDto {
  @IsUUID(4, { message: 'Category ID must be a valid UUID' })
  categoryId: string;

  @IsPositive({ message: 'Allocated amount must be positive' })
  @Min(100, { message: 'Minimum allocation is 100 cents (1 IDR)' })
  @Max(100000000000, { message: 'Maximum allocation is 1 billion IDR' })
  @Transform(({ value }) => parseInt(value, 10))
  allocatedAmountCents: number;

  @IsOptional()
  @Min(0, { message: 'Carry over amount cannot be negative' })
  @Max(100000000000, { message: 'Maximum carry over is 1 billion IDR' })
  @Transform(({ value }) => value ? parseInt(value, 10) : 0)
  carryOverCents?: number;
}

export class CreateBudgetDto {
  @IsString({ message: 'Budget name must be a string' })
  @Length(1, 100, { message: 'Budget name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEnum(BudgetPeriod, { message: 'Period must be WEEKLY, MONTHLY, or YEARLY' })
  period: BudgetPeriod;

  @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
  @IsFutureOrCurrentDate({ message: 'Start date cannot be in the past' })
  startDate: string;

  @IsDateString({}, { message: 'End date must be a valid ISO date string' })
  endDate: string;

  @IsOptional()
  @IsString({ message: 'Currency must be a string' })
  @Length(3, 3, { message: 'Currency must be exactly 3 characters' })
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be 3 uppercase letters (e.g., IDR, USD)' })
  currency?: string;

  @IsArray({ message: 'Categories must be an array' })
  @ArrayMinSize(1, { message: 'At least one category allocation is required' })
  @ArrayMaxSize(50, { message: 'Maximum 50 category allocations allowed' })
  @ValidateNested({ each: true })
  @Type(() => BudgetCategoryAllocationDto)
  @IsValidBudgetAllocation({ message: 'Budget allocation validation failed' })
  categories: BudgetCategoryAllocationDto[];

  @IsValidBudgetPeriod('startDate', 'endDate', { 
    message: 'Budget period validation failed' 
  })
  validatePeriod?: boolean; // This is just for validation, not stored
}
