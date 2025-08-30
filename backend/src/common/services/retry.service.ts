import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBase?: number;
  jitter?: boolean;
  retryCondition?: (error: any) => boolean;
}

export interface RetryResult<T> {
  result?: T;
  success: boolean;
  attempts: number;
  totalTime: number;
  lastError?: Error;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Execute a function with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<RetryResult<T>> {
    const {
      maxRetries = this.configService.get('RETRY_MAX_ATTEMPTS', 3),
      baseDelay = this.configService.get('RETRY_BASE_DELAY', 1000),
      maxDelay = this.configService.get('RETRY_MAX_DELAY', 30000),
      exponentialBase = 2,
      jitter = true,
      retryCondition = this.defaultRetryCondition,
    } = options;

    const startTime = Date.now();
    let lastError: Error;
    let attempts = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      attempts = attempt + 1;

      try {
        this.logger.debug(`Executing operation, attempt ${attempts}/${maxRetries + 1}`);
        
        const result = await operation();
        
        const totalTime = Date.now() - startTime;
        this.logger.debug(`Operation succeeded on attempt ${attempts}, total time: ${totalTime}ms`);
        
        return {
          result,
          success: true,
          attempts,
          totalTime,
        };
      } catch (error) {
        lastError = error;
        
        this.logger.warn(
          `Operation failed on attempt ${attempts}/${maxRetries + 1}: ${error.message}`,
          error.stack,
        );

        // Check if we should retry this error
        if (!retryCondition(error)) {
          this.logger.debug('Error is not retryable, stopping retry attempts');
          break;
        }

        // Don't delay after the last attempt
        if (attempt < maxRetries) {
          const delay = this.calculateDelay(attempt, baseDelay, maxDelay, exponentialBase, jitter);
          this.logger.debug(`Waiting ${delay}ms before next attempt`);
          await this.sleep(delay);
        }
      }
    }

    const totalTime = Date.now() - startTime;
    this.logger.error(
      `Operation failed after ${attempts} attempts, total time: ${totalTime}ms`,
      lastError.stack,
    );

    return {
      success: false,
      attempts,
      totalTime,
      lastError,
    };
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    exponentialBase: number,
    jitter: boolean,
  ): number {
    // Calculate exponential backoff
    let delay = baseDelay * Math.pow(exponentialBase, attempt);
    
    // Cap at maximum delay
    delay = Math.min(delay, maxDelay);
    
    // Add jitter to prevent thundering herd
    if (jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      const randomJitter = (Math.random() - 0.5) * 2 * jitterAmount;
      delay += randomJitter;
    }
    
    return Math.max(0, Math.round(delay));
  }

  /**
   * Default retry condition - retry on network errors and 5xx status codes
   */
  private defaultRetryCondition(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || 
        error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND') {
      return true;
    }

    // HTTP 5xx errors
    if (error.response && error.response.status >= 500) {
      return true;
    }

    // Database connection errors
    if (error.message?.includes('connection') || 
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNRESET')) {
      return true;
    }

    // Redis errors
    if (error.message?.includes('Redis') || 
        error.message?.includes('REDIS')) {
      return true;
    }

    return false;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retryable version of a function
   */
  createRetryableFunction<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: RetryOptions = {},
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const result = await this.executeWithRetry(() => fn(...args), options);
      
      if (result.success) {
        return result.result!;
      } else {
        throw result.lastError || new Error('Operation failed after retries');
      }
    };
  }
}
