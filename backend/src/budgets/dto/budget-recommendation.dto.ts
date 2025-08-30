import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export enum RecommendationType {
  INCREASE_ALLOCATION = 'INCREASE_ALLOCATION',
  DECREASE_ALLOCATION = 'DECREASE_ALLOCATION',
  NEW_CATEGORY = 'NEW_CATEGORY',
  MERGE_CATEGORIES = 'MERGE_CATEGORIES',
  SEASONAL_ADJUSTMENT = 'SEASONAL_ADJUSTMENT',
}

export class BudgetRecommendationDto {
  @IsString()
  id: string;

  @IsEnum(RecommendationType)
  type: RecommendationType;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  suggestedAmountCents?: number;

  @IsNumber()
  @Min(0)
  confidenceScore: number;

  @IsString()
  reasoning: string;
}
