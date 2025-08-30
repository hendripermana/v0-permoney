import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HouseholdService } from '../household.service';
import { HouseholdRole } from '@prisma/client';

export const HOUSEHOLD_ROLES_KEY = 'household_roles';
export const HOUSEHOLD_PERMISSIONS_KEY = 'household_permissions';

@Injectable()
export class HouseholdAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private householdService: HouseholdService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<HouseholdRole[]>(
      HOUSEHOLD_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      HOUSEHOLD_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const householdId = request.params.id || request.params.householdId;

    if (!user || !householdId) {
      throw new ForbiddenException('User and household context required');
    }

    // Check roles
    if (requiredRoles) {
      const userRole = await this.householdService.getUserRole(householdId, user.id);
      if (!userRole || !requiredRoles.includes(userRole)) {
        throw new ForbiddenException('Insufficient role permissions');
      }
    }

    // Check permissions
    if (requiredPermissions) {
      for (const permission of requiredPermissions) {
        const hasPermission = await this.householdService.hasPermission(
          householdId,
          permission,
          user.id,
        );
        if (!hasPermission) {
          throw new ForbiddenException(`Missing permission: ${permission}`);
        }
      }
    }

    return true;
  }
}
