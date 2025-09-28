import { SetMetadata } from '@nestjs/common';
import type { HouseholdRole } from '../../../../node_modules/.prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: HouseholdRole[]) => SetMetadata(ROLES_KEY, roles);
