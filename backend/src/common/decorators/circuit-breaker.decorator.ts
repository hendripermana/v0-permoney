import { SetMetadata } from '@nestjs/common';
import { CircuitBreakerOptions } from '../patterns/circuit-breaker';

export const CIRCUIT_BREAKER_METADATA_KEY = 'circuit_breaker_options';

/**
 * Decorator to add circuit breaker protection to methods
 */
export function CircuitBreakerProtection(options: CircuitBreakerOptions = {}) {
  return SetMetadata(CIRCUIT_BREAKER_METADATA_KEY, options);
}

/**
 * Predefined circuit breaker configurations for common scenarios
 */
export const CircuitBreakerConfigs = {
  // Circuit breaker states
  CLOSED: 'CLOSED',
  OPEN: 'OPEN', 
  HALF_OPEN: 'HALF_OPEN',

  // For external API calls
  ExternalAPI: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 10000,
    resetTimeout: 60000,
  },

  // For database operations
  Database: {
    failureThreshold: 10,
    successThreshold: 5,
    timeout: 5000,
    resetTimeout: 30000,
  },

  // For email service
  EmailService: {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 15000,
    resetTimeout: 120000,
  },

  // For push notification service
  PushService: {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 8000,
    resetTimeout: 60000,
  },

  // For Redis operations
  Redis: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 2000,
    resetTimeout: 30000,
  },

  // For file operations
  FileSystem: {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 5000,
    resetTimeout: 30000,
  },
} as const;
