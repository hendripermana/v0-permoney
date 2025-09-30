import { SetMetadata } from '@nestjs/common';
import type { $Enums } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: $Enums.HouseholdRole[]) => SetMetadata(ROLES_KEY, roles);
