import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    database: {
      status: string;
      message?: string;
    };
    memory: {
      status: string;
      usage: number;
    };
  }> {
    const timestamp = new Date().toISOString();

    // Check database connection
    let databaseStatus = 'ok';
    let databaseMessage: string | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      databaseStatus = 'error';
      databaseMessage = error && typeof error === 'object' && 'message' in error
        ? (error as Error).message
        : 'Unknown database error';
    }

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

    return {
      status: databaseStatus === 'ok' ? 'ok' : 'error',
      timestamp,
      database: {
        status: databaseStatus,
        message: databaseMessage,
      },
      memory: {
        status: memoryUsagePercent > 90 ? 'warning' : 'ok',
        usage: memoryUsagePercent,
      },
    };
  }

  async getReadiness(): Promise<{ status: string; timestamp: string }> {
    const health = await this.checkHealth();
    return {
      status: health.database.status === 'ok' ? 'ready' : 'not_ready',
      timestamp: health.timestamp,
    };
  }

  async getLiveness(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
