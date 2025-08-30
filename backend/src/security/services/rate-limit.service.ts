import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../cache/redis.service';
import { AuditService, AuditEventType, AuditSeverity } from './audit.service';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs?: number; // How long to block after limit exceeded
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: any) => string; // Custom key generator
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  totalHits: number;
  blocked?: boolean;
  blockExpiresAt?: Date;
}

export enum RateLimitType {
  GLOBAL = 'global',
  PER_IP = 'per_ip',
  PER_USER = 'per_user',
  PER_ENDPOINT = 'per_endpoint',
  LOGIN_ATTEMPTS = 'login_attempts',
  PASSWORD_RESET = 'password_reset',
  API_CALLS = 'api_calls',
  FILE_UPLOAD = 'file_upload',
  EXPENSIVE_OPERATIONS = 'expensive_operations',
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  // Default rate limit configurations
  private readonly defaultConfigs: Record<RateLimitType, RateLimitConfig> = {
    [RateLimitType.GLOBAL]: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
      blockDurationMs: 60 * 1000, // 1 minute
    },
    [RateLimitType.PER_IP]: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      blockDurationMs: 5 * 60 * 1000, // 5 minutes
    },
    [RateLimitType.PER_USER]: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 200,
      blockDurationMs: 2 * 60 * 1000, // 2 minutes
    },
    [RateLimitType.PER_ENDPOINT]: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 30,
      blockDurationMs: 30 * 1000, // 30 seconds
    },
    [RateLimitType.LOGIN_ATTEMPTS]: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      blockDurationMs: 15 * 60 * 1000, // 15 minutes
      skipSuccessfulRequests: true,
    },
    [RateLimitType.PASSWORD_RESET]: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      blockDurationMs: 60 * 60 * 1000, // 1 hour
    },
    [RateLimitType.API_CALLS]: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 1000,
      blockDurationMs: 10 * 60 * 1000, // 10 minutes
    },
    [RateLimitType.FILE_UPLOAD]: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
    },
    [RateLimitType.EXPENSIVE_OPERATIONS]: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
      blockDurationMs: 60 * 60 * 1000, // 1 hour
    },
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    key: string,
    type: RateLimitType,
    customConfig?: Partial<RateLimitConfig>,
  ): Promise<RateLimitResult> {
    const config = { ...this.defaultConfigs[type], ...customConfig };
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Check if currently blocked
    const blockKey = `rate_limit:block:${type}:${key}`;
    const blockExpiry = await this.redisService.get(blockKey);
    
    if (blockExpiry) {
      const blockExpiresAt = new Date(parseInt(blockExpiry));
      if (blockExpiresAt > new Date()) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: blockExpiresAt,
          totalHits: config.maxRequests,
          blocked: true,
          blockExpiresAt,
        };
      } else {
        // Block expired, clean up
        await this.redisService.del(blockKey);
      }
    }

    // Use sliding window log approach for accurate rate limiting
    const requestKey = `rate_limit:requests:${type}:${key}`;
    
    // Remove old entries and count current requests
    await this.redisService.zremrangebyscore(requestKey, 0, windowStart);
    const currentRequests = await this.redisService.zcard(requestKey);

    const resetTime = new Date(now + config.windowMs);
    const remaining = Math.max(0, config.maxRequests - currentRequests);

    if (currentRequests >= config.maxRequests) {
      // Rate limit exceeded
      if (config.blockDurationMs) {
        const blockExpiresAt = new Date(now + config.blockDurationMs);
        await this.redisService.setex(
          blockKey,
          Math.ceil(config.blockDurationMs / 1000),
          blockExpiresAt.getTime().toString(),
        );

        // Log security event
        await this.auditService.logSecurityViolation(
          'Rate limit exceeded',
          {
            type,
            key,
            currentRequests,
            maxRequests: config.maxRequests,
            blockDurationMs: config.blockDurationMs,
          },
          AuditSeverity.MEDIUM,
        );

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          totalHits: currentRequests,
          blocked: true,
          blockExpiresAt,
        };
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        totalHits: currentRequests,
      };
    }

    // Add current request to the log
    await this.redisService.zadd(requestKey, now, `${now}-${Math.random()}`);
    await this.redisService.expire(requestKey, Math.ceil(config.windowMs / 1000));

    return {
      allowed: true,
      remaining: remaining - 1,
      resetTime,
      totalHits: currentRequests + 1,
    };
  }

  /**
   * Check multiple rate limits at once
   */
  async checkMultipleRateLimits(
    checks: Array<{
      key: string;
      type: RateLimitType;
      config?: Partial<RateLimitConfig>;
    }>,
  ): Promise<RateLimitResult[]> {
    const results = await Promise.all(
      checks.map(check =>
        this.checkRateLimit(check.key, check.type, check.config),
      ),
    );

    return results;
  }

  /**
   * Generate rate limit key for IP-based limiting
   */
  generateIPKey(ip: string, endpoint?: string): string {
    return endpoint ? `${ip}:${endpoint}` : ip;
  }

  /**
   * Generate rate limit key for user-based limiting
   */
  generateUserKey(userId: string, endpoint?: string): string {
    return endpoint ? `${userId}:${endpoint}` : userId;
  }

  /**
   * Generate rate limit key for endpoint-based limiting
   */
  generateEndpointKey(method: string, path: string, identifier?: string): string {
    const baseKey = `${method}:${path}`;
    return identifier ? `${baseKey}:${identifier}` : baseKey;
  }

  /**
   * Reset rate limit for a key
   */
  async resetRateLimit(key: string, type: RateLimitType): Promise<void> {
    const requestKey = `rate_limit:requests:${type}:${key}`;
    const blockKey = `rate_limit:block:${type}:${key}`;

    await Promise.all([
      this.redisService.del(requestKey),
      this.redisService.del(blockKey),
    ]);

    this.logger.log(`Reset rate limit for ${type}:${key}`);
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(
    key: string,
    type: RateLimitType,
  ): Promise<{
    currentRequests: number;
    maxRequests: number;
    windowMs: number;
    blocked: boolean;
    blockExpiresAt?: Date;
  }> {
    const config = this.defaultConfigs[type];
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Check if blocked
    const blockKey = `rate_limit:block:${type}:${key}`;
    const blockExpiry = await this.redisService.get(blockKey);
    const blocked = blockExpiry && new Date(parseInt(blockExpiry)) > new Date();

    // Count current requests
    const requestKey = `rate_limit:requests:${type}:${key}`;
    await this.redisService.zremrangebyscore(requestKey, 0, windowStart);
    const currentRequests = await this.redisService.zcard(requestKey);

    return {
      currentRequests,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      blocked: !!blocked,
      blockExpiresAt: blocked ? new Date(parseInt(blockExpiry)) : undefined,
    };
  }

  /**
   * Implement progressive rate limiting (stricter limits for repeated violations)
   */
  async checkProgressiveRateLimit(
    key: string,
    type: RateLimitType,
  ): Promise<RateLimitResult> {
    // Check violation history
    const violationKey = `rate_limit:violations:${type}:${key}`;
    const violations = await this.redisService.get(violationKey);
    const violationCount = violations ? parseInt(violations) : 0;

    // Adjust limits based on violation history
    const baseConfig = this.defaultConfigs[type];
    const adjustedConfig: RateLimitConfig = {
      ...baseConfig,
      maxRequests: Math.max(1, baseConfig.maxRequests - violationCount * 2),
      blockDurationMs: baseConfig.blockDurationMs
        ? baseConfig.blockDurationMs * Math.pow(2, violationCount)
        : undefined,
    };

    const result = await this.checkRateLimit(key, type, adjustedConfig);

    // Track violations
    if (!result.allowed && !result.blocked) {
      await this.redisService.incr(violationKey);
      await this.redisService.expire(violationKey, 24 * 60 * 60); // 24 hours
    }

    return result;
  }

  /**
   * Implement distributed rate limiting across multiple instances
   */
  async checkDistributedRateLimit(
    key: string,
    type: RateLimitType,
    instanceId: string,
  ): Promise<RateLimitResult> {
    // Use Redis for distributed coordination
    const distributedKey = `rate_limit:distributed:${type}:${key}`;
    const instanceKey = `${distributedKey}:${instanceId}`;
    
    const config = this.defaultConfigs[type];
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up old entries from all instances
    const allInstanceKeys = await this.redisService.keys(`${distributedKey}:*`);
    await Promise.all(
      allInstanceKeys.map(instanceKey =>
        this.redisService.zremrangebyscore(instanceKey, 0, windowStart),
      ),
    );

    // Count total requests across all instances
    const totalRequests = await Promise.all(
      allInstanceKeys.map(instanceKey => this.redisService.zcard(instanceKey)),
    );
    const currentRequests = totalRequests.reduce((sum, count) => sum + count, 0);

    if (currentRequests >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now + config.windowMs),
        totalHits: currentRequests,
      };
    }

    // Add request to this instance
    await this.redisService.zadd(instanceKey, now, `${now}-${Math.random()}`);
    await this.redisService.expire(instanceKey, Math.ceil(config.windowMs / 1000));

    return {
      allowed: true,
      remaining: config.maxRequests - currentRequests - 1,
      resetTime: new Date(now + config.windowMs),
      totalHits: currentRequests + 1,
    };
  }

  /**
   * Get rate limit statistics
   */
  async getRateLimitStats(
    type: RateLimitType,
    timeRange: { start: Date; end: Date },
  ): Promise<{
    totalRequests: number;
    blockedRequests: number;
    topViolators: Array<{ key: string; violations: number }>;
    averageRequestsPerMinute: number;
  }> {
    // This would typically query stored metrics
    // For now, return basic stats from current data
    const pattern = `rate_limit:requests:${type}:*`;
    const keys = await this.redisService.keys(pattern);

    let totalRequests = 0;
    const violators: Record<string, number> = {};

    for (const key of keys) {
      const count = await this.redisService.zcard(key);
      totalRequests += count;

      if (count > this.defaultConfigs[type].maxRequests) {
        const identifier = key.split(':').pop() || 'unknown';
        violators[identifier] = count;
      }
    }

    const topViolators = Object.entries(violators)
      .map(([key, violations]) => ({ key, violations }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 10);

    const timeRangeMs = timeRange.end.getTime() - timeRange.start.getTime();
    const averageRequestsPerMinute = (totalRequests / timeRangeMs) * 60 * 1000;

    return {
      totalRequests,
      blockedRequests: Object.values(violators).reduce((sum, count) => sum + count, 0),
      topViolators,
      averageRequestsPerMinute,
    };
  }

  /**
   * Whitelist IP or user from rate limiting
   */
  async addToWhitelist(
    identifier: string,
    type: 'ip' | 'user',
    expiresIn?: number,
  ): Promise<void> {
    const whitelistKey = `rate_limit:whitelist:${type}:${identifier}`;
    
    if (expiresIn) {
      await this.redisService.setex(whitelistKey, expiresIn, '1');
    } else {
      await this.redisService.set(whitelistKey, '1');
    }

    await this.auditService.logSystemEvent(
      AuditEventType.CONFIGURATION_CHANGED,
      'Added to rate limit whitelist',
      { identifier, type, expiresIn },
    );
  }

  /**
   * Check if identifier is whitelisted
   */
  async isWhitelisted(identifier: string, type: 'ip' | 'user'): Promise<boolean> {
    const whitelistKey = `rate_limit:whitelist:${type}:${identifier}`;
    const result = await this.redisService.get(whitelistKey);
    return !!result;
  }

  /**
   * Remove from whitelist
   */
  async removeFromWhitelist(identifier: string, type: 'ip' | 'user'): Promise<void> {
    const whitelistKey = `rate_limit:whitelist:${type}:${identifier}`;
    await this.redisService.del(whitelistKey);

    await this.auditService.logSystemEvent(
      AuditEventType.CONFIGURATION_CHANGED,
      'Removed from rate limit whitelist',
      { identifier, type },
    );
  }
}
