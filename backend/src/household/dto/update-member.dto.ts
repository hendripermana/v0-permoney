import { IsEnum, IsOptional, IsArray } from 'class-validator';
import { $Enums } from '@prisma/client';

export class UpdateMemberDto {
  @IsOptional()
  @IsEnum($Enums.HouseholdRole)
  role?: $Enums.HouseholdRole;

  @IsOptional()
  @IsArray()
  permissions?: string[];
}
