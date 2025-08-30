import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import type { PrismaService } from "../../prisma/prisma.service"
import type { Request } from "express"

export enum SecurityEventType {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  LOGIN_BLOCKED = "LOGIN_BLOCKED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  DATA_BREACH_ATTEMPT = "DATA_BREACH_ATTEMPT",
  SQL_INJECTION_ATTEMPT = "SQL_INJECTION_ATTEMPT",
  XSS_ATTEMPT = "XSS_ATTEMPT",
  CSRF_VIOLATION = "CSRF_VIOLATION",
  SESSION_HIJACK_ATTEMPT = "SESSION_HIJACK_ATTEMPT",
  BRUTE_FORCE_ATTEMPT = "BRUTE_FORCE_ATTEMPT",
  ACCOUNT_LOCKOUT = "ACCOUNT_LOCKOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  ACCOUNT_CREATED = "ACCOUNT_CREATED",
  ACCOUNT_DELETED = "ACCOUNT_DELETED",
  PRIVILEGE_ESCALATION = "PRIVILEGE_ESCALATION",
  CONFIGURATION_CHANGE = "CONFIGURATION_CHANGE",
}

export enum SecuritySeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface SecurityEvent {
  id?: string
  type: SecurityEventType
  severity: SecuritySeverity
  message: string
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  requestPath?: string
  requestMethod?: string
  metadata?: Record<string, any>
  timestamp: Date
  resolved?: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name)
  private readonly alertThresholds = new Map<SecurityEventType, number>()
  private readonly recentEvents = new Map<string, SecurityEvent[]>()

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.initializeAlertThresholds()
    this.startCleanupTask()
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: Omit<SecurityEvent, "id" | "timestamp">): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    }

    try {
      // Store in database
      await this.prisma.securityEvent.create({
        data: {
          type: securityEvent.type,
          severity: securityEvent.severity,
          message: securityEvent.message,
          userId: securityEvent.userId,
          sessionId: securityEvent.sessionId,
          ipAddress: securityEvent.ipAddress,
          userAgent: securityEvent.userAgent,
          requestPath: securityEvent.requestPath,
          requestMethod: securityEvent.requestMethod,
          metadata: securityEvent.metadata,
          timestamp: securityEvent.timestamp,
          resolved: false,
        },
      })

      // Log to application logs
      this.logEventToConsole(securityEvent)

      // Check for alert conditions
      await this.checkAlertConditions(securityEvent)

      // Store in memory for pattern detection
      this.storeEventInMemory(securityEvent)
    } catch (error) {
      this.logger.error("Failed to log security event", error)
    }
  }

  /**
   * Log security event from HTTP request
   */
  async logSecurityEventFromRequest(
    req: Request,
    type: SecurityEventType,
    severity: SecuritySeverity,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const user = (req as any).user
    const sessionId = (req as any).sessionID

    await this.logSecurityEvent({
      type,
      severity,
      message,
      userId: user?.id,
      sessionId,
      ipAddress: this.getClientIP(req),
      userAgent: req.headers["user-agent"],
      requestPath: req.path,
      requestMethod: req.method,
      metadata,
    })
  }

  /**
   * Get security events with filtering
   */
  async getSecurityEvents(filters: {
    type?: SecurityEventType
    severity?: SecuritySeverity
    userId?: string
    ipAddress?: string
    startDate?: Date
    endDate?: Date
    resolved?: boolean
    limit?: number
    offset?: number
  }): Promise<SecurityEvent[]> {
    const where: any = {}

    if (filters.type) where.type = filters.type
    if (filters.severity) where.severity = filters.severity
    if (filters.userId) where.userId = filters.userId
    if (filters.ipAddress) where.ipAddress = filters.ipAddress
    if (filters.resolved !== undefined) where.resolved = filters.resolved

    if (filters.startDate || filters.endDate) {
      where.timestamp = {}
      if (filters.startDate) where.timestamp.gte = filters.startDate
      if (filters.endDate) where.timestamp.lte = filters.endDate
    }

    return this.prisma.securityEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    })
  }

  /**
   * Get security statistics
   */
  async getSecurityStatistics(timeframe: "hour" | "day" | "week" | "month" = "day"): Promise<{
    totalEvents: number
    eventsBySeverity: Record<SecuritySeverity, number>
    eventsByType: Record<SecurityEventType, number>
    topIpAddresses: Array<{ ipAddress: string; count: number }>
    topUsers: Array<{ userId: string; count: number }>
    timeline: Array<{ timestamp: Date; count: number }>
  }> {
    const timeframeDuration = this.getTimeframeDuration(timeframe)
    const startDate = new Date(Date.now() - timeframeDuration)

    const events = await this.prisma.securityEvent.findMany({
      where: {
        timestamp: { gte: startDate },
      },
    })

    const totalEvents = events.length

    const eventsBySeverity = events.reduce(
      (acc, event) => {
        acc[event.severity as SecuritySeverity] = (acc[event.severity as SecuritySeverity] || 0) + 1
        return acc
      },
      {} as Record<SecuritySeverity, number>,
    )

    const eventsByType = events.reduce(
      (acc, event) => {
        acc[event.type as SecurityEventType] = (acc[event.type as SecurityEventType] || 0) + 1
        return acc
      },
      {} as Record<SecurityEventType, number>,
    )

    const ipCounts = events.reduce(
      (acc, event) => {
        if (event.ipAddress) {
          acc[event.ipAddress] = (acc[event.ipAddress] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    const topIpAddresses = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ipAddress, count]) => ({ ipAddress, count }))

    const userCounts = events.reduce(
      (acc, event) => {
        if (event.userId) {
          acc[event.userId] = (acc[event.userId] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    const topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }))

    // Create timeline
    const timeline = this.createTimeline(events, timeframe)

    return {
      totalEvents,
      eventsBySeverity,
      eventsByType,
      topIpAddresses,
      topUsers,
      timeline,
    }
  }

  /**
   * Detect suspicious patterns
   */
  async detectSuspiciousPatterns(): Promise<{
    bruteForceAttempts: Array<{ ipAddress: string; attempts: number }>
    suspiciousIPs: Array<{ ipAddress: string; score: number; reasons: string[] }>
    accountAnomalies: Array<{ userId: string; anomalies: string[] }>
  }> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Detect brute force attempts
    const loginFailures = await this.prisma.securityEvent.findMany({
      where: {
        type: SecurityEventType.LOGIN_FAILURE,
        timestamp: { gte: last24Hours },
      },
    })

    const bruteForceAttempts = Object.entries(
      loginFailures.reduce(
        (acc, event) => {
          if (event.ipAddress) {
            acc[event.ipAddress] = (acc[event.ipAddress] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>,
      ),
    )
      .filter(([, attempts]) => attempts >= 5)
      .map(([ipAddress, attempts]) => ({ ipAddress, attempts }))
      .sort((a, b) => b.attempts - a.attempts)

    // Detect suspicious IPs
    const suspiciousIPs = await this.analyzeSuspiciousIPs(last24Hours)

    // Detect account anomalies
    const accountAnomalies = await this.analyzeAccountAnomalies(last24Hours)

    return {
      bruteForceAttempts,
      suspiciousIPs,
      accountAnomalies,
    }
  }

  /**
   * Resolve security event
   */
  async resolveSecurityEvent(eventId: string, resolvedBy: string): Promise<void> {
    await this.prisma.securityEvent.update({
      where: { id: eventId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
      },
    })
  }

  /**
   * Block IP address
   */
  async blockIPAddress(ipAddress: string, reason: string, blockedBy: string): Promise<void> {
    await this.prisma.blockedIP.create({
      data: {
        ipAddress,
        reason,
        blockedBy,
        blockedAt: new Date(),
        isActive: true,
      },
    })

    await this.logSecurityEvent({
      type: SecurityEventType.ACCOUNT_LOCKOUT,
      severity: SecuritySeverity.HIGH,
      message: `IP address ${ipAddress} blocked: ${reason}`,
      ipAddress,
      metadata: { reason, blockedBy },
    })
  }

  /**
   * Check if IP is blocked
   */
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    const blockedIP = await this.prisma.blockedIP.findFirst({
      where: {
        ipAddress,
        isActive: true,
      },
    })

    return !!blockedIP
  }

  private initializeAlertThresholds(): void {
    this.alertThresholds.set(SecurityEventType.LOGIN_FAILURE, 5)
    this.alertThresholds.set(SecurityEventType.RATE_LIMIT_EXCEEDED, 10)
    this.alertThresholds.set(SecurityEventType.SUSPICIOUS_ACTIVITY, 3)
    this.alertThresholds.set(SecurityEventType.UNAUTHORIZED_ACCESS, 3)
    this.alertThresholds.set(SecurityEventType.SQL_INJECTION_ATTEMPT, 1)
    this.alertThresholds.set(SecurityEventType.XSS_ATTEMPT, 1)
    this.alertThresholds.set(SecurityEventType.DATA_BREACH_ATTEMPT, 1)
  }

  private logEventToConsole(event: SecurityEvent): void {
    const logLevel = this.getLogLevel(event.severity)
    const message = `Security Event: ${event.type} - ${event.message}`
    const context = {
      severity: event.severity,
      userId: event.userId,
      ipAddress: event.ipAddress,
      path: event.requestPath,
      metadata: event.metadata,
    }

    this.logger[logLevel](message, context)
  }

  private getLogLevel(severity: SecuritySeverity): "debug" | "log" | "warn" | "error" {
    switch (severity) {
      case SecuritySeverity.LOW:
        return "debug"
      case SecuritySeverity.MEDIUM:
        return "log"
      case SecuritySeverity.HIGH:
        return "warn"
      case SecuritySeverity.CRITICAL:
        return "error"
      default:
        return "log"
    }
  }

  private async checkAlertConditions(event: SecurityEvent): Promise<void> {
    const threshold = this.alertThresholds.get(event.type)
    if (!threshold) return

    const key = `${event.type}:${event.ipAddress || event.userId}`
    const recentEvents = this.recentEvents.get(key) || []
    recentEvents.push(event)

    // Keep only events from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const filteredEvents = recentEvents.filter((e) => e.timestamp > oneHourAgo)
    this.recentEvents.set(key, filteredEvents)

    if (filteredEvents.length >= threshold) {
      await this.triggerAlert(event, filteredEvents.length)
    }
  }

  private async triggerAlert(event: SecurityEvent, count: number): Promise<void> {
    const alertMessage = `Security alert: ${event.type} occurred ${count} times from ${event.ipAddress || "unknown IP"}`

    this.logger.error(alertMessage, {
      type: event.type,
      count,
      ipAddress: event.ipAddress,
      userId: event.userId,
    })

    // In a real implementation, you would send notifications here
    // (email, Slack, PagerDuty, etc.)
  }

  private storeEventInMemory(event: SecurityEvent): void {
    const key = `${event.type}:${event.ipAddress || event.userId}`
    const events = this.recentEvents.get(key) || []
    events.push(event)

    // Keep only the last 100 events per key
    if (events.length > 100) {
      events.splice(0, events.length - 100)
    }

    this.recentEvents.set(key, events)
  }

  private getClientIP(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string) ||
      (req.headers["x-real-ip"] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "unknown"
    )
      .split(",")[0]
      .trim()
  }

  private getTimeframeDuration(timeframe: string): number {
    switch (timeframe) {
      case "hour":
        return 60 * 60 * 1000
      case "day":
        return 24 * 60 * 60 * 1000
      case "week":
        return 7 * 24 * 60 * 60 * 1000
      case "month":
        return 30 * 24 * 60 * 60 * 1000
      default:
        return 24 * 60 * 60 * 1000
    }
  }

  private createTimeline(events: any[], timeframe: string): Array<{ timestamp: Date; count: number }> {
    const bucketSize = this.getTimeframeDuration(timeframe) / 24 // 24 buckets
    const timeline: Array<{ timestamp: Date; count: number }> = []

    for (let i = 0; i < 24; i++) {
      const bucketStart = new Date(Date.now() - (24 - i) * bucketSize)
      const bucketEnd = new Date(bucketStart.getTime() + bucketSize)

      const count = events.filter((event) => event.timestamp >= bucketStart && event.timestamp < bucketEnd).length

      timeline.push({ timestamp: bucketStart, count })
    }

    return timeline
  }

  private async analyzeSuspiciousIPs(
    since: Date,
  ): Promise<Array<{ ipAddress: string; score: number; reasons: string[] }>> {
    const events = await this.prisma.securityEvent.findMany({
      where: { timestamp: { gte: since } },
    })

    const ipAnalysis = new Map<string, { score: number; reasons: string[] }>()

    events.forEach((event) => {
      if (!event.ipAddress) return

      const analysis = ipAnalysis.get(event.ipAddress) || { score: 0, reasons: [] }

      // Score based on event type and severity
      switch (event.type) {
        case SecurityEventType.LOGIN_FAILURE:
          analysis.score += 1
          break
        case SecurityEventType.SUSPICIOUS_ACTIVITY:
          analysis.score += 3
          analysis.reasons.push("Suspicious activity detected")
          break
        case SecurityEventType.SQL_INJECTION_ATTEMPT:
        case SecurityEventType.XSS_ATTEMPT:
          analysis.score += 10
          analysis.reasons.push("Attack attempt detected")
          break
        case SecurityEventType.RATE_LIMIT_EXCEEDED:
          analysis.score += 2
          analysis.reasons.push("Rate limit exceeded")
          break
      }

      ipAnalysis.set(event.ipAddress, analysis)
    })

    return Array.from(ipAnalysis.entries())
      .filter(([, analysis]) => analysis.score >= 5)
      .map(([ipAddress, analysis]) => ({ ipAddress, ...analysis }))
      .sort((a, b) => b.score - a.score)
  }

  private async analyzeAccountAnomalies(since: Date): Promise<Array<{ userId: string; anomalies: string[] }>> {
    const events = await this.prisma.securityEvent.findMany({
      where: {
        timestamp: { gte: since },
        userId: { not: null },
      },
    })

    const userAnalysis = new Map<string, string[]>()

    events.forEach((event) => {
      if (!event.userId) return

      const anomalies = userAnalysis.get(event.userId) || []

      // Detect various anomalies
      if (event.type === SecurityEventType.LOGIN_SUCCESS) {
        // Check for unusual login times, locations, etc.
        const hour = event.timestamp.getHours()
        if (hour < 6 || hour > 22) {
          anomalies.push("Unusual login time")
        }
      }

      if (event.type === SecurityEventType.PERMISSION_DENIED) {
        anomalies.push("Attempted unauthorized access")
      }

      if (event.type === SecurityEventType.PRIVILEGE_ESCALATION) {
        anomalies.push("Privilege escalation attempt")
      }

      if (anomalies.length > 0) {
        userAnalysis.set(event.userId, [...new Set(anomalies)])
      }
    })

    return Array.from(userAnalysis.entries()).map(([userId, anomalies]) => ({ userId, anomalies }))
  }

  private startCleanupTask(): void {
    // Clean up old events every hour
    setInterval(
      async () => {
        try {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          await this.prisma.securityEvent.deleteMany({
            where: {
              timestamp: { lt: thirtyDaysAgo },
              resolved: true,
            },
          })

          // Clean up memory cache
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
          for (const [key, events] of this.recentEvents.entries()) {
            const filteredEvents = events.filter((e) => e.timestamp > oneHourAgo)
            if (filteredEvents.length === 0) {
              this.recentEvents.delete(key)
            } else {
              this.recentEvents.set(key, filteredEvents)
            }
          }
        } catch (error) {
          this.logger.error("Failed to clean up security events", error)
        }
      },
      60 * 60 * 1000,
    ) // Every hour
  }
}
