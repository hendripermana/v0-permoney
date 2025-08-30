import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export enum RecurringTransactionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateRecurringTransactionDto {
  @ApiProperty({ description: 'Name for the recurring transaction' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the recurring transaction' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Amount in cents' })
  @IsNumber()
  @Min(1)
  amountCents: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'IDR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Source account ID' })
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ description: 'Transfer destination account ID' })
  @IsUUID()
  @IsOptional()
  transferAccountId?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Merchant name' })
  @IsString()
  @IsOptional()
  merchant?: string;

  @ApiProperty({
    description: 'Recurrence frequency',
    enum: RecurrenceFrequency,
  })
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @ApiPropertyOptional({
    description: 'Interval value (e.g., every 2 weeks)',
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  intervalValue?: number;

  @ApiProperty({ description: 'Start date for the recurring transaction' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'End date for the recurring transaction',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Maximum number of executions' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxExecutions?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateRecurringTransactionDto {
  @ApiPropertyOptional({ description: 'Name for the recurring transaction' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the recurring transaction',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Amount in cents' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  amountCents?: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Source account ID' })
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Transfer destination account ID' })
  @IsUUID()
  @IsOptional()
  transferAccountId?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Merchant name' })
  @IsString()
  @IsOptional()
  merchant?: string;

  @ApiPropertyOptional({
    description: 'Recurrence frequency',
    enum: RecurrenceFrequency,
  })
  @IsEnum(RecurrenceFrequency)
  @IsOptional()
  frequency?: RecurrenceFrequency;

  @ApiPropertyOptional({ description: 'Interval value (e.g., every 2 weeks)' })
  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  intervalValue?: number;

  @ApiPropertyOptional({
    description: 'Start date for the recurring transaction',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the recurring transaction',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Maximum number of executions' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxExecutions?: number;

  @ApiPropertyOptional({
    description: 'Status of the recurring transaction',
    enum: RecurringTransactionStatus,
  })
  @IsEnum(RecurringTransactionStatus)
  @IsOptional()
  status?: RecurringTransactionStatus;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RecurringTransactionFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: RecurringTransactionStatus,
  })
  @IsEnum(RecurringTransactionStatus)
  @IsOptional()
  status?: RecurringTransactionStatus;

  @ApiPropertyOptional({ description: 'Filter by account ID' })
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by frequency',
    enum: RecurrenceFrequency,
  })
  @IsEnum(RecurrenceFrequency)
  @IsOptional()
  frequency?: RecurrenceFrequency;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

export class RecurringTransactionResponseDto {
  @ApiProperty({ description: 'Recurring transaction ID' })
  id: string;

  @ApiProperty({ description: 'Household ID' })
  householdId: string;

  @ApiProperty({ description: 'Name of the recurring transaction' })
  name: string;

  @ApiProperty({ description: 'Description' })
  description: string;

  @ApiProperty({ description: 'Amount in cents' })
  amountCents: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Source account ID' })
  accountId: string;

  @ApiPropertyOptional({ description: 'Transfer destination account ID' })
  transferAccountId?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Merchant name' })
  merchant?: string;

  @ApiProperty({
    description: 'Recurrence frequency',
    enum: RecurrenceFrequency,
  })
  frequency: RecurrenceFrequency;

  @ApiProperty({ description: 'Interval value' })
  intervalValue: number;

  @ApiProperty({ description: 'Start date' })
  startDate: Date;

  @ApiPropertyOptional({ description: 'End date' })
  endDate?: Date;

  @ApiProperty({ description: 'Next execution date' })
  nextExecutionDate: Date;

  @ApiPropertyOptional({ description: 'Last execution date' })
  lastExecutionDate?: Date;

  @ApiProperty({ description: 'Number of executions completed' })
  executionCount: number;

  @ApiPropertyOptional({ description: 'Maximum number of executions' })
  maxExecutions?: number;

  @ApiProperty({ description: 'Status', enum: RecurringTransactionStatus })
  status: RecurringTransactionStatus;

  @ApiProperty({ description: 'Additional metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  // Related data
  @ApiPropertyOptional({ description: 'Account information' })
  account?: {
    id: string;
    name: string;
    type: string;
    currency: string;
  };

  @ApiPropertyOptional({ description: 'Transfer account information' })
  transferAccount?: {
    id: string;
    name: string;
    type: string;
    currency: string;
  };

  @ApiPropertyOptional({ description: 'Category information' })
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
}

export class RecurringTransactionExecutionDto {
  @ApiProperty({ description: 'Execution ID' })
  id: string;

  @ApiProperty({ description: 'Recurring transaction ID' })
  recurringTransactionId: string;

  @ApiPropertyOptional({ description: 'Created transaction ID' })
  transactionId?: string;

  @ApiProperty({ description: 'Scheduled execution date' })
  scheduledDate: Date;

  @ApiPropertyOptional({ description: 'Actual execution timestamp' })
  executedDate?: Date;

  @ApiProperty({ description: 'Execution status' })
  status: string;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  errorMessage?: string;

  @ApiProperty({ description: 'Number of retry attempts' })
  retryCount: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class ExecuteRecurringTransactionDto {
  @ApiProperty({ description: 'Recurring transaction ID' })
  @IsUUID()
  recurringTransactionId: string;

  @ApiPropertyOptional({ description: 'Override execution date' })
  @IsDateString()
  @IsOptional()
  executionDate?: string;

  @ApiPropertyOptional({ description: 'Force execution even if not due' })
  @IsOptional()
  force?: boolean;
}
