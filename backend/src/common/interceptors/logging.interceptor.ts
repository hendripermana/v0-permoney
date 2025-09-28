import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const elapsedTime = Date.now() - startTime;
        const { statusCode } = response;
        const contentLength = response.get('content-length') || 0;

        this.logger.log(
          `${method} ${url} ${statusCode} ${contentLength} - ${elapsedTime}ms`,
          {
            method,
            url,
            statusCode,
            contentLength,
            elapsedTime,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
          }
        );
      }),
      catchError((error) => {
        const elapsedTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.logger.error(
          `${method} ${url} ${statusCode} - ${elapsedTime}ms - ${error?.message || 'Unknown error'}`,
          {
            method,
            url,
            statusCode,
            elapsedTime,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
            error: error?.message || String(error),
            stack: error?.stack,
          }
        );

        throw error;
      })
    );
  }
}
