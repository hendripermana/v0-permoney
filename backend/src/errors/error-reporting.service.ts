import { Injectable, Logger } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"
import type { MetricsService } from "../common/metrics/metrics.service"
import type { StructuredLoggerService } from "../common/logging/logger.service"

export interface ProcessedErrorReport {
  id: string
  fingerprint: string
  message: string
  stack?: string
  severity: "low" | "medium" | "high" | "critical"
  component: string
  action: string
  userId?: string
  householdId?: string
  userAgent: string
  ip: string
  url: string
  metadata: Record<string, any>
  reportedAt: Date
  occurrenceCount: number
  firstSeen: Date
  lastSeen: Date
}

@Injectable()
export class ErrorReportingService {
  private readonly logger = new Logger(ErrorReportingService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
    private readonly structuredLogger: StructuredLoggerService,
  ) {}

  async processErrorReport(errorData: any): Promise<ProcessedErrorReport> {
    const fingerprint = errorData.fingerprint

    // Check if this error has been seen before
    const existingError = await this.prisma.errorReport.findUnique({
      where: { fingerprint },
    })

    let processedReport: ProcessedErrorReport

    if (existingError) {
      // Update existing error
      const updated = await this.prisma.errorReport.update({
        where: { fingerprint },
        data: {
          occurrenceCount: { increment: 1 },
          lastSeen: new Date(),
          lastUserAgent: errorData.userAgent,
          lastIp: errorData.ip,
          lastUrl: errorData.url,
          lastUserId: errorData.userId,
          lastHouseholdId: errorData.householdId,
        },
      })

      processedReport = {
        id: updated.id,
        fingerprint: updated.fingerprint,
        message: updated.message,
        stack: updated.stack,
        severity: updated.severity as any,
        component: updated.component,
        action: updated.action,
        userId: errorData.userId,
        householdId: errorData.householdId,
        userAgent: errorData.userAgent,
        ip: errorData.ip,
        url: errorData.url,
        metadata: errorData.metadata || {},
        reportedAt: errorData.reportedAt,
        occurrenceCount: updated.occurrenceCount,
        firstSeen: updated.firstSeen,
        lastSeen: updated.lastSeen,
      }
    } else {
      // Create new error record
      const created = await this.prisma.errorReport.create({
        data: {
          fingerprint,
          message: errorData.message,
          stack: errorData.stack,
          name: errorData.name,
          severity: errorData.severity,
          component: errorData.context.component,
          action: errorData.context.action,
          userId: errorData.userId,
          householdId: errorData.householdId,
          userAgent: errorData.userAgent,
          ip: errorData.ip,
          url: errorData.url,
          metadata: errorData.metadata || {},
          tags: errorData.tags || [],
          occurrenceCount: 1,
          firstSeen: errorData.reportedAt,
          lastSeen: errorData.reportedAt,
          lastUserAgent: errorData.userAgent,
          lastIp: errorData.ip,
          lastUrl: errorData.url,
          lastUserId: errorData.userId,
          lastHouseholdId: errorData.householdId,
        },
      })

      processedReport = {
        id: created.id,
        fingerprint: created.fingerprint,
        message: created.message,
        stack: created.stack,
        severity: created.severity as any,
        component: created.component,
        action: created.action,
        userId: errorData.userId,
        householdId: errorData.householdId,
        userAgent: errorData.userAgent,
        ip: errorData.ip,
        url: errorData.url,
        metadata: errorData.metadata || {},
        reportedAt: errorData.reportedAt,
        occurrenceCount: 1,
        firstSeen: created.firstSeen,
        lastSeen: created.lastSeen,
      }
    }

    // Record metrics
    this.metrics.recordError(`client_${errorData.context.component}`, errorData.severity)

    // Log structured error
    this.structuredLogger.logSecurityEvent(`Client error reported: ${errorData.message}`, errorData.severity, {
      fingerprint,
      component: errorData.context.component,
      action: errorData.context.action,
      userId: errorData.userId,
      householdId: errorData.householdId,
      occurrenceCount: processedReport.occurrenceCount,
    })

    // Analyze error patterns
    await this.analyzeErrorPatterns(processedReport)

    return processedReport
  }

