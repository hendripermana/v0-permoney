import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionSuggestionDto {
  @ApiProperty({
    description: 'Transaction description',
    example: 'Coffee at Starbucks',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Transaction amount in cents',
    example: 4500,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'IDR',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Transaction date',
    example: '2024-01-15',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Merchant name',
    required: false,
    example: 'Starbucks',
  })
  @IsOptional()
  @IsString()
  merchant?: string;

  @ApiProperty({
    description: 'Suggested category ID',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  suggestedCategoryId?: string;

  @ApiProperty({
    description: 'Confidence score (0-1)',
    example: 0.85,
  })
  @IsNumber()
  confidence: number;

  @ApiProperty({
    description: 'Source of the suggestion',
    enum: ['RECEIPT', 'BANK_STATEMENT'],
    example: 'RECEIPT',
  })
  @IsEnum(['RECEIPT', 'BANK_STATEMENT'])
  source: 'RECEIPT' | 'BANK_STATEMENT';

  @ApiProperty({
    description: 'OCR result ID this suggestion is based on',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  ocrResultId: string;
}

export class ApproveTransactionSuggestionDto {
  @ApiProperty({
    description: 'Transaction suggestion ID to approve',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  suggestionId: string;

  @ApiProperty({
    description: 'Account ID to create the transaction in',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  accountId: string;

  @ApiProperty({
    description: 'Manual corrections to apply before creating transaction',
    required: false,
  })
  @IsOptional()
  corrections?: {
    description?: string;
    amount?: number;
    date?: string;
    categoryId?: string;
    merchant?: string;
  };
}
