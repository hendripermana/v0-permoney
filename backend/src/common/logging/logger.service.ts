import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

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
  private readonly logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logLevel = this.configService.get('LOG_LEVEL', 'info');
    const environment = this.configService.get('NODE_ENV', 'development');
    
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
          winston.format.colorize({ all: environment === 'development' })
        ),
      }),
    ];

    // Add file transport for production
    if (environment === 'production') {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          ),
        })
      );

      // Add Elasticsearch transport if configured
      const elasticsearchUrl = this.configService.get('ELASTICSEARCH_URL');
      if (elasticsearchUrl) {
        transports.push(
          new ElasticsearchTransport({
            level: 'info',
            clientOpts: { node: elasticsearchUrl },
            index: 'permoney-logs',
            indexTemplate: {
              name: 'permoney-logs-template',
              body: {
                index_patterns: ['permoney-logs-*'],
                settings: {
                  number_of_shards: 1,
                  number_of_replicas: 0,
                },
                mappings: {
                  properties: {
                    '@timestamp': { type: 'date' },
                    level: { type: 'keyword' },
                    message: { type: 'text' },
                    userId: { type: 'keyword' },
                    householdId: { type: 'keyword' },
                    requestId: { type: 'keyword' },
                    operation: { type: 'keyword' },
                    resource: { type: 'keyword' },
                    duration: { type: 'integer' },
                    statusCode: { type: 'integer' },
                    stack: { type: 'text' },
                  },
                },
              },
            },
          })
        );
      }
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'permoney-backend',
        environment,
        version: process.env.npm_package_version || '1.0.0',
      },
      transports,
    });
  }

  log(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(message, { ...context, stack: trace });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message, context);
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
