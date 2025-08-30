import { IsString, IsUUID, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum AnalysisType {
  SPENDING_PATTERNS = 'SPENDING_PATTERNS',
  USER_BEHAVIOR = 'USER_BEHAVIOR',
  TRANSACTION_TRENDS = 'TRANSACTION_TRENDS',
  CATEGORY_PREFERENCES = 'CATEGORY_PREFERENCES',
  TIME_BASED_PATTERNS = 'TIME_BASED_PATTERNS',
  MERCHANT_FREQUENCY = 'MERCHANT_FREQUENCY',
}

export enum PatternType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  SEASONAL = 'SEASONAL',
}

export class BehaviorAnalysisDto {
  @IsUUID()
  householdId: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(AnalysisType)
  analysisType: AnalysisType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(PatternType)
  @IsOptional()
  patternType?: PatternType;

  @IsString()
  @IsOptional()
  categoryId?: string;
}