  async triggerCriticalErrorAlert(errorReport: ProcessedErrorReport): Promise<void> {
    // Send immediate alert for critical errors
    this.logger.error(`CRITICAL ERROR ALERT: ${errorReport.message}`, errorReport.stack, {
      fingerprint: errorReport.fingerprint,
      component: errorReport.component,
      action: errorReport.action,
      occurrenceCount: errorReport.occurrenceCount,
      userId: errorReport.userId,
      householdId: errorReport.householdId,
    })

    // Here you would integrate with alerting systems like:
    // - Slack/Discord webhooks
    // - Email notifications
    // - PagerDuty
    // - SMS alerts
  }

  private async analyzeErrorPatterns(errorReport: ProcessedErrorReport): Promise<void> {
    // Check for error spikes
    if (errorReport.occurrenceCount > 10) {
      this.logger.warn(
        `Error spike detected: ${errorReport.fingerprint} occurred ${errorReport.occurrenceCount} times`,
        {
          fingerprint: errorReport.fingerprint,
          component: errorReport.component,
          occurrenceCount: errorReport.occurrenceCount,
        },
      )
    }

    // Check for new critical errors
    if (errorReport.severity === "critical" && errorReport.occurrenceCount === 1) {
      this.logger.error(`New critical error detected: ${errorReport.message}`, {
        fingerprint: errorReport.fingerprint,
        component: errorReport.component,
        action: errorReport.action,
      })
    }

    // Analyze user impact
    if (errorReport.userId) {
      const userErrorCount = await this.prisma.errorReport.count({
        where: {
          userId: errorReport.userId,
          lastSeen: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      })

      if (userErrorCount > 5) {
        this.logger.warn(`User experiencing multiple errors: ${errorReport.userId}`, {
          userId: errorReport.userId,
          errorCount: userErrorCount,
        })
      }
    }
  }

  async getErrorAnalytics(timeRange = "24h"): Promise<any> {
    const timeRangeMs = this.parseTimeRange(timeRange)
    const since = new Date(Date.now() - timeRangeMs)

    const [totalErrors, errorsBySeverity, errorsByComponent, topErrors, affectedUsers] = await Promise.all([
      this.prisma.errorReport.count({
        where: { lastSeen: { gte: since } },
      }),
      this.prisma.errorReport.groupBy({
        by: ["severity"],
        where: { lastSeen: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.errorReport.groupBy({
        by: ["component"],
        where: { lastSeen: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
        take: 10,
      }),
      this.prisma.errorReport.findMany({
        where: { lastSeen: { gte: since } },
        orderBy: { occurrenceCount: "desc" },
        take: 10,
        select: {
          fingerprint: true,
          message: true,
          component: true,
          action: true,
          severity: true,
          occurrenceCount: true,
          firstSeen: true,
          lastSeen: true,
        },
      }),
      this.prisma.errorReport.findMany({
        where: {
          lastSeen: { gte: since },
          userId: { not: null },
        },
        distinct: ["userId"],
        select: { userId: true },
      }),
    ])

    return {
      timeRange,
      since: since.toISOString(),
      summary: {
        totalErrors,
        affectedUsers: affectedUsers.length,
        criticalErrors: errorsBySeverity.find((e) => e.severity === "critical")?._count._all || 0,
        highErrors: errorsBySeverity.find((e) => e.severity === "high")?._count._all || 0,
      },
      breakdown: {
        bySeverity: errorsBySeverity,
        byComponent: errorsByComponent,
      },
      topErrors,
    }
  }

  private parseTimeRange(timeRange: string): number {
    const unit = timeRange.slice(-1)
    const value = Number.parseInt(timeRange.slice(0, -1))

    switch (unit) {
      case "m":
        return value * 60 * 1000
      case "h":
        return value * 60 * 60 * 1000
      case "d":
        return value * 24 * 60 * 60 * 1000
      default:
        return 24 * 60 * 60 * 1000 // Default to 24 hours
    }
  }
}
