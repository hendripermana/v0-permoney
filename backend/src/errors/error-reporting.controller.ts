import { Controller, Post, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import type { ErrorReportingService } from "./error-reporting.service"
import type { CreateErrorReportDto } from "./dto/create-error-report.dto"
import { type AuditService, AuditEventType, AuditSeverity } from "../security/services/audit.service"

@Controller("errors")
export class ErrorReportingController {
  constructor(
    private readonly errorReportingService: ErrorReportingService,
    private readonly auditService: AuditService,
  ) {}

  @Post("report")
  @UseGuards(JwtAuthGuard)
  async reportError(errorReport: CreateErrorReportDto, req: any) {
    const user = req.user

    // Process and store the error report
    const processedReport = await this.errorReportingService.processErrorReport({
      ...errorReport,
      userId: user?.id,
      householdId: user?.householdId,
      reportedAt: new Date(),
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    })

    // Log to audit system
    await this.auditService.logEvent({
      eventType: AuditEventType.ERROR_REPORTED,
      severity: this.mapSeverity(errorReport.severity),
      userId: user?.id,
      householdId: user?.householdId,
      resourceType: "error_report",
      resourceId: processedReport.id,
      action: "Report Client Error",
      details: {
        errorFingerprint: errorReport.fingerprint,
        component: errorReport.context.component,
        action: errorReport.context.action,
        severity: errorReport.severity,
      },
      success: true,
    })

    // Trigger alerts for critical errors
    if (errorReport.severity === "critical") {
      await this.errorReportingService.triggerCriticalErrorAlert(processedReport)
    }

    return {
      success: true,
      reportId: processedReport.id,
      message: "Error report received and processed",
    }
  }

  private mapSeverity(severity: string): AuditSeverity {
    switch (severity) {
      case "critical":
        return AuditSeverity.CRITICAL
      case "high":
        return AuditSeverity.HIGH
      case "medium":
        return AuditSeverity.MEDIUM
      case "low":
        return AuditSeverity.LOW
      default:
        return AuditSeverity.MEDIUM
    }
  }
}
