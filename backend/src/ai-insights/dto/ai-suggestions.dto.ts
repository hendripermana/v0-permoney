import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CategorySuggestionQueryDto {
  @ApiPropertyOptional({ description: 'Free text description from the transaction' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  description?: string;

  @ApiPropertyOptional({ description: 'Merchant name, either raw or normalized' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  merchant?: string;

  @ApiPropertyOptional({ description: 'Optional household scope for more precise suggestions' })
  @IsOptional()
  @IsString()
  householdId?: string;
}

export class CategorySuggestionDto {
  @ApiProperty()
  categoryId!: string;

  @ApiProperty()
  categoryName!: string;

  @ApiProperty({ description: 'Confidence score 0-1' })
  confidence!: number;

  @ApiProperty({ description: 'Human readable reason for suggestion' })
  reason!: string;
}

