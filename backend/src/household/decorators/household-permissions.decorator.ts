import { SetMetadata } from '@nestjs/common';
import { HOUSEHOLD_PERMISSIONS_KEY } from '../guards/household-access.guard';

export const HouseholdPermissions = (...permissions: string[]) =>
  SetMetadata(HOUSEHOLD_PERMISSIONS_KEY, permissions);
