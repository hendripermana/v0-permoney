import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { ValidationException, BusinessLogicException } from '../exceptions/custom.exceptions';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  details?: any;
  requestId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);
    
    // Log the error with appropriate level
    this.logError(exception, errorResponse, request);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const requestId = request.headers['x-request-id'] as string;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | undefined;
    let details: any;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error;
        details = (exceptionResponse as any).details;
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      statusCode = this.mapPrismaErrorToHttpStatus(exception.code);
      message = this.mapPrismaErrorToMessage(exception);
      error = 'Database Error';
      details = {
        code: exception.code,
        meta: exception.meta,
      };
    } else if (exception instanceof PrismaClientValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Database validation error';
      error = 'Validation Error';
      details = {
        validationError: exception.message,
      };
    } else if (exception instanceof ValidationException) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = exception.message;
      error = 'Validation Error';
      details = (exception.getResponse() as any).errors;
    } else if (exception instanceof BusinessLogicException) {
      statusCode = exception.getStatus();
      message = exception.message;
      error = 'Business Logic Error';
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    return {
      statusCode,
      timestamp,
      path,
      method,
      message,
      error,
      details,
      requestId,
    };
  }

  private mapPrismaErrorToHttpStatus(code: string): HttpStatus {
    switch (code) {
      case 'P2002': // Unique constraint violation
        return HttpStatus.CONFLICT;
      case 'P2025': // Record not found
        return HttpStatus.NOT_FOUND;
      case 'P2003': // Foreign key constraint violation
        return HttpStatus.BAD_REQUEST;
      case 'P2004': // Constraint violation
        return HttpStatus.BAD_REQUEST;
      case 'P2014': // Invalid ID
        return HttpStatus.BAD_REQUEST;
      case 'P2021': // Table does not exist
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case 'P2022': // Column does not exist
        return HttpStatus.INTERNAL_SERVER_ERROR;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private mapPrismaErrorToMessage(exception: PrismaClientKnownRequestError): string {
    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.target as string[];
        return `Duplicate entry for ${target?.join(', ') || 'unique field'}`;
      }
      case 'P2025':
        return 'Record not found';
      case 'P2003':
        return 'Foreign key constraint violation';
      case 'P2004':
        return 'Constraint violation';
      case 'P2014':
        return 'Invalid ID provided';
      case 'P2021':
        return 'Database table does not exist';
      case 'P2022':
        return 'Database column does not exist';
      default:
        return 'Database operation failed';
    }
  }

  private logError(exception: unknown, errorResponse: ErrorResponse, request: Request) {
    const { statusCode, message, path, method, requestId } = errorResponse;
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const ip = request.ip || 'Unknown';

    const logContext = {
      statusCode,
      path,
      method,
      requestId,
      userAgent,
      ip,
      userId: (request as any).user?.id,
      householdId: (request as any).user?.householdId,
    };

    if (statusCode >= 500) {
      this.logger.error(
        `${method} ${path} - ${message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        JSON.stringify(logContext)
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `${method} ${path} - ${message}`,
        JSON.stringify(logContext)
      );
    } else {
      this.logger.log(
        `${method} ${path} - ${message}`,
        JSON.stringify(logContext)
      );
    }
  }
}
