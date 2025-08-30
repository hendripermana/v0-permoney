import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
  name?: string;
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failures: number;
  successes: number;
  requests: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttempt?: Date;
}

@Injectable()
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);
  private readonly circuits = new Map<string, CircuitBreakerInstance>();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    options: CircuitBreakerOptions = {},
  ): Promise<T> {
    const circuitName = options.name || 'default';
    const circuit = this.getOrCreateCircuit(circuitName, options);

    return circuit.execute(operation);
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(circuitName: string = 'default'): CircuitBreakerStats | null {
    const circuit = this.circuits.get(circuitName);
    return circuit ? circuit.getStats() : null;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, circuit] of this.circuits.entries()) {
      stats[name] = circuit.getStats();
    }
    
    return stats;
  }

  /**
   * Manually reset a circuit breaker
   */
  reset(circuitName: string = 'default'): void {
    const circuit = this.circuits.get(circuitName);
    if (circuit) {
      circuit.reset();
      this.logger.log(`Circuit breaker '${circuitName}' manually reset`);
    }
  }

  /**
   * Get or create a circuit breaker instance
   */
  private getOrCreateCircuit(name: string, options: CircuitBreakerOptions): CircuitBreakerInstance {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, new CircuitBreakerInstance(name, options, this.configService, this.logger));
    }
    return this.circuits.get(name)!;
  }
}

class CircuitBreakerInstance {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures = 0;
  private successes = 0;
  private requests = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttempt?: Date;

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeout: number;
  private readonly resetTimeout: number;
  private readonly monitoringPeriod: number;

  constructor(
    private readonly name: string,
    options: CircuitBreakerOptions,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.failureThreshold = options.failureThreshold || 
      this.configService.get('CIRCUIT_BREAKER_FAILURE_THRESHOLD', 5);
    this.successThreshold = options.successThreshold || 
      this.configService.get('CIRCUIT_BREAKER_SUCCESS_THRESHOLD', 3);
    this.timeout = options.timeout || 
      this.configService.get('CIRCUIT_BREAKER_TIMEOUT', 5000);
    this.resetTimeout = options.resetTimeout || 
      this.configService.get('CIRCUIT_BREAKER_RESET_TIMEOUT', 60000);
    this.monitoringPeriod = options.monitoringPeriod || 
      this.configService.get('CIRCUIT_BREAKER_MONITORING_PERIOD', 60000);
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.requests++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitBreakerState.OPEN && this.shouldAttemptReset()) {
      this.state = CircuitBreakerState.HALF_OPEN;
      this.logger.log(`Circuit breaker '${this.name}' transitioned to HALF_OPEN`);
    }

    // Reject immediately if circuit is OPEN
    if (this.state === CircuitBreakerState.OPEN) {
      const error = new Error(`Circuit breaker '${this.name}' is OPEN`);
      error.name = 'CircuitBreakerOpenError';
      throw error;
    }

    try {
      // Execute operation with timeout
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${this.timeout}ms`));
      }, this.timeout);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successes >= this.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.logger.log(`Circuit breaker '${this.name}' transitioned to CLOSED after ${this.successThreshold} successes`);
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success in CLOSED state
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitBreakerState.CLOSED || this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.failures >= this.failureThreshold) {
        this.state = CircuitBreakerState.OPEN;
        this.nextAttempt = new Date(Date.now() + this.resetTimeout);
        this.successes = 0;
        
        this.logger.warn(
          `Circuit breaker '${this.name}' transitioned to OPEN after ${this.failures} failures. ` +
          `Next attempt at ${this.nextAttempt.toISOString()}`
        );
      }
    }
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttempt ? new Date() >= this.nextAttempt : false;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      requests: this.requests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttempt: this.nextAttempt,
    };
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.requests = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttempt = undefined;
  }
}
