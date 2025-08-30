import { IsEnum, IsOptional, IsArray } from 'class-validator';
import { HouseholdRole } from '@prisma/client';

export class UpdateMemberDto {
  @IsOptional()
  @IsEnum(HouseholdRole)
  role?: HouseholdRole;

  @IsOptional()
  @IsArray()
  permissions?: string[];
}
