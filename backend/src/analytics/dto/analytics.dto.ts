import { IsDateString, IsOptional, IsArray, IsString, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportType, ExportFormat } from '../types/analytics.types';

export class AmountRangeDto {
  @IsNumber()
  @Min(0)
  min: number;

  @IsNumber()
  @Min(0)
  max: number;
}

export class DateRangeDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class AnalyticsFiltersDto extends DateRangeDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accountIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  merchantIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Type(() => AmountRangeDto)
  amountRange?: AmountRangeDto;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  includeTransfers?: boolean;
}

export class SpendingAnalyticsDto extends AnalyticsFiltersDto {
  @IsOptional()
  @IsBoolean()
  includeComparisons?: boolean;

  @IsOptional()
  @IsBoolean()
  includeTrends?: boolean;

  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month';
}

export class CashflowAnalyticsDto extends AnalyticsFiltersDto {
  @IsOptional()
  @IsBoolean()
  includeProjections?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  projectionMonths?: number;
}

export class NetWorthAnalyticsDto extends AnalyticsFiltersDto {
  @IsOptional()
  @IsBoolean()
  includeProjections?: boolean;

  @IsOptional()
  @IsBoolean()
  includeBreakdown?: boolean;

  @IsOptional()
  @IsString()
  interval?: 'daily' | 'weekly' | 'monthly';
}

export class CategoryAnalyticsDto extends AnalyticsFiltersDto {
  @IsOptional()
  @IsBoolean()
  includeSubcategories?: boolean;

  @IsOptional()
  @IsBoolean()
  includeTrends?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class TrendAnalyticsDto extends AnalyticsFiltersDto {
  @IsString()
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @IsOptional()
  @IsString()
  trendType?: 'spending' | 'income' | 'net_worth' | 'category';

  @IsOptional()
  @IsBoolean()
  includeSeasonality?: boolean;

  @IsOptional()
  @IsBoolean()
  includeForecast?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  forecastPeriods?: number;
}

export class ExportReportDto {
  @IsEnum(ReportType)
  reportType: ReportType;

  @IsEnum(ExportFormat)
  format: ExportFormat;

  @Type(() => AnalyticsFiltersDto)
  filters: AnalyticsFiltersDto;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;

  @IsOptional()
  @IsBoolean()
  includeDetails?: boolean;

  @IsOptional()
  @IsString()
  locale?: string;
}

export class RefreshMaterializedViewDto {
  @IsString()
  viewName: string;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class BulkRefreshDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  viewNames?: string[];

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
