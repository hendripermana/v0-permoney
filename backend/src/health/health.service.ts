import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';

interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'ok' | 'error';
      message?: string;
      responseTime?: number;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthCheck> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;
    const checks: HealthCheck['checks'] = {};

    // Database health check
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = {
        status: 'ok',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      checks.database = {
        status: 'error',
        message: error.message,
      };
    }

    // Redis health check
    try {
      const start = Date.now();
      await this.redis.ping();
      checks.redis = {
        status: 'ok',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      checks.redis = {
        status: 'error',
        message: error.message,
      };
    }

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    checks.memory = {
      status: 'ok',
      message: `RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB, Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    };

    // Overall status
    const hasErrors = Object.values(checks).some(check => check.status === 'error');
    const status = hasErrors ? 'error' : 'ok';

    return {
      status,
      timestamp,
      uptime,
      checks,
    };
  }

  async readinessCheck(): Promise<{ status: string; message: string }> {
    try {
      // Check if all critical services are ready
      await this.prisma.$queryRaw`SELECT 1`;
      await this.redis.ping();

      return {
        status: 'ready',
        message: 'All services are ready',
      };
    } catch (error) {
      this.logger.error('Readiness check failed:', error);
      return {
        status: 'not ready',
        message: error.message,
      };
    }
  }

  async livenessCheck(): Promise<{ status: string; uptime: number }> {
    return {
      status: 'alive',
      uptime: Date.now() - this.startTime,
    };
  }

  async getDatabaseStats(): Promise<any> {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `;
      return stats;
    } catch (error) {
      this.logger.error('Failed to get database stats:', error);
      return null;
    }
  }

  async getRedisStats(): Promise<any> {
    try {
      const info = await this.redis.getClient().info();
      const lines = info.split('\r\n');
      const stats: any = {};

      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = value;
        }
      });

      return {
        version: stats.redis_version,
        uptime: stats.uptime_in_seconds,
        connected_clients: stats.connected_clients,
        used_memory: stats.used_memory_human,
        total_commands_processed: stats.total_commands_processed,
        keyspace_hits: stats.keyspace_hits,
        keyspace_misses: stats.keyspace_misses,
      };
    } catch (error) {
      this.logger.error('Failed to get Redis stats:', error);
      return null;
    }
  }
}
