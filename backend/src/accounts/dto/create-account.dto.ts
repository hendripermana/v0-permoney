import { IsString, IsEnum, IsOptional, IsUUID, IsBoolean, IsObject } from 'class-validator';
import { AccountType } from '../../types/database.types';

export class CreateAccountDto {
  @IsString()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsString()
  subtype: string;

  @IsString()
  @IsOptional()
  currency?: string = 'IDR';

  @IsUUID()
  @IsOptional()
  institutionId?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any> = {};
}
