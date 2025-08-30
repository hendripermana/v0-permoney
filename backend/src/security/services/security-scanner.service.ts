import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService, AuditEventType, AuditSeverity } from './audit.service';
import * as crypto from 'crypto';

export enum VulnerabilityType {
  SQL_INJECTION = 'SQL_INJECTION',
  XSS = 'XSS',
  CSRF = 'CSRF',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INSECURE_DIRECT_OBJECT_REFERENCE = 'INSECURE_DIRECT_OBJECT_REFERENCE',
  SENSITIVE_DATA_EXPOSURE = 'SENSITIVE_DATA_EXPOSURE',
  BROKEN_AUTHENTICATION = 'BROKEN_AUTHENTICATION',
  SECURITY_MISCONFIGURATION = 'SECURITY_MISCONFIGURATION',
  KNOWN_VULNERABLE_COMPONENTS = 'KNOWN_VULNERABLE_COMPONENTS',
  INSUFFICIENT_LOGGING = 'INSUFFICIENT_LOGGING',
}

export enum ScanSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface SecurityFinding {
  id: string;
  type: VulnerabilityType;
  severity: ScanSeverity;
  title: string;
  description: string;
  location: string;
  evidence: Record<string, any>;
  recommendation: string;
  cveId?: string;
  cvssScore?: number;
  discoveredAt: Date;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'FIXED' | 'FALSE_POSITIVE';
}

export interface SecurityScanResult {
  scanId: string;
  scanType: string;
  startTime: Date;
  endTime: Date;
  findings: SecurityFinding[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

@Injectable()
export class SecurityScannerService {
  private readonly logger = new Logger(SecurityScannerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Run comprehensive security scan
   */
  async runSecurityScan(): Promise<SecurityScanResult> {
    const scanId = crypto.randomUUID();
    const startTime = new Date();
    
    this.logger.log(`Starting security scan ${scanId}`);

    try {
      const findings: SecurityFinding[] = [];

      // Run different types of scans
      findings.push(...await this.scanConfiguration());
      findings.push(...await this.scanAuthentication());
      findings.push(...await this.scanDataProtection());
      findings.push(...await this.scanInputValidation());
      findings.push(...await this.scanAccessControl());
      findings.push(...await this.scanLogging());
      findings.push(...await this.scanDependencies());

      const endTime = new Date();
      const summary = this.generateSummary(findings);

      const result: SecurityScanResult = {
        scanId,
        scanType: 'COMPREHENSIVE',
        startTime,
        endTime,
        findings,
        summary,
      };

      // Store scan results
      await this.storeScanResults(result);

      // Log audit event
      await this.auditService.logSystemEvent(
        AuditEventType.SECURITY_VIOLATION,
        'Security scan completed',
        {
          scanId,
          findingsCount: findings.length,
          criticalFindings: summary.critical,
          highFindings: summary.high,
        },
      );

      this.logger.log(`Security scan ${scanId} completed with ${findings.length} findings`);
      return result;
    } catch (error) {
      this.logger.error(`Security scan ${scanId} failed`, error);
      throw error;
    }
  }

  /**
   * Scan security configuration
   */
  private async scanConfiguration(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // Check HTTPS enforcement
    const httpsEnabled = this.configService.get<boolean>('FORCE_HTTPS', false);
    if (!httpsEnabled) {
      findings.push({
        id: crypto.randomUUID(),
        type: VulnerabilityType.SECURITY_MISCONFIGURATION,
        severity: ScanSeverity.HIGH,
        title: 'HTTPS not enforced',
        description: 'Application does not enforce HTTPS connections',
        location: 'Configuration',
        evidence: { httpsEnabled },
        recommendation: 'Enable FORCE_HTTPS configuration and implement HTTPS redirect middleware',
        discoveredAt: new Date(),
        status: 'OPEN',
      });
    }

    // Check JWT secret strength
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret || jwtSecret.length < 32) {
      findings.push({
        id: crypto.randomUUID(),
        type: VulnerabilityType.WEAK_PASSWORD,
        severity: ScanSeverity.CRITICAL,
        title: 'Weak JWT secret',
        description: 'JWT secret is too short or using default value',
        location: 'JWT Configuration',
        evidence: { secretLength: jwtSecret?.length || 0 },
        recommendation: 'Use a strong, randomly generated JWT secret of at least 32 characters',
        discoveredAt: new Date(),
        status: 'OPEN',
      });
    }

    // Check session configuration
    const sessionSecret = this.configService.get<string>('SESSION_SECRET');
    if (!sessionSecret || sessionSecret === 'your-super-secret-session-key') {
      findings.push({
        id: crypto.randomUUID(),
        type: VulnerabilityType.SECURITY_MISCONFIGURATION,
        severity: ScanSeverity.HIGH,
        title: 'Default session secret',
        description: 'Using default or weak session secret',
        location: 'Session Configuration',
        evidence: { usingDefault: sessionSecret === 'your-super-secret-session-key' },
        recommendation: 'Generate and use a strong, unique session secret',
        discoveredAt: new Date(),
        status: 'OPEN',
      });
    }

    // Check CORS configuration
    const corsOrigins = this.configService.get<string[]>('security.corsOrigins', []);
    if (corsOrigins.includes('*')) {
      findings.push({
        id: crypto.randomUUID(),
        type: VulnerabilityType.SECURITY_MISCONFIGURATION,
        severity: ScanSeverity.MEDIUM,
        title: 'Permissive CORS policy',
        description: 'CORS allows all origins (*)',
        location: 'CORS Configuration',
        evidence: { corsOrigins },
        recommendation: 'Restrict CORS to specific trusted origins',
        discoveredAt: new Date(),
        status: 'OPEN',
      });
    }

    return findings;
  }

  /**
   * Scan authentication mechanisms
   */
  private async scanAuthentication(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // Check for users with weak passwords (this would be done during password changes)
    const weakPasswordUsers = await this.prisma.user.count({
      where: {
        passwordHash: {
          not: null,
        },
        // In a real implementation, you'd check password strength during creation/update
      },
    });

    // Check for inactive sessions
    const oldSessions = await this.prisma.session.count({
      where: {
        expiresAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days old
        },
      },
    });

    if (oldSessions > 0) {
      findings.push({
        id: crypto.randomUUID(),
        type: VulnerabilityType.BROKEN_AUTHENTICATION,
        severity: ScanSeverity.MEDIUM,
        title: 'Stale sessions detected',
        description: `Found ${oldSessions} expired sessions that haven't been cleaned up`,
        location: 'Session Management',
        evidence: { staleSessionCount: oldSessions },
        recommendation: 'Implement automatic cleanup of expired sessions',
        discoveredAt: new Date(),
        status: 'OPEN',
      });
    }

    // Check for accounts without recent activity
    const inactiveUsers = await this.prisma.user.count({
      where: {
        updatedAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days
        },
        isActive: true,
      },
    });

    if (inactiveUsers > 0) {
      findings.push({
        id: crypto.randomUUID(),
        type: VulnerabilityType.BROKEN_AUTHENTICATION,
        severity: ScanSeverity.LOW,
        title: 'Inactive user accounts',
        description: `Found ${inactiveUsers} active accounts with no recent activity`,
        location: 'User Management',
        evidence: { inactiveUserCount: inactiveUsers },
        recommendation: 'Review and deactivate unused accounts',
        discoveredAt: new Date(),
        status: 'OPEN',
      });
    }

    return findings;
  }

