import { IsOptional, IsEnum, IsDateString, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GratitudeType } from '@prisma/client';

export class GratitudeFiltersDto {
  @ApiPropertyOptional({ enum: GratitudeType, description: 'Filter by gratitude type' })
  @IsOptional()
  @IsEnum(GratitudeType)
  type?: GratitudeType;

  @ApiPropertyOptional({ description: 'Filter by giver name' })
  @IsOptional()
  @IsString()
  giver?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter from date (ISO string)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO string)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Search in description' })
  @IsOptional()
  @IsString()
  search?: string;
}
