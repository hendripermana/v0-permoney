import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import type { StructuredLoggerService } from "../common/logging/logger.service"
import type { MetricsService } from "../common/metrics/metrics.service"

export interface AlertRule {
  id: string
  name: string
  condition: string
  threshold: number
  severity: "low" | "medium" | "high" | "critical"
  enabled: boolean
  cooldown: number // minutes
  lastTriggered?: Date
}

export interface SystemAlert {
  id: string
  ruleId: string
  severity: "low" | "medium" | "high" | "critical"
  message: string
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  metadata: Record<string, any>
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name)
  private alerts: SystemAlert[] = []
  private alertRules: AlertRule[] = [
    {
      id: "high-error-rate",
      name: "High Error Rate",
      condition: "error_rate > threshold",
      threshold: 5, // 5% error rate
      severity: "high",
      enabled: true,
      cooldown: 15,
    },
    {
      id: "high-response-time",
      name: "High Response Time",
      condition: "avg_response_time > threshold",
      threshold: 2000, // 2 seconds
      severity: "medium",
      enabled: true,
      cooldown: 10,
    },
    {
      id: "database-connection-issues",
      name: "Database Connection Issues",
      condition: "db_connection_failures > threshold",
      threshold: 3,
      severity: "critical",
      enabled: true,
      cooldown: 5,
    },
    {
      id: "memory-usage-high",
      name: "High Memory Usage",
      condition: "memory_usage_percent > threshold",
      threshold: 85,
      severity: "medium",
      enabled: true,
      cooldown: 20,
    },
  ]

  constructor(
    private configService: ConfigService,
    private structuredLogger: StructuredLoggerService,
    private metricsService: MetricsService,
  ) {
    // Start monitoring loop
    this.startMonitoring()
  }

  private startMonitoring() {
    // Check alerts every minute
    setInterval(() => {
      this.checkAlerts()
    }, 60000)

    // Clean up old alerts every hour
    setInterval(() => {
      this.cleanupOldAlerts()
    }, 3600000)
  }

  async checkAlerts() {
    const metrics = await this.metricsService.getCurrentMetrics()

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      // Check cooldown
      if (rule.lastTriggered && Date.now() - rule.lastTriggered.getTime() < rule.cooldown * 60000) {
        continue
      }

      const shouldTrigger = await this.evaluateAlertRule(rule, metrics)

      if (shouldTrigger) {
        await this.triggerAlert(rule, metrics)
      }
    }
  }

  private async evaluateAlertRule(rule: AlertRule, metrics: any): Promise<boolean> {
    switch (rule.id) {
      case "high-error-rate":
        const errorRate = (metrics.errors / metrics.totalRequests) * 100
        return errorRate > rule.threshold

      case "high-response-time":
        return metrics.avgResponseTime > rule.threshold

      case "database-connection-issues":
        return metrics.dbConnectionFailures > rule.threshold

      case "memory-usage-high":
        const memUsage = process.memoryUsage()
        const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
        return usagePercent > rule.threshold

      default:
        return false
    }
  }

  private async triggerAlert(rule: AlertRule, metrics: any) {
    const alert: SystemAlert = {
      id: `${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: `Alert: ${rule.name} - Threshold exceeded`,
      timestamp: new Date(),
      resolved: false,
      metadata: { metrics, rule },
    }

    this.alerts.push(alert)
    rule.lastTriggered = new Date()

    // Log the alert
    this.structuredLogger.logSecurityEvent(`Alert triggered: ${rule.name}`, rule.severity, {
      alertId: alert.id,
      ruleId: rule.id,
      threshold: rule.threshold,
      currentValue: metrics,
    })

    // Send notifications based on severity
    await this.sendAlertNotification(alert)
  }

  private async sendAlertNotification(alert: SystemAlert) {
    // Email notification for high/critical alerts
    if (["high", "critical"].includes(alert.severity)) {
      await this.sendEmailAlert(alert)
    }

    // Slack/Discord webhook for all alerts
    await this.sendWebhookAlert(alert)

    // SMS for critical alerts (if configured)
    if (alert.severity === "critical") {
      await this.sendSMSAlert(alert)
    }
  }

  private async sendEmailAlert(alert: SystemAlert) {
    // Implement email sending logic
    this.logger.log(`Email alert sent for: ${alert.message}`)
  }

  private async sendWebhookAlert(alert: SystemAlert) {
    const webhookUrl = this.configService.get("ALERT_WEBHOOK_URL")
    if (!webhookUrl) return

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚨 ${alert.severity.toUpperCase()} Alert: ${alert.message}`,
          attachments: [
            {
              color: this.getAlertColor(alert.severity),
              fields: [
                { title: "Severity", value: alert.severity, short: true },
                { title: "Time", value: alert.timestamp.toISOString(), short: true },
                { title: "Rule ID", value: alert.ruleId, short: true },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`)
      }
    } catch (error) {
      this.logger.error("Failed to send webhook alert", error.stack)
    }
  }

  private async sendSMSAlert(alert: SystemAlert) {
    // Implement SMS sending logic (Twilio, AWS SNS, etc.)
    this.logger.log(`SMS alert would be sent for: ${alert.message}`)
  }

  private getAlertColor(severity: string): string {
    switch (severity) {
      case "critical":
        return "#ff0000"
      case "high":
        return "#ff6600"
      case "medium":
        return "#ffcc00"
      case "low":
        return "#00ff00"
      default:
        return "#cccccc"
    }
  }

  private cleanupOldAlerts() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    this.alerts = this.alerts.filter((alert) => alert.timestamp > oneWeekAgo || !alert.resolved)
  }

  // Public API methods
  getActiveAlerts(): SystemAlert[] {
    return this.alerts.filter((alert) => !alert.resolved)
  }

  getAllAlerts(): SystemAlert[] {
    return [...this.alerts]
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      return true
    }
    return false
  }

  getAlertRules(): AlertRule[] {
    return [...this.alertRules]
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.find((r) => r.id === ruleId)
    if (rule) {
      Object.assign(rule, updates)
      return true
    }
    return false
  }
}
