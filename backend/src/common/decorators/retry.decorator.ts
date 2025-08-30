import { SetMetadata } from '@nestjs/common';
import { RetryOptions } from '../services/retry.service';

export const RETRY_METADATA_KEY = 'retry_options';

/**
 * Decorator to add retry logic to methods
 */
export function Retry(options: RetryOptions = {}) {
  return SetMetadata(RETRY_METADATA_KEY, options);
}

/**
 * Predefined retry configurations for common scenarios
 */
export const RetryConfigs = {
  // For external API calls
  ExternalAPI: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    jitter: true,
  },

  // For database operations
  Database: {
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 5000,
    jitter: true,
  },

  // For email sending
  Email: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 30000,
    jitter: true,
  },

  // For push notifications
  PushNotification: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    jitter: true,
  },

  // For file operations
  FileOperation: {
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 2000,
    jitter: false,
  },

  // For Redis operations
  Redis: {
    maxRetries: 3,
    baseDelay: 100,
    maxDelay: 1000,
    jitter: true,
  },
} as const;
