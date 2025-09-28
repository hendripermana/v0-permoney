import { Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LogContext {
  userId?: string;
  householdId?: string;
  requestId?: string;
  sessionId?: string;
  operation?: string;
  resource?: string;
  duration?: number;
  statusCode?: number;
  userAgent?: string;
  ipAddress?: string;
  [key: string]: any;
}

@Injectable()
export class StructuredLoggerService implements LoggerService {
  private readonly logger = new Logger('StructuredLogger');

  constructor(private configService: ConfigService) {
    // Keep reference for potential future enrichment
  }

  log(message: string, context?: LogContext) {
    this.logger.log(message + (context ? ` ${JSON.stringify(context)}` : ''));
  }

  error(message: string, trace?: string, context?: LogContext) {
    const payload = context ? `${message} ${JSON.stringify(context)}` : message;
    this.logger.error(payload + (trace ? `\n${trace}` : ''));
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message + (context ? ` ${JSON.stringify(context)}` : ''));
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message + (context ? ` ${JSON.stringify(context)}` : ''));
  }

  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message + (context ? ` ${JSON.stringify(context)}` : ''));
  }

  // Structured logging methods for specific use cases
  logUserAction(
    userId: string,
    householdId: string,
    action: string,
    resource: string,
    context?: Partial<LogContext>
  ) {
    this.log(`User action: ${action}`, {
      userId,
      householdId,
      operation: action,
      resource,
      ...context,
    });
  }

  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Partial<LogContext>
  ) {
    this.log(`API Request: ${method} ${url}`, {
      operation: 'api_request',
      resource: url,
      statusCode,
      duration,
      ...context,
    });
  }

  logDatabaseQuery(
    query: string,
    duration: number,
    context?: Partial<LogContext>
  ) {
    this.log(`Database query executed`, {
      operation: 'database_query',
      resource: 'database',
      duration,
      query: query.substring(0, 200), // Truncate long queries
      ...context,
    });
  }

  logBusinessEvent(
    event: string,
    data: Record<string, any>,
    context?: Partial<LogContext>
  ) {
    this.log(`Business event: ${event}`, {
      operation: 'business_event',
      resource: event,
      eventData: data,
      ...context,
    });
  }

  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: Partial<LogContext>
  ) {
    this.warn(`Security event: ${event}`, {
      operation: 'security_event',
      resource: 'security',
      severity,
      ...context,
    });
  }

  logPerformanceMetric(
    metric: string,
    value: number,
    unit: string,
    context?: Partial<LogContext>
  ) {
    this.log(`Performance metric: ${metric}`, {
      operation: 'performance_metric',
      resource: 'performance',
      metric,
      value,
      unit,
      ...context,
    });
  }
}
