import { IsEmail, IsEnum, IsOptional, IsArray } from 'class-validator';
import { HouseholdRole } from '@prisma/client';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(HouseholdRole)
  role: HouseholdRole;

  @IsOptional()
  @IsArray()
  permissions?: string[] = [];
}
