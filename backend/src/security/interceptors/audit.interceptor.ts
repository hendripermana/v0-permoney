import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService, AuditEventType, AuditSeverity } from '../services/audit.service';

export const AUDIT_CONFIG = 'audit_config';

export interface AuditConfig {
  eventType: AuditEventType;
  severity?: AuditSeverity;
  resourceType?: string;
  action?: string;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
  sensitiveFields?: string[];
  customExtractor?: (req: Request, res: Response, data?: any) => Record<string, any>;
}

export const Audit = (config: AuditConfig) =>
  Reflector.createDecorator<AuditConfig>({ key: AUDIT_CONFIG, value: config });

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditConfig = this.reflector.get<AuditConfig>(
      AUDIT_CONFIG,
      context.getHandler(),
    );

    if (!auditConfig) {
      return next.handle(); // No audit configuration
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const user = (request as any).user;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.logSuccessfulOperation(
            auditConfig,
            request,
            response,
            data,
            user,
            startTime,
          );
        } catch (error) {
          this.logger.error('Failed to log successful audit event', error);
        }
      }),
      catchError(async (error) => {
        try {
          await this.logFailedOperation(
            auditConfig,
            request,
            response,
            error,
            user,
            startTime,
          );
        } catch (auditError) {
          this.logger.error('Failed to log failed audit event', auditError);
        }
        throw error;
      }),
    );
  }

  private async logSuccessfulOperation(
    config: AuditConfig,
    request: Request,
    response: Response,
    data: any,
    user: any,
    startTime: number,
  ): Promise<void> {
    const details = this.extractAuditDetails(config, request, response, data, true);
    const elapsedTime = Date.now() - startTime;

    await this.auditService.logEvent({
      eventType: config.eventType,
      severity: config.severity || AuditSeverity.LOW,
      userId: user?.id,
      householdId: user?.householdId,
      resourceType: config.resourceType || this.extractResourceType(request),
      resourceId: this.extractResourceId(request, data),
      action: config.action || this.generateAction(request),
      details: {
        ...details,
        elapsedTime,
        statusCode: response.statusCode,
      },
      success: true,
    });
  }

  private async logFailedOperation(
    config: AuditConfig,
    request: Request,
    response: Response,
    error: any,
    user: any,
    startTime: number,
  ): Promise<void> {
    const details = this.extractAuditDetails(config, request, response, null, false);
    const elapsedTime = Date.now() - startTime;

    await this.auditService.logEvent({
      eventType: config.eventType,
      severity: this.determineSeverityFromError(error, config.severity),
      userId: user?.id,
      householdId: user?.householdId,
      resourceType: config.resourceType || this.extractResourceType(request),
      resourceId: this.extractResourceId(request, null),
      action: config.action || this.generateAction(request),
      details: {
        ...details,
        elapsedTime,
        errorType: error.constructor.name,
        errorMessage: error.message,
        statusCode: error.status || 500,
      },
      success: false,
      errorMessage: error.message,
    });
  }

  private extractAuditDetails(
    config: AuditConfig,
    request: Request,
    response: Response,
    data: any,
    success: boolean,
  ): Record<string, any> {
    const details: Record<string, any> = {
      method: request.method,
      path: request.path,
      query: request.query,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };

    // Include request body if configured
    if (config.includeRequestBody && request.body) {
      details.requestBody = this.sanitizeData(request.body, config.sensitiveFields);
    }

    // Include response body if configured and operation was successful
    if (config.includeResponseBody && success && data) {
      details.responseBody = this.sanitizeData(data, config.sensitiveFields);
    }

    // Use custom extractor if provided
    if (config.customExtractor) {
      const customDetails = config.customExtractor(request, response, data);
      Object.assign(details, customDetails);
    }

    return details;
  }

  private extractResourceType(request: Request): string {
    // Extract resource type from URL path
    const pathSegments = request.path.split('/').filter(segment => segment);
    if (pathSegments.length > 1) {
      return pathSegments[1]; // Assuming /api/resourceType/...
    }
    return 'unknown';
  }

  private extractResourceId(request: Request, data: any): string | undefined {
    // Try to extract resource ID from URL parameters
    const pathSegments = request.path.split('/').filter(segment => segment);
    
    // Look for UUID pattern in path
    for (const segment of pathSegments) {
      if (this.isValidUUID(segment)) {
        return segment;
      }
    }

    // Try to extract from request parameters
    if (request.params && request.params.id) {
      return request.params.id;
    }

    // Try to extract from response data
    if (data && data.id) {
      return data.id;
    }

    return undefined;
  }

  private generateAction(request: Request): string {
    const method = request.method.toLowerCase();
    const resourceType = this.extractResourceType(request);

    switch (method) {
      case 'get':
        return `View ${resourceType}`;
      case 'post':
        return `Create ${resourceType}`;
      case 'put':
      case 'patch':
        return `Update ${resourceType}`;
      case 'delete':
        return `Delete ${resourceType}`;
      default:
        return `${method.toUpperCase()} ${resourceType}`;
    }
  }

  private determineSeverityFromError(error: any, configSeverity?: AuditSeverity): AuditSeverity {
    if (configSeverity) {
      return configSeverity;
    }

    const status = error.status || 500;

    if (status >= 500) {
      return AuditSeverity.HIGH;
    } else if (status >= 400) {
      return AuditSeverity.MEDIUM;
    } else {
      return AuditSeverity.LOW;
    }
  }

  private sanitizeData(data: any, sensitiveFields: string[] = []): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const defaultSensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'privateKey',
      'ssn',
      'creditCard',
      'bankAccount',
    ];

    const allSensitiveFields = [...defaultSensitiveFields, ...sensitiveFields];
    const sanitized = { ...data };

    for (const field of allSensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeData(value, sensitiveFields);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'object' ? this.sanitizeData(item, sensitiveFields) : item
        );
      }
    }

    return sanitized;
  }

  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
