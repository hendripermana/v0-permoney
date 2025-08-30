import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CurrencyConversionDto {
  @ApiProperty({
    description: 'Amount to convert (in cents/smallest unit)',
    example: 100000,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  amountCents!: number;

  @ApiProperty({
    description: 'Source currency code (ISO 4217)',
    example: 'USD',
  })
  @IsString()
  fromCurrency!: string;

  @ApiProperty({
    description: 'Target currency code (ISO 4217)',
    example: 'IDR',
  })
  @IsString()
  toCurrency!: string;

  @ApiPropertyOptional({
    description: 'Specific date for historical conversion (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class ConversionResultDto {
  @ApiProperty({
    description: 'Original amount in cents',
    example: 100000,
  })
  originalAmountCents!: number;

  @ApiProperty({
    description: 'Converted amount in cents',
    example: 1570000,
  })
  convertedAmountCents!: number;

  @ApiProperty({
    description: 'Source currency code',
    example: 'USD',
  })
  fromCurrency!: string;

  @ApiProperty({
    description: 'Target currency code',
    example: 'IDR',
  })
  toCurrency!: string;

  @ApiProperty({
    description: 'Exchange rate used for conversion',
    example: 15.7,
  })
  exchangeRate!: number;

  @ApiProperty({
    description: 'Date of the exchange rate',
    example: '2024-01-15',
  })
  rateDate!: string;

  @ApiProperty({
    description: 'Source of the exchange rate',
    example: 'exchangerate-api.com',
  })
  source!: string;
}
