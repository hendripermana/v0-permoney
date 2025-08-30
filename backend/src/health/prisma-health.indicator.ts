import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private prismaService: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      
      // Simple query to check database connectivity
      await this.prismaService.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      const result = this.getStatus(key, true, {
        status: 'up',
        responseTime,
        message: 'Database connection is healthy',
      });

      return result;
    } catch (error) {
      const result = this.getStatus(key, false, {
        status: 'down',
        message: error.message,
      });
      
      throw new HealthCheckError('Prisma check failed', result);
    }
  }

  async getDetailedHealth() {
    try {
      const startTime = Date.now();
      
      // Check basic connectivity
      await this.prismaService.$queryRaw`SELECT 1`;
      const connectivityTime = Date.now() - startTime;

      // Check database version
      const versionResult = await this.prismaService.$queryRaw`SELECT version()` as any[];
      const version = versionResult[0]?.version || 'Unknown';

      // Check connection pool status
      const poolStatus = await this.getConnectionPoolStatus();

      // Check table accessibility
      const tablesCheck = await this.checkTableAccessibility();

      return {
        status: 'ok',
        details: {
          connectivity: {
            status: 'up',
            responseTime: connectivityTime,
          },
          version,
          connectionPool: poolStatus,
          tables: tablesCheck,
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

  private async getConnectionPoolStatus() {
    try {
      // Get connection pool metrics from Prisma
      const metrics = await this.prismaService.$metrics.json();
      
      return {
        status: 'ok',
        metrics: metrics.counters.find(c => c.key === 'prisma_pool_connections_open')?.value || 0,
      };
    } catch (error) {
      return {
        status: 'unknown',
        error: 'Unable to retrieve connection pool metrics',
      };
    }
  }

  private async checkTableAccessibility() {
    const tables = [
      'users',
      'households',
      'accounts',
      'transactions',
      'categories',
    ];

    const results = await Promise.allSettled(
      tables.map(async (table) => {
        const startTime = Date.now();
        const count = await this.prismaService.$queryRaw`
          SELECT COUNT(*) as count FROM ${table} LIMIT 1
        ` as any[];
        
        return {
          table,
          accessible: true,
          responseTime: Date.now() - startTime,
          recordCount: parseInt(count[0]?.count || '0'),
        };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        table: tables[index],
        accessible: false,
        error: result.reason?.message || 'Unknown error',
      };
    });
  }
}
