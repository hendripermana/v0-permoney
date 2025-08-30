import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private redis: Redis;

  constructor(private configService: ConfigService) {
    super();
    
    const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
    this.redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      
      // Test Redis connectivity with ping
      const pong = await this.redis.ping();
      
      if (pong !== 'PONG') {
        throw new Error('Redis ping failed');
      }
      
      const responseTime = Date.now() - startTime;
      
      const result = this.getStatus(key, true, {
        status: 'up',
        responseTime,
        message: 'Redis connection is healthy',
      });

      return result;
    } catch (error) {
      const result = this.getStatus(key, false, {
        status: 'down',
        message: error.message,
      });
      
      throw new HealthCheckError('Redis check failed', result);
    }
  }

  async getDetailedHealth() {
    try {
      const startTime = Date.now();
      
      // Test connectivity
      await this.redis.ping();
      const connectivityTime = Date.now() - startTime;

      // Get Redis info
      const info = await this.redis.info();
      const infoLines = info.split('\r\n');
      const infoObj = {};
      
      infoLines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          infoObj[key] = value;
        }
      });

      // Test read/write operations
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();
      
      const writeStartTime = Date.now();
      await this.redis.set(testKey, testValue, 'EX', 10); // Expire in 10 seconds
      const writeTime = Date.now() - writeStartTime;
      
      const readStartTime = Date.now();
      const readValue = await this.redis.get(testKey);
      const readTime = Date.now() - readStartTime;
      
      // Clean up test key
      await this.redis.del(testKey);

      // Get memory usage
      const memoryInfo = await this.redis.memory('usage', 'health_check');

      return {
        status: 'ok',
        details: {
          connectivity: {
            status: 'up',
            responseTime: connectivityTime,
          },
          version: infoObj['redis_version'] || 'Unknown',
          mode: infoObj['redis_mode'] || 'Unknown',
          connectedClients: parseInt(infoObj['connected_clients'] || '0'),
          usedMemory: infoObj['used_memory_human'] || 'Unknown',
          usedMemoryPeak: infoObj['used_memory_peak_human'] || 'Unknown',
          operations: {
            write: {
              success: readValue === testValue,
              responseTime: writeTime,
            },
            read: {
              success: readValue === testValue,
              responseTime: readTime,
            },
          },
          uptime: parseInt(infoObj['uptime_in_seconds'] || '0'),
          keyspaceHits: parseInt(infoObj['keyspace_hits'] || '0'),
          keyspaceMisses: parseInt(infoObj['keyspace_misses'] || '0'),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