  /**
   * Scan data protection measures
   */
  private async scanDataProtection(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // Check encryption configuration
    const encryptionKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    if (!encryptionKey) {
      findings.push({
        id: crypto.randomUUID(),
        type: VulnerabilityType.SENSITIVE_DATA_EXPOSURE,
        severity: ScanSeverity.CRITICAL,
        title: 'Missing encryption configuration',
        description: 'No encryption master key configured for data at rest',
        location: 'Encryption Configuration',
        evidence: { encryptionConfigured: false },
        recommendation: 'Configure ENCRYPTION_MASTER_KEY and KEY_DERIVATION_SALT',
        discoveredAt: new Date(),
        status: 'OPEN',
      });
    }

    // Check for unencrypted sensitive fields (this would require schema analysis)
    // For now, we'll check if sensitive tables exist without encryption
    const sensitiveDataCheck = await this.checkSensitiveDataEncryption();
    findings.push(...sensitiveDataCheck);

    return findings;
  }

  /**
   * Scan input validation
   */
  private async scanInputValidation(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // This would typically involve static code analysis
    // For now, we'll check for common patterns that might indicate vulnerabilities

    // Check if validation pipes are properly configured
    // This is a simplified check - in practice, you'd analyze the actual code
    const validationEnabled = this.configService.get<boolean>('ENABLE_VALIDATION', true);
    if (!validationEnabled) {
      findings.push({
        id: crypto.randomUUID(),
        type: VulnerabilityType.SQL_INJECTION,
        severity: ScanSeverity.HIGH,
        title: 'Input validation disabled',
        description: 'Global input validation is disabled',
        location: 'Application Configuration',
        evidence: { validationEnabled },
        recommendation: 'Enable global validation pipes and ensure all inputs are validated',
        discoveredAt: new Date(),
        status: 'OPEN',
      });
    }

    return findings;
  }

  /**
   * Scan access control mechanisms
   */
  private async scanAccessControl(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // Check for users with excessive permissions
    const adminUsers = await this.prisma.householdMember.count({
      where: {
        role: 'ADMIN',
      },
    });

    const totalUsers = await this.prisma.user.count();
    const adminRatio = totalUsers > 0 ? adminUsers / totalUsers : 0;

    if (adminRatio > 0.1) { // More than 10% admins might be excessive
      findings.push({
        id: crypto.randomUUID(),
        type: VulnerabilityType.BROKEN_AUTHENTICATION,
        severity: ScanSeverity.MEDIUM,
        title: 'Excessive admin privileges',
        description: `${(adminRatio * 100).toFixed(1)}% of users have admin privileges`,
        location: 'Access Control',
        evidence: { adminUsers, totalUsers, adminRatio },
        recommendation: 'Review and reduce admin privileges following principle of least privilege',
        discoveredAt: new Date(),
        status: 'OPEN',
      });
    }

    return findings;
  }

