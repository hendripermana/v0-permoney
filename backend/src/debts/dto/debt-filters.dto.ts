import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { DebtType } from './create-debt.dto';

export class DebtFiltersDto {
  @IsOptional()
  @IsEnum(DebtType)
  type?: DebtType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @IsOptional()
  @IsString()
  creditor?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search in name, creditor
}
