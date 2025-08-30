import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HouseholdGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract household ID from request params, body, or query
    const householdId = 
      request.params?.householdId || 
      request.body?.householdId || 
      request.query?.householdId;

    if (!householdId) {
      // If no household ID is specified, allow access (will be handled by other guards/logic)
      return true;
    }

    // Check if user is a member of the household
    const membership = await this.prisma.householdMember.findFirst({
      where: {
        userId: user.id,
        householdId: householdId,
      },
      include: {
        household: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied to this household');
    }

    // Add household information to request for use in controllers
    request.household = membership.household;
    request.householdRole = membership.role;
    request.householdPermissions = membership.permissions;

    return true;
  }
}
