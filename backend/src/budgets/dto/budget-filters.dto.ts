import { IsOptional, IsEnum, IsDateString, IsBoolean, IsString } from 'class-validator';
import { BudgetPeriod } from '../../../../node_modules/.prisma/client';
import { Transform } from 'class-transformer';

export class BudgetFiltersDto {
  @IsOptional()
  @IsEnum(BudgetPeriod)
  period?: BudgetPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
