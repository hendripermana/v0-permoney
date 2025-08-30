import { IsString, IsEnum, IsOptional, IsDateString, IsUUID, IsPositive, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GratitudeType } from '@prisma/client';

export class CreateGratitudeEntryDto {
  @ApiProperty({ description: 'Name of the person who gave the gratitude' })
  @IsString()
  giver: string;

  @ApiProperty({ enum: GratitudeType, description: 'Type of gratitude entry' })
  @IsEnum(GratitudeType)
  type: GratitudeType;

  @ApiProperty({ description: 'Description of the gratitude entry' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Date of the gratitude entry' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Category ID for the gratitude entry' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Transaction ID this gratitude is linked to' })
  @IsOptional()
  @IsUUID()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Estimated value in cents' })
  @IsOptional()
  @IsPositive()
  @Min(1)
  estimatedValueCents?: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;
}
