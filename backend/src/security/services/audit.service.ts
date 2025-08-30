import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestContextService } from '../../common/services/request-context.service';

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  PASSKEY_REGISTERED = 'PASSKEY_REGISTERED',
  PASSKEY_USED = 'PASSKEY_USED',

  // Authorization events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  ROLE_CHANGED = 'ROLE_CHANGED',

  // Data events
  DATA_CREATED = 'DATA_CREATED',
  DATA_UPDATED = 'DATA_UPDATED',
  DATA_DELETED = 'DATA_DELETED',
  DATA_ACCESSED = 'DATA_ACCESSED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  BULK_OPERATION = 'BULK_OPERATION',

  // Financial events
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_MODIFIED = 'TRANSACTION_MODIFIED',
  ACCOUNT_BALANCE_CHANGED = 'ACCOUNT_BALANCE_CHANGED',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  LARGE_TRANSACTION = 'LARGE_TRANSACTION',

  // Security events
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',

  // System events
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  CONFIGURATION_CHANGED = 'CONFIGURATION_CHANGED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',

  // Compliance events
  GDPR_REQUEST = 'GDPR_REQUEST',
  DATA_RETENTION_POLICY = 'DATA_RETENTION_POLICY',
  AUDIT_LOG_ACCESSED = 'AUDIT_LOG_ACCESSED',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditLogEntry {
  id?: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  householdId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  /**
   * Log audit event
   */
  async logEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date(),
        requestId: entry.requestId || this.requestContext.getRequestId(),
        userId: entry.userId || this.requestContext.getUserId(),
        householdId: entry.householdId || this.requestContext.getHouseholdId(),
        ipAddress: entry.ipAddress || this.requestContext.getMetadata('ip'),
        userAgent: entry.userAgent || this.requestContext.getMetadata('userAgent'),
        sessionId: entry.sessionId || this.requestContext.getMetadata('sessionId'),
      };

      // Store in database
      await this.prisma.auditLog.create({
        data: {
          eventType: auditEntry.eventType,
          severity: auditEntry.severity,
          userId: auditEntry.userId,
          householdId: auditEntry.householdId,
          resourceType: auditEntry.resourceType,
          resourceId: auditEntry.resourceId,
          action: auditEntry.action,
          details: auditEntry.details,
          ipAddress: auditEntry.ipAddress,
          userAgent: auditEntry.userAgent,
          sessionId: auditEntry.sessionId,
          requestId: auditEntry.requestId,
          success: auditEntry.success,
          errorMessage: auditEntry.errorMessage,
          metadata: auditEntry.metadata || {},
          timestamp: auditEntry.timestamp,
        },
      });

      // Log to application logs for immediate visibility
      const logMessage = `${auditEntry.eventType}: ${auditEntry.action}`;
      const logContext = {
        userId: auditEntry.userId,
        householdId: auditEntry.householdId,
        resourceType: auditEntry.resourceType,
        resourceId: auditEntry.resourceId,
        success: auditEntry.success,
        severity: auditEntry.severity,
        requestId: auditEntry.requestId,
      };

      switch (auditEntry.severity) {
        case AuditSeverity.CRITICAL:
          this.logger.error(logMessage, JSON.stringify(logContext));
          break;
        case AuditSeverity.HIGH:
          this.logger.warn(logMessage, JSON.stringify(logContext));
          break;
        case AuditSeverity.MEDIUM:
          this.logger.log(logMessage, JSON.stringify(logContext));
          break;
        case AuditSeverity.LOW:
          this.logger.debug(logMessage, JSON.stringify(logContext));
          break;
      }

      // Trigger alerts for critical events
      if (auditEntry.severity === AuditSeverity.CRITICAL) {
        await this.triggerSecurityAlert(auditEntry);
      }
    } catch (error) {
      this.logger.error('Failed to log audit event', error, {
        eventType: entry.eventType,
        action: entry.action,
      });
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    eventType: AuditEventType,
    userId: string,
    success: boolean,
    details: Record<string, any> = {},
    errorMessage?: string,
  ): Promise<void> {
    await this.logEvent({
      eventType,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      userId,
      action: `User ${eventType.toLowerCase().replace('_', ' ')}`,
      details,
      success,
      errorMessage,
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    resourceType: string,
    resourceId: string,
    action: string,
    success: boolean = true,
    details: Record<string, any> = {},
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.DATA_ACCESSED,
      severity: AuditSeverity.LOW,
      resourceType,
      resourceId,
      action,
      details,
      success,
    });
  }

  /**
   * Log financial events
   */
  async logFinancialEvent(
    eventType: AuditEventType,
    resourceType: string,
    resourceId: string,
    action: string,
    amount?: number,
    currency?: string,
    details: Record<string, any> = {},
  ): Promise<void> {
    const severity = amount && amount > 10000000 ? AuditSeverity.HIGH : AuditSeverity.MEDIUM; // 10M IDR threshold

    await this.logEvent({
      eventType,
      severity,
      resourceType,
      resourceId,
      action,
      details: {
        ...details,
        amount,
        currency,
      },
      success: true,
    });
  }

  /**
   * Log security violations
   */
  async logSecurityViolation(
    violation: string,
    details: Record<string, any> = {},
    severity: AuditSeverity = AuditSeverity.HIGH,
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.SECURITY_VIOLATION,
      severity,
      action: violation,
      details,
      success: false,
    });
  }

  /**
   * Log system events
   */
  async logSystemEvent(
    eventType: AuditEventType,
    action: string,
    details: Record<string, any> = {},
    success: boolean = true,
  ): Promise<void> {
    await this.logEvent({
      eventType,
      severity: AuditSeverity.MEDIUM,
      action,
      details,
      success,
    });
  }

  /**
   * Query audit logs with filters
   */
  async queryAuditLogs(filters: {
    userId?: string;
    householdId?: string;
    eventType?: AuditEventType;
    severity?: AuditSeverity;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.householdId) where.householdId = filters.householdId;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.severity) where.severity = filters.severity;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.success !== undefined) where.success = filters.success;

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    return await this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    householdId?: string,
  ) {
    const baseWhere: any = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (householdId) {
      baseWhere.householdId = householdId;
    }

    const [
      totalEvents,
      eventsByType,
      eventsBySeverity,
      failedEvents,
      securityEvents,
      topUsers,
    ] = await Promise.all([
      // Total events count
      this.prisma.auditLog.count({ where: baseWhere }),

      // Events by type
      this.prisma.auditLog.groupBy({
        by: ['eventType'],
        where: baseWhere,
        _count: { eventType: true },
        orderBy: { _count: { eventType: 'desc' } },
      }),

      // Events by severity
      this.prisma.auditLog.groupBy({
        by: ['severity'],
        where: baseWhere,
        _count: { severity: true },
      }),

      // Failed events
      this.prisma.auditLog.count({
        where: { ...baseWhere, success: false },
      }),

      // Security events
      this.prisma.auditLog.count({
        where: {
          ...baseWhere,
          eventType: {
            in: [
              AuditEventType.SECURITY_VIOLATION,
              AuditEventType.RATE_LIMIT_EXCEEDED,
              AuditEventType.SUSPICIOUS_ACTIVITY,
              AuditEventType.DATA_BREACH_ATTEMPT,
            ],
          },
        },
      }),

      // Top users by activity
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...baseWhere, userId: { not: null } },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      period: { startDate, endDate },
      summary: {
        totalEvents,
        failedEvents,
        securityEvents,
        successRate: totalEvents > 0 ? ((totalEvents - failedEvents) / totalEvents) * 100 : 100,
      },
      breakdown: {
        eventsByType: eventsByType.map(item => ({
          type: item.eventType,
          count: item._count.eventType,
        })),
        eventsBySeverity: eventsBySeverity.map(item => ({
          severity: item.severity,
          count: item._count.severity,
        })),
        topUsers: topUsers.map(item => ({
          userId: item.userId,
          eventCount: item._count.userId,
        })),
      },
    };
  }

  /**
   * Trigger security alert for critical events
   */
  private async triggerSecurityAlert(auditEntry: AuditLogEntry): Promise<void> {
    try {
      // Log critical security event
      this.logger.error('CRITICAL SECURITY EVENT', {
        eventType: auditEntry.eventType,
        action: auditEntry.action,
        userId: auditEntry.userId,
        householdId: auditEntry.householdId,
        details: auditEntry.details,
        timestamp: auditEntry.timestamp,
      });

      // TODO: Integrate with alerting system (email, Slack, PagerDuty, etc.)
      // This would typically send notifications to security team
    } catch (error) {
      this.logger.error('Failed to trigger security alert', error);
    }
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
        severity: {
          not: AuditSeverity.CRITICAL, // Keep critical events longer
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old audit log entries`);
    return result.count;
  }
}
