import { IsString, IsUUID, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryEventsDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsOptional()
  householdId?: string;

  @IsString()
  @IsOptional()
  eventType?: string;

  @IsString()
  @IsOptional()
  resourceType?: string;

  @IsUUID()
  @IsOptional()
  resourceId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  limit?: number = 50;

  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  offset?: number = 0;
}
