import { SetMetadata } from '@nestjs/common';
import { HouseholdRole } from '@prisma/client';
import { HOUSEHOLD_ROLES_KEY } from '../guards/household-access.guard';

export const HouseholdRoles = (...roles: HouseholdRole[]) =>
  SetMetadata(HOUSEHOLD_ROLES_KEY, roles);
