import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
      
      // Main client for general operations
      this.client = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Separate clients for pub/sub to avoid blocking
      this.subscriber = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.publisher = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Connect all clients
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect(),
      ]);

      this.logger.log('Redis connections established successfully');

      // Set up error handlers
      this.client.on('error', (error) => {
        this.logger.error('Redis client error:', error);
      });

      this.subscriber.on('error', (error) => {
        this.logger.error('Redis subscriber error:', error);
      });

      this.publisher.on('error', (error) => {
        this.logger.error('Redis publisher error:', error);
      });

    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      await Promise.all([
        this.client?.quit(),
        this.subscriber?.quit(),
        this.publisher?.quit(),
      ]);
      this.logger.log('Redis connections closed successfully');
    } catch (error) {
      this.logger.error('Error disconnecting from Redis:', error);
    }
  }

  // Basic Redis operations
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Redis DEL error for key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.expire(key, ttlSeconds);
    } catch (error) {
      this.logger.error(`Redis EXPIRE error for key ${key}:`, error);
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      this.logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.client.hset(key, field, value);
    } catch (error) {
      this.logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      this.logger.error(`Redis HGETALL error for key ${key}:`, error);
      return {};
    }
  }

  async hdel(key: string, field: string): Promise<void> {
    try {
      await this.client.hdel(key, field);
    } catch (error) {
      this.logger.error(`Redis HDEL error for key ${key}, field ${field}:`, error);
    }
  }

  // List operations
  async lpush(key: string, value: string): Promise<void> {
    try {
      await this.client.lpush(key, value);
    } catch (error) {
      this.logger.error(`Redis LPUSH error for key ${key}:`, error);
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rpop(key);
    } catch (error) {
      this.logger.error(`Redis RPOP error for key ${key}:`, error);
      return null;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      this.logger.error(`Redis LRANGE error for key ${key}:`, error);
      return [];
    }
  }

  // Set operations
  async sadd(key: string, member: string): Promise<void> {
    try {
      await this.client.sadd(key, member);
    } catch (error) {
      this.logger.error(`Redis SADD error for key ${key}:`, error);
    }
  }

  async srem(key: string, member: string): Promise<void> {
    try {
      await this.client.srem(key, member);
    } catch (error) {
      this.logger.error(`Redis SREM error for key ${key}:`, error);
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      this.logger.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.publisher.publish(channel, message);
    } catch (error) {
      this.logger.error(`Redis PUBLISH error for channel ${channel}:`, error);
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          callback(message);
        }
      });
    } catch (error) {
      this.logger.error(`Redis SUBSCRIBE error for channel ${channel}:`, error);
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
    } catch (error) {
      this.logger.error(`Redis UNSUBSCRIBE error for channel ${channel}:`, error);
    }
  }

  // Utility methods
  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error) {
      this.logger.error('Redis PING error:', error);
      throw error;
    }
  }

  async flushall(): Promise<void> {
    try {
      await this.client.flushall();
      this.logger.warn('Redis FLUSHALL executed - all data cleared');
    } catch (error) {
      this.logger.error('Redis FLUSHALL error:', error);
    }
  }

  // Session management helpers
  async setSession(sessionId: string, sessionData: any, ttlSeconds = 3600): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, JSON.stringify(sessionData), ttlSeconds);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  async extendSession(sessionId: string, ttlSeconds = 3600): Promise<void> {
    const key = `session:${sessionId}`;
    await this.expire(key, ttlSeconds);
  }

  // Rate limiting helpers
  async incrementRateLimit(key: string, windowSeconds = 60): Promise<number> {
    try {
      const current = await this.client.incr(key);
      if (current === 1) {
        await this.client.expire(key, windowSeconds);
      }
      return current;
    } catch (error) {
      this.logger.error(`Redis rate limit increment error for key ${key}:`, error);
      return 0;
    }
  }

  async getRateLimit(key: string): Promise<number> {
    try {
      const value = await this.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      this.logger.error(`Redis rate limit get error for key ${key}:`, error);
      return 0;
    }
  }

  // Get the raw Redis client for advanced operations
  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  getPublisher(): Redis {
    return this.publisher;
  }
}
