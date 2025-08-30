import { Injectable, Logger } from '@nestjs/common';

export interface FallbackOptions<T> {
  name?: string;
  fallbackValue?: T;
  fallbackFunction?: () => Promise<T> | T;
  gracefulDegradation?: boolean;
  logFailures?: boolean;
}

export interface FallbackResult<T> {
  value: T;
  usedFallback: boolean;
  primaryError?: Error;
  fallbackError?: Error;
  degraded?: boolean;
}

@Injectable()
export class FallbackService {
  private readonly logger = new Logger(FallbackService.name);

  /**
   * Execute primary operation with fallback support
   */
  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    options: FallbackOptions<T> = {},
  ): Promise<FallbackResult<T>> {
    const {
      name = 'unnamed-operation',
      fallbackValue,
      fallbackFunction,
      gracefulDegradation = true,
      logFailures = true,
    } = options;

    try {
      const value = await primaryOperation();
      return {
        value,
        usedFallback: false,
      };
    } catch (primaryError) {
      if (logFailures) {
        this.logger.warn(
          `Primary operation '${name}' failed: ${primaryError.message}`,
          primaryError.stack,
        );
      }

      // Try fallback function first
      if (fallbackFunction) {
        try {
          const fallbackResult = await Promise.resolve(fallbackFunction());
          
          if (logFailures) {
            this.logger.log(`Fallback function succeeded for operation '${name}'`);
          }

          return {
            value: fallbackResult,
            usedFallback: true,
            primaryError,
            degraded: gracefulDegradation,
          };
        } catch (fallbackError) {
          if (logFailures) {
            this.logger.error(
              `Fallback function failed for operation '${name}': ${fallbackError.message}`,
              fallbackError.stack,
            );
          }

          // If fallback function fails, try fallback value
          if (fallbackValue !== undefined) {
            return {
              value: fallbackValue,
              usedFallback: true,
              primaryError,
              fallbackError,
              degraded: gracefulDegradation,
            };
          }

          // Both primary and fallback failed
          throw new Error(
            `Both primary operation and fallback failed for '${name}'. ` +
            `Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`
          );
        }
      }

      // Try fallback value
      if (fallbackValue !== undefined) {
        if (logFailures) {
          this.logger.log(`Using fallback value for operation '${name}'`);
        }

        return {
          value: fallbackValue,
          usedFallback: true,
          primaryError,
          degraded: gracefulDegradation,
        };
      }

      // No fallback available
      throw primaryError;
    }
  }

  /**
   * Create a fallback-enabled version of a function
   */
  createFallbackFunction<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: FallbackOptions<R> = {},
  ): (...args: T) => Promise<FallbackResult<R>> {
    return async (...args: T): Promise<FallbackResult<R>> => {
      return this.executeWithFallback(() => fn(...args), options);
    };
  }

  /**
   * Execute multiple operations with cascading fallbacks
   */
  async executeWithCascadingFallbacks<T>(
    operations: Array<() => Promise<T>>,
    operationNames: string[] = [],
  ): Promise<FallbackResult<T>> {
    if (operations.length === 0) {
      throw new Error('No operations provided for cascading fallbacks');
    }

    const errors: Error[] = [];
    
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      const operationName = operationNames[i] || `operation-${i}`;
      
      try {
        const value = await operation();
        
        if (i > 0) {
          this.logger.log(
            `Cascading fallback succeeded with '${operationName}' (attempt ${i + 1}/${operations.length})`
          );
        }

        return {
          value,
          usedFallback: i > 0,
          degraded: i > 0,
        };
      } catch (error) {
        errors.push(error);
        
        this.logger.warn(
          `Cascading fallback operation '${operationName}' failed (attempt ${i + 1}/${operations.length}): ${error.message}`
        );
      }
    }

    // All operations failed
    const combinedError = new Error(
      `All cascading fallback operations failed: ${errors.map(e => e.message).join(', ')}`
    );
    
    this.logger.error('All cascading fallback operations failed', combinedError.stack);
    throw combinedError;
  }

  /**
   * Create graceful degradation wrapper
   */
  createGracefulDegradation<T>(
    primaryService: T,
    degradedService: Partial<T>,
    healthCheck: () => Promise<boolean>,
  ): T {
    const proxy = new Proxy(primaryService as any, {
      get: (target, prop) => {
        const originalMethod = target[prop];
        
        if (typeof originalMethod === 'function') {
          return async (...args: any[]) => {
            try {
              const isHealthy = await healthCheck();
              
              if (!isHealthy && degradedService[prop as keyof T]) {
                this.logger.warn(`Using degraded service for method '${String(prop)}'`);
                return (degradedService[prop as keyof T] as any)(...args);
              }
              
              return originalMethod.apply(target, args);
            } catch (error) {
              if (degradedService[prop as keyof T]) {
                this.logger.warn(
                  `Primary service method '${String(prop)}' failed, using degraded service: ${error.message}`
                );
                return (degradedService[prop as keyof T] as any)(...args);
              }
              throw error;
            }
          };
        }
        
        return originalMethod;
      },
    });

    return proxy;
  }
}