  /**
   * Scan logging and monitoring
   */
  private async scanLogging(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // Check if audit logging is enabled
    const recentAuditLogs = await this.prisma.auditLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (recentAuditLogs === 0) {
      findings.push({
        id: crypto.randomUUID(),
        type: VulnerabilityType.INSUFFICIENT_LOGGING,
        severity: ScanSeverity.MEDIUM,
        title: 'No recent audit logs',
        description: 'No audit logs found in the last 24 hours',
        location: 'Audit System',
        evidence: { recentAuditLogs },
        recommendation: 'Verify audit logging is working correctly',
        discoveredAt: new Date(),
        status: 'OPEN',
      });
    }

    return findings;
  }

  /**
   * Scan for vulnerable dependencies
   */
  private async scanDependencies(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // This would typically integrate with npm audit or similar tools
    // For now, we'll create a placeholder finding
    findings.push({
      id: crypto.randomUUID(),
      type: VulnerabilityType.KNOWN_VULNERABLE_COMPONENTS,
      severity: ScanSeverity.INFO,
      title: 'Dependency scan required',
      description: 'Regular dependency vulnerability scanning should be performed',
      location: 'Dependencies',
      evidence: { scanType: 'manual' },
      recommendation: 'Run npm audit and update vulnerable dependencies regularly',
      discoveredAt: new Date(),
      status: 'OPEN',
    });

    return findings;
  }

  /**
   * Check sensitive data encryption
   */
  private async checkSensitiveDataEncryption(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // Check if sensitive fields are properly encrypted
    // This is a simplified check - in practice, you'd analyze the actual schema
    const encryptionKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    
    if (!encryptionKey) {
      findings.push({
        id: crypto.randomUUID(),
        type: VulnerabilityType.SENSITIVE_DATA_EXPOSURE,
        severity: ScanSeverity.HIGH,
        title: 'Sensitive data not encrypted',
        description: 'Sensitive fields may not be encrypted at rest',
        location: 'Database Schema',
        evidence: { encryptionEnabled: false },
        recommendation: 'Implement field-level encryption for sensitive data',
        discoveredAt: new Date(),
        status: 'OPEN',
      });
    }

    return findings;
  }

  /**
   * Generate scan summary
   */
  private generateSummary(findings: SecurityFinding[]) {
    const summary = {
      total: findings.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    findings.forEach(finding => {
      switch (finding.severity) {
        case ScanSeverity.CRITICAL:
          summary.critical++;
          break;
        case ScanSeverity.HIGH:
          summary.high++;
          break;
        case ScanSeverity.MEDIUM:
          summary.medium++;
          break;
        case ScanSeverity.LOW:
          summary.low++;
          break;
        case ScanSeverity.INFO:
          summary.info++;
          break;
      }
    });

    return summary;
  }

  /**
   * Store scan results
   */
  private async storeScanResults(result: SecurityScanResult): Promise<void> {
    try {
      await this.prisma.securityScan.create({
        data: {
          scanId: result.scanId,
          scanType: result.scanType,
          startTime: result.startTime,
          endTime: result.endTime,
          findings: result.findings,
          summary: result.summary,
        },
      });
    } catch (error) {
      this.logger.error('Failed to store scan results', error);
    }
  }

  /**
   * Get scan history
   */
  async getScanHistory(limit: number = 10): Promise<SecurityScanResult[]> {
    const scans = await this.prisma.securityScan.findMany({
      orderBy: { startTime: 'desc' },
      take: limit,
    });

    return scans.map(scan => ({
      scanId: scan.scanId,
      scanType: scan.scanType,
      startTime: scan.startTime,
      endTime: scan.endTime,
      findings: scan.findings as SecurityFinding[],
      summary: scan.summary as any,
    }));
  }

  /**
   * Get open findings
   */
  async getOpenFindings(): Promise<SecurityFinding[]> {
    const latestScan = await this.prisma.securityScan.findFirst({
      orderBy: { startTime: 'desc' },
    });

    if (!latestScan) {
      return [];
    }

    const findings = latestScan.findings as SecurityFinding[];
    return findings.filter(finding => finding.status === 'OPEN');
  }

  /**
   * Update finding status
   */
  async updateFindingStatus(
    findingId: string,
    status: 'ACKNOWLEDGED' | 'FIXED' | 'FALSE_POSITIVE',
    notes?: string,
  ): Promise<void> {
    // This would update the finding status in the latest scan
    // Implementation would depend on how you want to handle finding lifecycle
    await this.auditService.logSystemEvent(
      AuditEventType.SECURITY_VIOLATION,
      'Security finding status updated',
      {
        findingId,
        status,
        notes,
      },
    );
  }
}
