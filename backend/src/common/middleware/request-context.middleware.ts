import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../services/request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Set request ID from header or generate new one
    const requestId = (req.headers['x-request-id'] as string) || this.requestContext.getRequestId();
    this.requestContext.setRequestId(requestId);

    // Add request ID to response headers
    res.setHeader('x-request-id', requestId);

    // Set user context if available
    if ((req as any).user) {
      this.requestContext.setUserId((req as any).user.id);
      if ((req as any).user.householdId) {
        this.requestContext.setHouseholdId((req as any).user.householdId);
      }
    }

    // Add request metadata
    this.requestContext.setMetadata('method', req.method);
    this.requestContext.setMetadata('url', req.url);
    this.requestContext.setMetadata('userAgent', req.headers['user-agent']);
    this.requestContext.setMetadata('ip', req.ip);

    next();
  }
}
