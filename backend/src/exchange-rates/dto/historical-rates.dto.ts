import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum HistoricalRangePeriod {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class HistoricalRatesQueryDto {
  @ApiProperty({
    description: 'Base currency code (ISO 4217)',
    example: 'IDR',
  })
  @IsString()
  baseCurrency!: string;

  @ApiProperty({
    description: 'Target currency code (ISO 4217)',
    example: 'USD',
  })
  @IsString()
  targetCurrency!: string;

  @ApiPropertyOptional({
    description: 'Start date for historical range (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for historical range (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Predefined period for historical data',
    enum: HistoricalRangePeriod,
    example: HistoricalRangePeriod.MONTH,
  })
  @IsOptional()
  @IsEnum(HistoricalRangePeriod)
  period?: HistoricalRangePeriod;
}

export class HistoricalRateDto {
  @ApiProperty({
    description: 'Date of the rate',
    example: '2024-01-15',
  })
  date!: string;

  @ApiProperty({
    description: 'Exchange rate',
    example: 15.7,
  })
  rate!: number;

  @ApiProperty({
    description: 'Source of the rate',
    example: 'exchangerate-api.com',
  })
  source!: string;
}

export class HistoricalRatesResponseDto {
  @ApiProperty({
    description: 'Base currency code',
    example: 'IDR',
  })
  baseCurrency!: string;

  @ApiProperty({
    description: 'Target currency code',
    example: 'USD',
  })
  targetCurrency!: string;

  @ApiProperty({
    description: 'Start date of the range',
    example: '2024-01-01',
  })
  startDate!: string;

  @ApiProperty({
    description: 'End date of the range',
    example: '2024-01-31',
  })
  endDate!: string;

  @ApiProperty({
    description: 'Historical exchange rates',
    type: [HistoricalRateDto],
  })
  rates!: HistoricalRateDto[];
}
