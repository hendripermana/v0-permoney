import { 
  IsNumber, 
  IsDateString, 
  IsOptional, 
  IsUUID, 
  Min, 
  Max,
  IsISO8601,
  ValidateIf
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateDebtPaymentDto {
  @IsNumber({}, { message: 'Payment amount must be a valid number' })
  @Min(0.01, { message: 'Payment amount must be greater than 0' })
  @Max(999999999.99, { message: 'Payment amount cannot exceed 999,999,999.99' })
  @Type(() => Number)
  @Transform(({ value }) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error('Payment amount must be a valid number');
    }
    return Math.round(num * 100) / 100; // Round to 2 decimal places
  })
  amount: number;

  @IsISO8601({ strict: true }, { message: 'Payment date must be a valid ISO 8601 date (YYYY-MM-DD)' })
  paymentDate: string;

  @IsNumber({}, { message: 'Principal amount must be a valid number' })
  @Min(0, { message: 'Principal amount cannot be negative' })
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

  @IsOptional()
  @IsNumber({}, { message: 'Interest/margin amount must be a valid number' })
  @Min(0, { message: 'Interest/margin amount cannot be negative' })
  @Max(999999999.99, { message: 'Interest/margin amount cannot exceed 999,999,999.99' })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 0;
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error('Interest/margin amount must be a valid number');
    }
    return Math.round(num * 100) / 100; // Round to 2 decimal places
  })
  interestAmount?: number = 0;

  @IsOptional()
  @IsUUID(4, { message: 'Transaction ID must be a valid UUID' })
  @ValidateIf(o => o.transactionId !== undefined && o.transactionId !== null && o.transactionId !== '')
  transactionId?: string; // Link to the transaction that represents this payment
}
