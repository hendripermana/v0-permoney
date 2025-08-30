import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class BaseEntityDto {
  @IsUUID()
  id: string;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;
}

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class FilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
