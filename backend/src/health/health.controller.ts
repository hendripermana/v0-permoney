import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { RedisHealthIndicator } from './redis-health.indicator';
import { ExternalServiceHealthIndicator } from './external-service-health.indicator';
import { MetricsService } from '../common/metrics/metrics.service';
import { StructuredLoggerService } from '../common/logging/logger.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private externalServiceHealth: ExternalServiceHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private metricsService: MetricsService,
    private logger: StructuredLoggerService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  @Get('live')
  @HealthCheck()
  liveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.95 }),
    ]);
  }

  @Get('detailed')
  async detailedHealth() {
    const startTime = Date.now();
    
    try {
      const [
        databaseHealth,
        redisHealth,
        memoryHealth,
        diskHealth,
        externalServicesHealth,
      ] = await Promise.allSettled([
        this.prismaHealth.getDetailedHealth(),
        this.redisHealth.getDetailedHealth(),
        this.getMemoryHealth(),
        this.getDiskHealth(),
        this.externalServiceHealth.checkAllServices(),
      ]);

      const systemMetrics = await this.getSystemMetrics();
      const applicationMetrics = await this.getApplicationMetrics();

      const healthReport = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: this.getResultValue(databaseHealth),
          redis: this.getResultValue(redisHealth),
          memory: this.getResultValue(memoryHealth),
          disk: this.getResultValue(diskHealth),
          externalServices: this.getResultValue(externalServicesHealth),
        },
        metrics: {
          system: systemMetrics,
          application: applicationMetrics,
        },
        responseTime: Date.now() - startTime,
      };

      // Log health check
      this.logger.log('Detailed health check completed', {
        operation: 'health_check',
        resource: 'system',
        duration: Date.now() - startTime,
        status: healthReport.status,
      });

      return healthReport;
    } catch (error) {
      this.logger.error('Health check failed', error.stack, {
        operation: 'health_check',
        resource: 'system',
        duration: Date.now() - startTime,
      });

      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  @Get('metrics')
  async getMetrics() {
    return this.metricsService.getMetrics();
  }

  private getResultValue(result: PromiseSettledResult<any>) {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      status: 'error',
      error: result.reason?.message || 'Unknown error',
    };
  }

  private async getMemoryHealth() {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();

    return {
      status: 'ok',
      details: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
        systemTotal: totalMemory,
        systemFree: freeMemory,
        systemUsed: totalMemory - freeMemory,
        heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        systemUsagePercent: ((totalMemory - freeMemory) / totalMemory) * 100,
      },
    };
  }

  private async getDiskHealth() {
    const fs = require('fs');
    const path = require('path');

    try {
      const stats = fs.statSync(process.cwd());
      return {
        status: 'ok',
        details: {
          path: process.cwd(),
          accessible: true,
          writable: fs.constants.W_OK,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  private async getSystemMetrics() {
    const os = require('os');
    const cpus = os.cpus();
    
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || 'Unknown',
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
      hostname: os.hostname(),
    };
  }

  private async getApplicationMetrics() {
    return {
      processId: process.pid,
      processUptime: process.uptime(),
      nodeEnv: process.env.NODE_ENV,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length,
    };
  }
}
