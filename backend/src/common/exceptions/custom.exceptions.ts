import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessLogicException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, statusCode);
    this.name = 'BusinessLogicException';
  }
}

export class ValidationException extends HttpException {
  constructor(message: string, errors?: any[]) {
    super({
      message,
      errors,
      statusCode: HttpStatus.BAD_REQUEST,
    }, HttpStatus.BAD_REQUEST);
    this.name = 'ValidationException';
  }
}

export class PermissionDeniedException extends HttpException {
  constructor(resource: string, action: string) {
    super(`Permission denied for ${action} on ${resource}`, HttpStatus.FORBIDDEN);
    this.name = 'PermissionDeniedException';
  }
}

export class InsufficientFundsException extends BusinessLogicException {
  constructor(accountId: string, requestedAmount: number, availableAmount: number) {
    super(
      `Insufficient funds in account ${accountId}. Requested: ${requestedAmount}, Available: ${availableAmount}`,
      HttpStatus.BAD_REQUEST
    );
    this.name = 'InsufficientFundsException';
  }
}

export class InvalidCurrencyException extends BusinessLogicException {
  constructor(currency: string) {
    super(`Invalid or unsupported currency: ${currency}`, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidCurrencyException';
  }
}

export class AccountingIntegrityException extends BusinessLogicException {
  constructor(message: string) {
    super(`Accounting integrity error: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'AccountingIntegrityException';
  }
}

export class ExternalServiceException extends HttpException {
  constructor(service: string, message: string) {
    super(`External service error (${service}): ${message}`, HttpStatus.SERVICE_UNAVAILABLE);
    this.name = 'ExternalServiceException';
  }
}

export class RateLimitException extends HttpException {
  constructor(limit: number, windowSeconds: number) {
    super(
      `Rate limit exceeded. Maximum ${limit} requests per ${windowSeconds} seconds`,
      HttpStatus.TOO_MANY_REQUESTS
    );
    this.name = 'RateLimitException';
  }
}

export class CacheException extends HttpException {
  constructor(operation: string, key: string) {
    super(`Cache operation failed: ${operation} for key ${key}`, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'CacheException';
  }
}

export class DatabaseException extends HttpException {
  constructor(operation: string, details?: string) {
    super(
      `Database operation failed: ${operation}${details ? ` - ${details}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    this.name = 'DatabaseException';
  }
}
