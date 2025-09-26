import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SecurityScannerService, SecurityScanResult } from './services/security-scanner.service';
import { IncidentResponseService, SecurityIncident, IncidentType, IncidentSeverity, IncidentStatus } from './services/incident-response.service';
import { AuditService, AuditEventType } from './services/audit.service';
import { RateLimitService, RateLimitType } from './services/rate-limit.service';
import { RequireSecurity } from './guards/security.guard';
import { RateLimit } from './guards/rate-limit.guard';
import { Audit } from './interceptors/audit.interceptor';

@Controller('security')
@UseGuards(JwtAuthGuard)
export class SecurityController {
  constructor(
    private readonly securityScannerService: SecurityScannerService,
    private readonly incidentResponseService: IncidentResponseService,
    private readonly auditService: AuditService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  @Get('scan')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER'],
    sensitiveOperation: true,
    rateLimitType: RateLimitType.EXPENSIVE_OPERATIONS,
  })
  @Audit({
    eventType: AuditEventType.SECURITY_VIOLATION,
    action: 'Security scan initiated',
    resourceType: 'security_scan',
  })
  async runSecurityScan(): Promise<SecurityScanResult> {
    return await this.securityScannerService.runSecurityScan();
  }

  @Get('scan/history')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER'],
    rateLimitType: RateLimitType.API_CALLS,
  })
  async getScanHistory(
    @Query('limit') limit?: number,
  ): Promise<SecurityScanResult[]> {
    return await this.securityScannerService.getScanHistory(limit);
  }

  @Get('scan/findings')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER'],
    rateLimitType: RateLimitType.API_CALLS,
  })
  async getOpenFindings() {
    return await this.securityScannerService.getOpenFindings();
  }

  @Put('scan/findings/:findingId')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER'],
    sensitiveOperation: true,
    rateLimitType: RateLimitType.API_CALLS,
  })
  @Audit({
    eventType: AuditEventType.SECURITY_VIOLATION,
    action: 'Security finding status updated',
    resourceType: 'security_finding',
  })
  async updateFindingStatus(
    @Param('findingId') findingId: string,
    @Body() body: { status: 'ACKNOWLEDGED' | 'FIXED' | 'FALSE_POSITIVE'; notes?: string },
  ): Promise<void> {
    return await this.securityScannerService.updateFindingStatus(
      findingId,
      body.status,
      body.notes,
    );
  }

  @Post('incidents')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER', 'INCIDENT_RESPONDER'],
    sensitiveOperation: true,
    rateLimitType: RateLimitType.API_CALLS,
  })
  @Audit({
    eventType: AuditEventType.SECURITY_VIOLATION,
    action: 'Security incident created',
    resourceType: 'security_incident',
    includeRequestBody: true,
  })
  async createIncident(
    @Body() incident: Omit<SecurityIncident, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>,
  ): Promise<SecurityIncident> {
    return await this.incidentResponseService.createIncident(incident);
  }

  @Get('incidents')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER', 'INCIDENT_RESPONDER'],
    rateLimitType: RateLimitType.API_CALLS,
  })
  async getIncidents(
    @Query('type') type?: IncidentType,
    @Query('severity') severity?: IncidentSeverity,
    @Query('status') status?: IncidentStatus,
    @Query('assignedTo') assignedTo?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<SecurityIncident[]> {
    return await this.incidentResponseService.getIncidents({
      type,
      severity,
      status,
      assignedTo,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });
  }

  @Get('incidents/:incidentId')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER', 'INCIDENT_RESPONDER'],
    rateLimitType: RateLimitType.API_CALLS,
  })
  async getIncident(@Param('incidentId') incidentId: string): Promise<SecurityIncident | null> {
    return await this.incidentResponseService.getIncident(incidentId);
  }

  @Put('incidents/:incidentId')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER', 'INCIDENT_RESPONDER'],
    sensitiveOperation: true,
    rateLimitType: RateLimitType.API_CALLS,
  })
  @Audit({
    eventType: AuditEventType.SECURITY_VIOLATION,
    action: 'Security incident updated',
    resourceType: 'security_incident',
    includeRequestBody: true,
  })
  async updateIncident(
    @Param('incidentId') incidentId: string,
    @Body() body: {
      updates: Partial<SecurityIncident>;
      timelineEntry: {
        action: string;
        description: string;
        performedBy: string;
        evidence?: Record<string, any>;
      };
    },
  ): Promise<SecurityIncident> {
    return await this.incidentResponseService.updateIncident(
      incidentId,
      body.updates,
      body.timelineEntry,
    );
  }

  @Get('incidents/:incidentId/report')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER', 'INCIDENT_RESPONDER'],
    sensitiveOperation: true,
    rateLimitType: RateLimitType.API_CALLS,
  })
  @Audit({
    eventType: AuditEventType.DATA_ACCESSED,
    action: 'Security incident report generated',
    resourceType: 'security_incident',
  })
  async generateIncidentReport(@Param('incidentId') incidentId: string) {
    return await this.incidentResponseService.generateIncidentReport(incidentId);
  }

  @Get('incidents/:incidentId/playbook')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER', 'INCIDENT_RESPONDER'],
    rateLimitType: RateLimitType.API_CALLS,
  })
  async getIncidentPlaybook(@Param('incidentId') incidentId: string) {
    const incident = await this.incidentResponseService.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }
    return this.incidentResponseService.getResponsePlaybook(incident.type);
  }

  @Get('audit/logs')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER', 'AUDITOR'],
    rateLimitType: RateLimitType.API_CALLS,
  })
  @Audit({
    eventType: AuditEventType.AUDIT_LOG_ACCESSED,
    action: 'Audit logs accessed',
    resourceType: 'audit_log',
  })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('householdId') householdId?: string,
    @Query('eventType') eventType?: AuditEventType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return await this.auditService.queryAuditLogs({
      userId,
      householdId,
      eventType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });
  }

  @Get('audit/report')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER', 'AUDITOR'],
    sensitiveOperation: true,
    rateLimitType: RateLimitType.EXPENSIVE_OPERATIONS,
  })
  @Audit({
    eventType: AuditEventType.AUDIT_LOG_ACCESSED,
    action: 'Audit report generated',
    resourceType: 'audit_report',
  })
  async generateAuditReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('householdId') householdId?: string,
  ) {
    return await this.auditService.generateAuditReport(
      new Date(startDate),
      new Date(endDate),
      householdId,
    );
  }

  @Get('rate-limit/status')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER'],
    rateLimitType: RateLimitType.API_CALLS,
  })
  async getRateLimitStatus(
    @Query('key') key: string,
    @Query('type') type: RateLimitType,
  ) {
    return await this.rateLimitService.getRateLimitStatus(key, type);
  }

  @Post('rate-limit/reset')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER'],
    sensitiveOperation: true,
    rateLimitType: RateLimitType.API_CALLS,
  })
  @Audit({
    eventType: AuditEventType.CONFIGURATION_CHANGED,
    action: 'Rate limit reset',
    resourceType: 'rate_limit',
    includeRequestBody: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetRateLimit(
    @Body() body: { key: string; type: RateLimitType },
  ): Promise<void> {
    return await this.rateLimitService.resetRateLimit(body.key, body.type);
  }

  @Post('rate-limit/whitelist')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER'],
    sensitiveOperation: true,
    rateLimitType: RateLimitType.API_CALLS,
  })
  @Audit({
    eventType: AuditEventType.CONFIGURATION_CHANGED,
    action: 'Added to rate limit whitelist',
    resourceType: 'rate_limit_whitelist',
    includeRequestBody: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async addToWhitelist(
    @Body() body: { identifier: string; type: 'ip' | 'user'; expiresIn?: number },
  ): Promise<void> {
    return await this.rateLimitService.addToWhitelist(
      body.identifier,
      body.type,
      body.expiresIn,
    );
  }

  @Delete('rate-limit/whitelist')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER'],
    sensitiveOperation: true,
    rateLimitType: RateLimitType.API_CALLS,
  })
  @Audit({
    eventType: AuditEventType.CONFIGURATION_CHANGED,
    action: 'Removed from rate limit whitelist',
    resourceType: 'rate_limit_whitelist',
    includeRequestBody: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromWhitelist(
    @Body() body: { identifier: string; type: 'ip' | 'user' },
  ): Promise<void> {
    return await this.rateLimitService.removeFromWhitelist(body.identifier, body.type);
  }

  @Get('statistics')
  @RequireSecurity({
    requiresAuth: true,
    requiresRole: ['ADMIN', 'SECURITY_OFFICER'],
    rateLimitType: RateLimitType.API_CALLS,
  })
  async getSecurityStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const timeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    const [incidentStats, rateLimitStats] = await Promise.all([
      this.incidentResponseService.getIncidentStatistics(timeRange),
      this.rateLimitService.getRateLimitStats(RateLimitType.GLOBAL, timeRange),
    ]);

    return {
      incidents: incidentStats,
      rateLimit: rateLimitStats,
      timeRange,
    };
  }
}
