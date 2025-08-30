import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService, AuditEventType, AuditSeverity } from './audit.service';
import { EncryptionService } from './encryption.service';
import * as crypto from 'crypto';

export enum IncidentType {
  DATA_BREACH = 'DATA_BREACH',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  DDOS_ATTACK = 'DDOS_ATTACK',
  INSIDER_THREAT = 'INSIDER_THREAT',
  SYSTEM_COMPROMISE = 'SYSTEM_COMPROMISE',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  SERVICE_DISRUPTION = 'SERVICE_DISRUPTION',
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  DETECTED = 'DETECTED',
  INVESTIGATING = 'INVESTIGATING',
  CONTAINED = 'CONTAINED',
  ERADICATED = 'ERADICATED',
  RECOVERED = 'RECOVERED',
  CLOSED = 'CLOSED',
}

export interface SecurityIncident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  detectedAt: Date;
  reportedBy?: string;
  assignedTo?: string;
  affectedSystems: string[];
  affectedUsers: string[];
  evidence: Record<string, any>;
  timeline: IncidentTimelineEntry[];
  containmentActions: string[];
  eradicationActions: string[];
  recoveryActions: string[];
  lessonsLearned?: string;
  rootCause?: string;
  estimatedImpact?: {
    usersAffected: number;
    dataCompromised: boolean;
    financialImpact?: number;
    reputationalImpact?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface IncidentTimelineEntry {
  timestamp: Date;
  action: string;
  description: string;
  performedBy: string;
  evidence?: Record<string, any>;
}

export interface IncidentResponse {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  notifications: string[];
  escalation: string[];
}

@Injectable()
export class IncidentResponseService {
  private readonly logger = new Logger(IncidentResponseService.name);

  // Incident response playbooks
  private readonly responsePlaybooks: Record<IncidentType, IncidentResponse> = {
    [IncidentType.DATA_BREACH]: {
      immediate: [
        'Isolate affected systems',
        'Preserve evidence',
        'Assess scope of breach',
        'Notify incident response team',
        'Document all actions',
      ],
      shortTerm: [
        'Contain the breach',
        'Assess data compromised',
        'Notify affected users',
        'Implement additional security controls',
        'Coordinate with legal team',
      ],
      longTerm: [
        'Conduct forensic analysis',
        'Implement security improvements',
        'Update incident response procedures',
        'Provide user support',
        'Monitor for further compromise',
      ],
      notifications: [
        'Security team',
        'Legal team',
        'Executive leadership',
        'Affected users',
        'Regulatory authorities (if required)',
      ],
      escalation: [
        'Immediate: Security team lead',
        'Within 1 hour: CTO/CISO',
        'Within 4 hours: CEO',
        'Within 24 hours: Board of directors (if critical)',
      ],
    },
    [IncidentType.UNAUTHORIZED_ACCESS]: {
      immediate: [
        'Disable compromised accounts',
        'Change affected passwords',
        'Review access logs',
        'Isolate affected systems',
        'Preserve evidence',
      ],
      shortTerm: [
        'Investigate attack vector',
        'Assess data accessed',
        'Implement additional authentication',
        'Monitor for lateral movement',
        'Update access controls',
      ],
      longTerm: [
        'Conduct security assessment',
        'Implement MFA if not present',
        'Update security training',
        'Review access policies',
        'Monitor for indicators of compromise',
      ],
      notifications: [
        'Security team',
        'Affected users',
        'System administrators',
        'Management',
      ],
      escalation: [
        'Immediate: Security team',
        'Within 2 hours: IT management',
        'Within 8 hours: Executive team',
      ],
    },
    [IncidentType.DDOS_ATTACK]: {
      immediate: [
        'Activate DDoS mitigation',
        'Monitor traffic patterns',
        'Implement rate limiting',
        'Contact ISP/CDN provider',
        'Document attack characteristics',
      ],
      shortTerm: [
        'Analyze attack vectors',
        'Implement traffic filtering',
        'Scale infrastructure if needed',
        'Monitor service availability',
        'Communicate with users',
      ],
      longTerm: [
        'Review DDoS protection',
        'Update incident procedures',
        'Implement additional protections',
        'Conduct post-incident analysis',
        'Update monitoring systems',
      ],
      notifications: [
        'Infrastructure team',
        'Network operations',
        'Customer support',
        'Management',
      ],
      escalation: [
        'Immediate: Network operations',
        'Within 30 minutes: Infrastructure lead',
        'Within 2 hours: CTO',
      ],
    },
    // Add other incident types...
    [IncidentType.MALWARE_DETECTED]: {
      immediate: ['Isolate infected systems', 'Run antivirus scans', 'Preserve evidence'],
      shortTerm: ['Remove malware', 'Patch vulnerabilities', 'Monitor for reinfection'],
      longTerm: ['Update security controls', 'Conduct security training', 'Review policies'],
      notifications: ['Security team', 'IT team', 'Affected users'],
      escalation: ['Immediate: Security team', 'Within 4 hours: IT management'],
    },
    [IncidentType.INSIDER_THREAT]: {
      immediate: ['Secure evidence', 'Limit access', 'Notify HR and legal'],
      shortTerm: ['Investigate activities', 'Interview personnel', 'Review access logs'],
      longTerm: ['Update HR policies', 'Implement monitoring', 'Conduct training'],
      notifications: ['Security team', 'HR', 'Legal', 'Management'],
      escalation: ['Immediate: Security and HR', 'Within 2 hours: Executive team'],
    },
    [IncidentType.SYSTEM_COMPROMISE]: {
      immediate: ['Isolate systems', 'Preserve evidence', 'Assess damage'],
      shortTerm: ['Remove threats', 'Patch vulnerabilities', 'Restore from backups'],
      longTerm: ['Harden systems', 'Update monitoring', 'Review architecture'],
      notifications: ['Security team', 'IT team', 'Management'],
      escalation: ['Immediate: Security team', 'Within 1 hour: CTO'],
    },
    [IncidentType.DATA_CORRUPTION]: {
      immediate: ['Stop data processing', 'Preserve corrupted data', 'Assess scope'],
      shortTerm: ['Restore from backups', 'Identify root cause', 'Validate data integrity'],
      longTerm: ['Improve backup procedures', 'Implement data validation', 'Update monitoring'],
      notifications: ['IT team', 'Data team', 'Affected users', 'Management'],
      escalation: ['Immediate: IT team', 'Within 2 hours: CTO'],
    },
    [IncidentType.SERVICE_DISRUPTION]: {
      immediate: ['Assess service status', 'Implement workarounds', 'Communicate with users'],
      shortTerm: ['Restore services', 'Identify root cause', 'Monitor stability'],
      longTerm: ['Improve resilience', 'Update procedures', 'Conduct post-mortem'],
      notifications: ['Operations team', 'Customer support', 'Management', 'Users'],
      escalation: ['Immediate: Operations', 'Within 1 hour: Engineering lead'],
    },
    [IncidentType.COMPLIANCE_VIOLATION]: {
      immediate: ['Document violation', 'Notify compliance team', 'Preserve evidence'],
      shortTerm: ['Investigate cause', 'Implement corrective actions', 'Report to authorities'],
      longTerm: ['Update compliance procedures', 'Conduct training', 'Monitor compliance'],
      notifications: ['Compliance team', 'Legal', 'Management', 'Auditors'],
      escalation: ['Immediate: Compliance team', 'Within 4 hours: Executive team'],
    },
    [IncidentType.SUSPICIOUS_ACTIVITY]: {
      immediate: ['Monitor activity', 'Preserve evidence', 'Assess threat level'],
      shortTerm: ['Investigate patterns', 'Implement additional monitoring', 'Block if necessary'],
      longTerm: ['Update detection rules', 'Improve monitoring', 'Conduct analysis'],
      notifications: ['Security team', 'Operations team'],
      escalation: ['If confirmed threat: Security lead', 'If critical: Management'],
    },
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Create a new security incident
   */
  async createIncident(incident: Omit<SecurityIncident, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>): Promise<SecurityIncident> {
    const incidentId = crypto.randomUUID();
    const now = new Date();

    const newIncident: SecurityIncident = {
      ...incident,
      id: incidentId,
      createdAt: now,
      updatedAt: now,
      timeline: [{
        timestamp: now,
        action: 'INCIDENT_CREATED',
        description: `Incident created: ${incident.title}`,
        performedBy: incident.reportedBy || 'system',
        evidence: { initialReport: incident.evidence },
      }],
    };

    // Store incident in database
    await this.prisma.securityIncident.create({
      data: {
        id: incidentId,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        title: incident.title,
        description: incident.description,
        detectedAt: incident.detectedAt,
        reportedBy: incident.reportedBy,
        assignedTo: incident.assignedTo,
        affectedSystems: incident.affectedSystems,
        affectedUsers: incident.affectedUsers,
        evidence: incident.evidence,
        timeline: newIncident.timeline,
        containmentActions: incident.containmentActions,
        eradicationActions: incident.eradicationActions,
        recoveryActions: incident.recoveryActions,
        estimatedImpact: incident.estimatedImpact,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Log audit event
    await this.auditService.logEvent({
      eventType: AuditEventType.SECURITY_VIOLATION,
      severity: this.mapIncidentSeverityToAuditSeverity(incident.severity),
      action: 'Security incident created',
      details: {
        incidentId,
        type: incident.type,
        severity: incident.severity,
        title: incident.title,
      },
      success: true,
    });

    // Trigger automatic response
    await this.triggerAutomaticResponse(newIncident);

    this.logger.error(`Security incident created: ${incident.title}`, {
      incidentId,
      type: incident.type,
      severity: incident.severity,
    });

    return newIncident;
  }

  /**
   * Update incident status and add timeline entry
   */
  async updateIncident(
    incidentId: string,
    updates: Partial<SecurityIncident>,
    timelineEntry: Omit<IncidentTimelineEntry, 'timestamp'>,
  ): Promise<SecurityIncident> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const now = new Date();
    const newTimelineEntry: IncidentTimelineEntry = {
      ...timelineEntry,
      timestamp: now,
    };

    const updatedIncident: SecurityIncident = {
      ...incident,
      ...updates,
      timeline: [...incident.timeline, newTimelineEntry],
      updatedAt: now,
      closedAt: updates.status === IncidentStatus.CLOSED ? now : incident.closedAt,
    };

    // Update in database
    await this.prisma.securityIncident.update({
      where: { id: incidentId },
      data: {
        ...updates,
        timeline: updatedIncident.timeline,
        updatedAt: now,
        closedAt: updatedIncident.closedAt,
      },
    });

    // Log audit event
    await this.auditService.logEvent({
      eventType: AuditEventType.SECURITY_VIOLATION,
      severity: AuditSeverity.MEDIUM,
      action: 'Security incident updated',
      details: {
        incidentId,
        updates,
        timelineEntry: newTimelineEntry,
      },
      success: true,
    });

    this.logger.log(`Security incident updated: ${incidentId}`, {
      status: updates.status,
      action: timelineEntry.action,
    });

    return updatedIncident;
  }

  /**
   * Get incident by ID
   */
  async getIncident(incidentId: string): Promise<SecurityIncident | null> {
    const incident = await this.prisma.securityIncident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      return null;
    }

    return {
      id: incident.id,
      type: incident.type as IncidentType,
      severity: incident.severity as IncidentSeverity,
      status: incident.status as IncidentStatus,
      title: incident.title,
      description: incident.description,
      detectedAt: incident.detectedAt,
      reportedBy: incident.reportedBy,
      assignedTo: incident.assignedTo,
      affectedSystems: incident.affectedSystems,
      affectedUsers: incident.affectedUsers,
      evidence: incident.evidence as Record<string, any>,
      timeline: incident.timeline as IncidentTimelineEntry[],
      containmentActions: incident.containmentActions,
      eradicationActions: incident.eradicationActions,
      recoveryActions: incident.recoveryActions,
      lessonsLearned: incident.lessonsLearned,
      rootCause: incident.rootCause,
      estimatedImpact: incident.estimatedImpact as any,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
      closedAt: incident.closedAt,
    };
  }

  /**
   * Get all incidents with filters
   */
  async getIncidents(filters: {
    type?: IncidentType;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
    assignedTo?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<SecurityIncident[]> {
    const where: any = {};

    if (filters.type) where.type = filters.type;
    if (filters.severity) where.severity = filters.severity;
    if (filters.status) where.status = filters.status;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;

    if (filters.startDate || filters.endDate) {
      where.detectedAt = {};
      if (filters.startDate) where.detectedAt.gte = filters.startDate;
      if (filters.endDate) where.detectedAt.lte = filters.endDate;
    }

    const incidents = await this.prisma.securityIncident.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    return incidents.map(incident => ({
      id: incident.id,
      type: incident.type as IncidentType,
      severity: incident.severity as IncidentSeverity,
      status: incident.status as IncidentStatus,
      title: incident.title,
      description: incident.description,
      detectedAt: incident.detectedAt,
      reportedBy: incident.reportedBy,
      assignedTo: incident.assignedTo,
      affectedSystems: incident.affectedSystems,
      affectedUsers: incident.affectedUsers,
      evidence: incident.evidence as Record<string, any>,
      timeline: incident.timeline as IncidentTimelineEntry[],
      containmentActions: incident.containmentActions,
      eradicationActions: incident.eradicationActions,
      recoveryActions: incident.recoveryActions,
      lessonsLearned: incident.lessonsLearned,
      rootCause: incident.rootCause,
      estimatedImpact: incident.estimatedImpact as any,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
      closedAt: incident.closedAt,
    }));
  }

  /**
   * Get incident response playbook
   */
  getResponsePlaybook(type: IncidentType): IncidentResponse {
    return this.responsePlaybooks[type];
  }

  /**
   * Trigger automatic response based on incident type and severity
   */
  private async triggerAutomaticResponse(incident: SecurityIncident): Promise<void> {
    const playbook = this.getResponsePlaybook(incident.type);

    // Execute immediate actions based on severity
    if (incident.severity === IncidentSeverity.CRITICAL) {
      await this.executeCriticalResponse(incident);
    }

    // Send notifications
    await this.sendIncidentNotifications(incident, playbook.notifications);

    // Log automatic actions
    await this.updateIncident(incident.id, {}, {
      action: 'AUTOMATIC_RESPONSE_TRIGGERED',
      description: 'Automatic incident response procedures initiated',
      performedBy: 'system',
      evidence: { playbook: playbook.immediate },
    });
  }

  /**
   * Execute critical incident response
   */
  private async executeCriticalResponse(incident: SecurityIncident): Promise<void> {
    this.logger.error('CRITICAL SECURITY INCIDENT', {
      incidentId: incident.id,
      type: incident.type,
      title: incident.title,
    });

    // Implement automatic containment measures
    switch (incident.type) {
      case IncidentType.DATA_BREACH:
        await this.containDataBreach(incident);
        break;
      case IncidentType.UNAUTHORIZED_ACCESS:
        await this.containUnauthorizedAccess(incident);
        break;
      case IncidentType.DDOS_ATTACK:
        await this.containDDoSAttack(incident);
        break;
      case IncidentType.SYSTEM_COMPROMISE:
        await this.containSystemCompromise(incident);
        break;
    }
  }

  /**
   * Contain data breach
   */
  private async containDataBreach(incident: SecurityIncident): Promise<void> {
    // Implement data breach containment
    // This would include:
    // - Isolating affected systems
    // - Revoking access tokens
    // - Enabling additional monitoring
    // - Preserving evidence

    await this.auditService.logEvent({
      eventType: AuditEventType.DATA_BREACH_ATTEMPT,
      severity: AuditSeverity.CRITICAL,
      action: 'Data breach containment initiated',
      details: {
        incidentId: incident.id,
        affectedSystems: incident.affectedSystems,
        affectedUsers: incident.affectedUsers,
      },
      success: true,
    });
  }

  /**
   * Contain unauthorized access
   */
  private async containUnauthorizedAccess(incident: SecurityIncident): Promise<void> {
    // Disable affected user accounts
    if (incident.affectedUsers.length > 0) {
      for (const userId of incident.affectedUsers) {
        try {
          await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
          });

          // Revoke all sessions
          await this.prisma.session.deleteMany({
            where: { userId },
          });
        } catch (error) {
          this.logger.error(`Failed to disable user ${userId}`, error);
        }
      }
    }

    await this.auditService.logEvent({
      eventType: AuditEventType.UNAUTHORIZED_ACCESS,
      severity: AuditSeverity.HIGH,
      action: 'Unauthorized access containment initiated',
      details: {
        incidentId: incident.id,
        affectedUsers: incident.affectedUsers,
        actionsPerformed: ['disable_accounts', 'revoke_sessions'],
      },
      success: true,
    });
  }

  /**
   * Contain DDoS attack
   */
  private async containDDoSAttack(incident: SecurityIncident): Promise<void> {
    // Implement DDoS containment
    // This would typically involve:
    // - Activating rate limiting
    // - Blocking suspicious IPs
    // - Scaling infrastructure
    // - Contacting CDN/DDoS protection service

    await this.auditService.logEvent({
      eventType: AuditEventType.SECURITY_VIOLATION,
      severity: AuditSeverity.HIGH,
      action: 'DDoS attack containment initiated',
      details: {
        incidentId: incident.id,
        affectedSystems: incident.affectedSystems,
      },
      success: true,
    });
  }

  /**
   * Contain system compromise
   */
  private async containSystemCompromise(incident: SecurityIncident): Promise<void> {
    // Implement system compromise containment
    // This would include:
    // - Isolating affected systems
    // - Preserving evidence
    // - Revoking credentials
    // - Enabling enhanced monitoring

    await this.auditService.logEvent({
      eventType: AuditEventType.SYSTEM_COMPROMISE,
      severity: AuditSeverity.CRITICAL,
      action: 'System compromise containment initiated',
      details: {
        incidentId: incident.id,
        affectedSystems: incident.affectedSystems,
      },
      success: true,
    });
  }

  /**
   * Send incident notifications
   */
  private async sendIncidentNotifications(
    incident: SecurityIncident,
    recipients: string[],
  ): Promise<void> {
    // This would integrate with notification systems
    // For now, just log the notifications
    this.logger.warn('Security incident notifications', {
      incidentId: incident.id,
      recipients,
      severity: incident.severity,
      type: incident.type,
    });

    // TODO: Implement actual notification sending
    // - Email notifications
    // - Slack/Teams messages
    // - SMS for critical incidents
    // - PagerDuty alerts
  }

  /**
   * Generate incident report
   */
  async generateIncidentReport(incidentId: string): Promise<{
    incident: SecurityIncident;
    summary: string;
    timeline: IncidentTimelineEntry[];
    impact: any;
    recommendations: string[];
  }> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const playbook = this.getResponsePlaybook(incident.type);

    return {
      incident,
      summary: this.generateIncidentSummary(incident),
      timeline: incident.timeline,
      impact: incident.estimatedImpact,
      recommendations: [
        ...playbook.longTerm,
        'Conduct post-incident review',
        'Update incident response procedures',
        'Provide additional security training',
      ],
    };
  }

  /**
   * Generate incident summary
   */
  private generateIncidentSummary(incident: SecurityIncident): string {
    const duration = incident.closedAt
      ? Math.round((incident.closedAt.getTime() - incident.detectedAt.getTime()) / (1000 * 60))
      : 'Ongoing';

    return `
Security incident ${incident.id} of type ${incident.type} was detected on ${incident.detectedAt.toISOString()}.
Severity: ${incident.severity}
Status: ${incident.status}
Duration: ${duration} minutes
Affected Systems: ${incident.affectedSystems.join(', ')}
Affected Users: ${incident.affectedUsers.length}
Root Cause: ${incident.rootCause || 'Under investigation'}
    `.trim();
  }

  /**
   * Map incident severity to audit severity
   */
  private mapIncidentSeverityToAuditSeverity(severity: IncidentSeverity): AuditSeverity {
    switch (severity) {
      case IncidentSeverity.CRITICAL:
        return AuditSeverity.CRITICAL;
      case IncidentSeverity.HIGH:
        return AuditSeverity.HIGH;
      case IncidentSeverity.MEDIUM:
        return AuditSeverity.MEDIUM;
      case IncidentSeverity.LOW:
        return AuditSeverity.LOW;
      default:
        return AuditSeverity.MEDIUM;
    }
  }

  /**
   * Get incident statistics
   */
  async getIncidentStatistics(timeRange: { start: Date; end: Date }) {
    const incidents = await this.getIncidents({
      startDate: timeRange.start,
      endDate: timeRange.end,
    });

    const stats = {
      total: incidents.length,
      byType: {} as Record<IncidentType, number>,
      bySeverity: {} as Record<IncidentSeverity, number>,
      byStatus: {} as Record<IncidentStatus, number>,
      averageResolutionTime: 0,
      openIncidents: 0,
    };

    let totalResolutionTime = 0;
    let resolvedIncidents = 0;

    incidents.forEach(incident => {
      // Count by type
      stats.byType[incident.type] = (stats.byType[incident.type] || 0) + 1;

      // Count by severity
      stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] || 0) + 1;

      // Count by status
      stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;

      // Calculate resolution time
      if (incident.closedAt) {
        const resolutionTime = incident.closedAt.getTime() - incident.detectedAt.getTime();
        totalResolutionTime += resolutionTime;
        resolvedIncidents++;
      } else {
        stats.openIncidents++;
      }
    });

    if (resolvedIncidents > 0) {
      stats.averageResolutionTime = Math.round(totalResolutionTime / resolvedIncidents / (1000 * 60)); // minutes
    }

    return stats;
  }
}
