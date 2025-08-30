import { IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateInsightsDto {
  @IsOptional()
  @IsBoolean()
  includePatterns?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeAnomalies?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeRecommendations?: boolean = true;

  @IsOptional()
  @IsEnum(['WEEK', 'MONTH', 'QUARTER', 'YEAR'])
  timeframe?: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' = 'MONTH';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  minConfidence?: number = 0.5;
}

export class PatternAnalysisDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minFrequency?: number = 3;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  minConfidence?: number = 0.5;

  @IsOptional()
  @IsBoolean()
  includeSeasonality?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeTrends?: boolean = true;
}

export class AnomalyDetectionDto {
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  sensitivity?: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minDeviation?: number = 50;

  @IsOptional()
  @IsBoolean()
  includeTimeBasedAnomalies?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeAmountBasedAnomalies?: boolean = true;
}

export class MonthlyReportDto {
  @IsOptional()
  @IsBoolean()
  includeNarrative?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeVisualData?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeRecommendations?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeAchievements?: boolean = true;
}
