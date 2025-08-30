import { IsString, IsOptional, IsDateString, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExchangeRateQueryDto {
  @ApiProperty({
    description: 'Base currency code (ISO 4217)',
    example: 'IDR',
  })
  @IsString()
  baseCurrency!: string;

  @ApiPropertyOptional({
    description: 'Target currencies to get rates for (ISO 4217)',
    example: ['USD', 'EUR', 'SGD'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  targetCurrencies?: string[];

  @ApiPropertyOptional({
    description: 'Specific date for historical rates (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
