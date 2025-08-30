import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      this.logger.debug(`Cache GET: ${key} - ${value ? 'HIT' : 'MISS'}`);
      return value || null;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}: ${error.message}`, error.stack);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET: ${key} with TTL ${ttl || 'default'}`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}: ${error.message}`, error.stack);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DEL error for key ${key}: ${error.message}`, error.stack);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.debug('Cache RESET: All keys cleared');
    } catch (error) {
      this.logger.error(`Cache RESET error: ${error.message}`, error.stack);
    }
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      const result = await this.cacheManager.wrap(key, fn, ttl);
      this.logger.debug(`Cache WRAP: ${key} with TTL ${ttl || 'default'}`);
      return result;
    } catch (error) {
      this.logger.error(`Cache WRAP error for key ${key}: ${error.message}`, error.stack);
      // Fallback to direct function execution if cache fails
      return await fn();
    }
  }

  // Utility methods for common cache patterns
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Note: This requires Redis SCAN command, implement based on your Redis client
      this.logger.debug(`Cache INVALIDATE PATTERN: ${pattern}`);
      // Implementation would depend on the underlying Redis client
      // For now, we'll log the pattern for debugging
    } catch (error) {
      this.logger.error(`Cache INVALIDATE PATTERN error for ${pattern}: ${error.message}`, error.stack);
    }
  }

  // Cache key builders for consistency
  buildUserCacheKey(userId: string, suffix?: string): string {
    return `user:${userId}${suffix ? `:${suffix}` : ''}`;
  }

  buildHouseholdCacheKey(householdId: string, suffix?: string): string {
    return `household:${householdId}${suffix ? `:${suffix}` : ''}`;
  }

  buildAccountCacheKey(accountId: string, suffix?: string): string {
    return `account:${accountId}${suffix ? `:${suffix}` : ''}`;
  }

  buildTransactionCacheKey(transactionId: string, suffix?: string): string {
    return `transaction:${transactionId}${suffix ? `:${suffix}` : ''}`;
  }

  buildSessionCacheKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  buildExchangeRateCacheKey(fromCurrency: string, toCurrency: string, date?: string): string {
    const dateStr = date || new Date().toISOString().split('T')[0];
    return `exchange_rate:${fromCurrency}:${toCurrency}:${dateStr}`;
  }
}
