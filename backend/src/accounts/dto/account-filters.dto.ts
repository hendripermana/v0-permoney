import { IsOptional, IsEnum, IsBoolean, IsString, IsUUID } from 'class-validator';
import { AccountType } from '@prisma/client';
import { Transform } from 'class-transformer';

export enum ViewType {
  INDIVIDUAL = 'INDIVIDUAL',
  PARTNER_ONLY = 'PARTNER_ONLY',
  COMBINED = 'COMBINED',
}

export class AccountFiltersDto {
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @IsOptional()
  @IsString()
  subtype?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(ViewType)
  viewType?: ViewType = ViewType.COMBINED;
}
