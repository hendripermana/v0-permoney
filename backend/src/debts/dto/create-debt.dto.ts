import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsNumber, 
  IsObject, 
  Min, 
  Max, 
  Length,
  Matches,
  ValidateIf,
  IsISO8601
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { DebtType } from '../../../../node_modules/.prisma/client';

export { DebtType };

export class CreateDebtDto {
  @IsEnum(DebtType, {
    message: 'Debt type must be one of: PERSONAL, CONVENTIONAL, ISLAMIC'
  })
  type: DebtType;

  @IsString({ message: 'Debt name must be a string' })
  @Length(1, 255, { message: 'Debt name must be between 1 and 255 characters' })
  name: string;

  @IsString({ message: 'Creditor name must be a string' })
  @Length(1, 255, { message: 'Creditor name must be between 1 and 255 characters' })
  creditor: string;

  @IsNumber({}, { message: 'Principal amount must be a valid number' })
  @Min(0.01, { message: 'Principal amount must be greater than 0' })
  @Max(999999999.99, { message: 'Principal amount cannot exceed 999,999,999.99' })
  @Type(() => Number)
  @Transform(({ value }) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error('Principal amount must be a valid number');
    }
    return Math.round(num * 100) / 100; // Round to 2 decimal places
  })
  principalAmount: number;

  @IsString({ message: 'Currency must be a valid currency code' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter ISO currency code (e.g., IDR, USD)' })
  currency?: string = 'IDR';

  @ValidateIf(o => o.type === DebtType.CONVENTIONAL)
  @IsNumber({}, { message: 'Interest rate must be a valid number for conventional debt' })
  @Min(0, { message: 'Interest rate cannot be negative' })
  @Max(1, { message: 'Interest rate cannot exceed 100% (1.0)' })
  @Type(() => Number)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  interestRate?: number; // Annual rate as decimal (e.g., 0.12 for 12%)

  @ValidateIf(o => o.type === DebtType.ISLAMIC)
  @IsNumber({}, { message: 'Margin rate must be a valid number for Islamic financing' })
  @Min(0, { message: 'Margin rate cannot be negative' })
  @Max(1, { message: 'Margin rate cannot exceed 100% (1.0)' })
  @Type(() => Number)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  marginRate?: number; // Margin rate as decimal

  @IsISO8601({ strict: true }, { message: 'Start date must be a valid ISO 8601 date (YYYY-MM-DD)' })
  startDate: string;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'Maturity date must be a valid ISO 8601 date (YYYY-MM-DD)' })
  @ValidateIf(o => o.maturityDate !== undefined && o.maturityDate !== null)
  maturityDate?: string;

  @IsObject({ message: 'Metadata must be a valid object' })
  @IsOptional()
  metadata?: Record<string, unknown> = {};
}
