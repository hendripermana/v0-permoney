import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    // Increment in-flight requests
    this.metricsService.incrementHttpRequestsInFlight();

    // Override res.end to record metrics
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime;
      const route = req.route?.path || req.path;
      
      // Record HTTP request metrics
      this.metricsService.recordHttpRequest(
        req.method,
        route,
        res.statusCode,
        duration
      );

      // Decrement in-flight requests
      this.metricsService.decrementHttpRequestsInFlight();

      // Record errors if status code >= 400
      if (res.statusCode >= 400) {
        const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
        const severity = res.statusCode >= 500 ? 'high' : 'medium';
        this.metricsService.recordError(errorType, severity);
      }

      originalEnd.call(this, chunk, encoding);
    }.bind(this);

    next();
  }
}
