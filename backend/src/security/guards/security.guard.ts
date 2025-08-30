import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuditService, AuditEventType, AuditSeverity } from '../services/audit.service';
import { RateLimitService, RateLimitType } from '../services/rate-limit.service';

export const SECURITY_REQUIREMENTS = 'security_requirements';

export interface SecurityRequirement {
  requiresAuth?: boolean;
  requiresRole?: string[];
  requiresPermission?: string[];
  sensitiveOperation?: boolean;
  rateLimitType?: RateLimitType;
  customRateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

export const RequireSecurity = (requirements: SecurityRequirement) =>
  Reflector.createDecorator<SecurityRequirement>({ key: SECURITY_REQUIREMENTS, value: requirements });

@Injectable()
export class SecurityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirements = this.reflector.get<SecurityRequirement>(
      SECURITY_REQUIREMENTS,
      context.getHandler(),
    );

    if (!requirements) {
      return true; // No security requirements specified
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    // Check authentication requirement
    if (requirements.requiresAuth && !user) {
      await this.auditService.logEvent({
        eventType: AuditEventType.ACCESS_DENIED,
        severity: AuditSeverity.MEDIUM,
        action: 'Unauthenticated access attempt',
        details: {
          path: request.path,
          method: request.method,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        },
        success: false,
      });
      throw new ForbiddenException('Authentication required');
    }

    // Check role requirements
    if (requirements.requiresRole && user) {
      const userRoles = user.roles || [];
      const hasRequiredRole = requirements.requiresRole.some(role =>
        userRoles.includes(role),
      );

      if (!hasRequiredRole) {
        await this.auditService.logEvent({
          eventType: AuditEventType.ACCESS_DENIED,
          severity: AuditSeverity.MEDIUM,
          userId: user.id,
          action: 'Insufficient role privileges',
          details: {
            path: request.path,
            method: request.method,
            requiredRoles: requirements.requiresRole,
            userRoles,
          },
          success: false,
        });
        throw new ForbiddenException('Insufficient privileges');
      }
    }

    // Check permission requirements
    if (requirements.requiresPermission && user) {
      const userPermissions = user.permissions || [];
      const hasRequiredPermission = requirements.requiresPermission.some(permission =>
        userPermissions.includes(permission),
      );

      if (!hasRequiredPermission) {
        await this.auditService.logEvent({
          eventType: AuditEventType.ACCESS_DENIED,
          severity: AuditSeverity.MEDIUM,
          userId: user.id,
          action: 'Insufficient permissions',
          details: {
            path: request.path,
            method: request.method,
            requiredPermissions: requirements.requiresPermission,
            userPermissions,
          },
          success: false,
        });
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    // Apply rate limiting
    if (requirements.rateLimitType) {
      const key = user
        ? this.rateLimitService.generateUserKey(user.id, request.path)
        : this.rateLimitService.generateIPKey(request.ip, request.path);

      const rateLimitResult = await this.rateLimitService.checkRateLimit(
        key,
        requirements.rateLimitType,
        requirements.customRateLimit,
      );

      if (!rateLimitResult.allowed) {
        await this.auditService.logEvent({
          eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
          severity: AuditSeverity.MEDIUM,
          userId: user?.id,
          action: 'Rate limit exceeded',
          details: {
            path: request.path,
            method: request.method,
            rateLimitType: requirements.rateLimitType,
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
          },
          success: false,
        });
        throw new ForbiddenException('Rate limit exceeded');
      }

      // Add rate limit headers
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-RateLimit-Limit', rateLimitResult.totalHits);
      response.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
      response.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.getTime());
    }

    // Log sensitive operations
    if (requirements.sensitiveOperation) {
      await this.auditService.logEvent({
        eventType: AuditEventType.DATA_ACCESSED,
        severity: AuditSeverity.MEDIUM,
        userId: user?.id,
        action: 'Sensitive operation accessed',
        details: {
          path: request.path,
          method: request.method,
          operation: requirements,
        },
        success: true,
      });
    }

    return true;
  }
}
