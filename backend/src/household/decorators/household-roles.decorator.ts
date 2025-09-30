import { SetMetadata } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { HOUSEHOLD_ROLES_KEY } from '../guards/household-access.guard';

export const HouseholdRoles = (...roles: $Enums.HouseholdRole[]) =>
  SetMetadata(HOUSEHOLD_ROLES_KEY, roles);
