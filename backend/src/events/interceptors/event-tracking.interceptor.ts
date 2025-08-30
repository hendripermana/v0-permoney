import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError } from 'rxjs';
import { EventsService } from '../events.service';
import { TRACK_EVENT_KEY, TrackEventOptions } from '../decorators/track-event.decorator';

@Injectable()
export class EventTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EventTrackingInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly eventsService: EventsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const trackEventOptions = this.reflector.get<TrackEventOptions>(
      TRACK_EVENT_KEY,
      context.getHandler(),
    );

    if (!trackEventOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // No user context, skip tracking
      return next.handle();
    }

    const args = context.getArgs();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (result) => {
        try {
          await this.trackSuccessEvent(
            trackEventOptions,
            user,
            request,
            args,
            result,
            Date.now() - startTime,
          );
        } catch (error) {
          this.logger.error('Failed to track success event:', error);
        }
      }),
      catchError(async (error) => {
        if (trackEventOptions.trackOnError) {
          try {
            await this.trackErrorEvent(
              trackEventOptions,
              user,
              request,
              args,
              error,
              Date.now() - startTime,
            );
          } catch (trackingError) {
            this.logger.error('Failed to track error event:', trackingError);
          }
        }
        throw error;
      }),
    );
  }

  private async trackSuccessEvent(
    options: TrackEventOptions,
    user: any,
    request: any,
    args: any[],
    result: any,
    duration: number,
  ) {
    const eventData: Record<string, any> = {
      duration,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ...this.extractEventData(options, args, result),
    };

    await this.eventsService.trackEvent({
      userId: user.id,
      householdId: user.householdId || this.extractHouseholdId(args, result),
      eventType: options.eventType,
      eventData,
      resourceType: options.resourceType,
      resourceId: this.extractResourceId(options, args, result),
      sessionId: this.extractSessionId(request),
      ipAddress: this.extractIpAddress(request),
      userAgent: request.headers['user-agent'],
    });
  }

  private async trackErrorEvent(
    options: TrackEventOptions,
    user: any,
    request: any,
    args: any[],
    error: any,
    duration: number,
  ) {
    const eventData: Record<string, any> = {
      duration,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      error: {
        message: error.message,
        name: error.name,
        status: error.status,
      },
      ...this.extractEventData(options, args, undefined),
    };

    await this.eventsService.trackEvent({
      userId: user.id,
      householdId: user.householdId || this.extractHouseholdId(args, undefined),
      eventType: 'ERROR_OCCURRED',
      eventData,
      resourceType: options.resourceType,
      resourceId: this.extractResourceId(options, args, undefined),
      sessionId: this.extractSessionId(request),
      ipAddress: this.extractIpAddress(request),
      userAgent: request.headers['user-agent'],
    });
  }

  private extractResourceId(
    options: TrackEventOptions,
    args: any[],
    result?: any,
  ): string | undefined {
    if (options.extractResourceId) {
      return options.extractResourceId(args, result);
    }

    // Try to extract from common patterns
    const request = args[0];
    if (request?.params?.id) {
      return request.params.id;
    }

    if (result?.id) {
      return result.id;
    }

    return undefined;
  }

  private extractEventData(
    options: TrackEventOptions,
    args: any[],
    result?: any,
  ): Record<string, any> {
    if (options.extractEventData) {
      return options.extractEventData(args, result);
    }

    const eventData: Record<string, any> = {};

    // Extract common data patterns
    const request = args[0];
    const body = args[1];

    if (body) {
      // Sanitize sensitive data
      const sanitizedBody = this.sanitizeData(body);
      eventData.requestData = sanitizedBody;
    }

    if (result) {
      // Include result metadata (not full result to avoid large payloads)
      if (typeof result === 'object' && result.id) {
        eventData.resultId = result.id;
      }
      if (Array.isArray(result)) {
        eventData.resultCount = result.length;
      }
    }

    return eventData;
  }

  private extractHouseholdId(args: any[], result?: any): string | undefined {
    // Try to extract household ID from various sources
    const request = args[0];
    const body = args[1];

    if (request?.params?.householdId) {
      return request.params.householdId;
    }

    if (body?.householdId) {
      return body.householdId;
    }

    if (result?.householdId) {
      return result.householdId;
    }

    return undefined;
  }

  private extractSessionId(request: any): string | undefined {
    // Extract session ID from various sources
    return request.sessionID || request.headers['x-session-id'] || undefined;
  }

  private extractIpAddress(request: any): string | undefined {
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip']
    );
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
    ];

    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      }
    }

    return sanitized;
  }
}
