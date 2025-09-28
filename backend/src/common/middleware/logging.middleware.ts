import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { StructuredLoggerService } from '../logging/logger.service';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithContext extends Request {
  requestId: string;
  startTime: number;
  user?: { id?: string; householdId?: string };
}

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: StructuredLoggerService) {}

  use(req: RequestWithContext, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = uuidv4();
    
    // Add request context
    req.requestId = requestId;
    req.startTime = startTime;

    // Log incoming request
    this.logger.log('Incoming request', {
      requestId,
      operation: 'http_request_start',
      resource: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      userId: req.user?.id,
      householdId: req.user?.householdId,
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime;
      
      // Log completed request
      (this as any).logger.logApiRequest(
        req.method,
        req.originalUrl,
        res.statusCode,
        duration,
        {
          requestId,
          userId: (req as any).user?.id,
          householdId: (req as any).user?.householdId,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          responseSize: res.get('Content-Length'),
        }
      );

      // Log slow requests
      if (duration > 1000) {
        (this as any).logger.warn('Slow request detected', {
          requestId,
          operation: 'slow_request',
          resource: req.originalUrl,
          method: req.method,
          duration,
          statusCode: res.statusCode,
        });
      }

      // Log error responses
      if (res.statusCode >= 400) {
        (this as any).logger.error('Request failed', undefined, {
          requestId,
          operation: 'http_request_error',
          resource: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          duration,
        });
      }

      originalEnd.call(res, chunk as any, encoding as any);
    }.bind({ logger: this.logger });

    next();
  }
}
