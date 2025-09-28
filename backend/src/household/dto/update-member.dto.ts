import { IsEnum, IsOptional, IsArray } from 'class-validator';
import { HouseholdRole } from '../../../../node_modules/.prisma/client';

export class UpdateMemberDto {
  @IsOptional()
  @IsEnum(HouseholdRole)
  role?: HouseholdRole;

  @IsOptional()
  @IsArray()
  permissions?: string[];
}
