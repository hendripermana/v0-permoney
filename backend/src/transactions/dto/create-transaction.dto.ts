import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID, IsArray, ValidateNested, IsNumber, Min, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateTransactionSplitDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @Min(1)
  amountCents: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTransactionDto {
  @IsNumber()
  @Min(1)
  amountCents: number;

  @IsString()
  @IsNotEmpty()
  currency = 'IDR';

  @IsOptional()
  @IsNumber()
  @Min(1)
  originalAmountCents?: number;

  @IsOptional()
  @IsString()
  originalCurrency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  merchant?: string;

  @IsOptional()
  @IsString()
  merchantName?: string;

  @IsOptional()
  @IsUUID()
  merchantId?: string;

  @IsDateString()
  date: string;

  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @IsOptional()
  @IsUUID()
  transferAccountId?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionSplitDto)
  splits?: CreateTransactionSplitDto[];

  @IsOptional()
  metadata?: Record<string, any>;
}
