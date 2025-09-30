import { IsEmail, IsEnum, IsOptional, IsArray } from 'class-validator';
import { $Enums } from '@prisma/client';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum($Enums.HouseholdRole)
  role: $Enums.HouseholdRole;

  @IsOptional()
  @IsArray()
  permissions?: string[] = [];
}
