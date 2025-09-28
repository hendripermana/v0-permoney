import { Controller, Get, Query, Param, Put, Body, UseGuards } from '@nestjs/common';

import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PerformanceMonitoringService, AlertRule } from '../common/monitoring/performance.service';
import { MetricsService } from '../common/metrics/metrics.service';
import { StructuredLoggerService } from '../common/logging/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import * as os from 'os';

@Controller('monitoring')
@UseGuards(RolesGuard)
@Roles('ADMIN') // Only admins can access monitoring endpoints
export class MonitoringController {
  constructor(
    private performanceService: PerformanceMonitoringService,
    private metricsService: MetricsService,
    private logger: StructuredLoggerService,
    private prismaService: PrismaService,
  ) {}

  @Get('dashboard')
  async getDashboard(@Query('timeRange') timeRange: string = '1h') {
    const startTime = Date.now();
    
    try {
      const [
        systemMetrics,
        businessMetrics,
        alertStatus,
        recentErrors,
      ] = await Promise.all([
        this.getSystemMetrics(),
        this.getBusinessMetrics(timeRange),
        this.getAlertStatus(),
        this.getRecentErrors(),
      ]);

      const dashboard = {
        timestamp: new Date().toISOString(),
        timeRange,
        system: systemMetrics,
        business: businessMetrics,
        alerts: alertStatus,
        errors: recentErrors,
        responseTime: Date.now() - startTime,
      };

      this.logger.log('Monitoring dashboard accessed', {
        operation: 'dashboard_access',
        resource: 'monitoring',
        timeRange,
        duration: Date.now() - startTime,
      });

      return dashboard;
    } catch (error) {
      this.logger.error('Failed to load monitoring dashboard', error.stack, {
        operation: 'dashboard_access',
        resource: 'monitoring',
        timeRange,
      });
      throw error;
    }
  }

  @Get('metrics/prometheus')
  async getPrometheusMetrics() {
    return this.metricsService.getMetrics();
  }

  @Get('performance')
  async getPerformanceMetrics() {
    return this.performanceService.getPerformanceMetrics();
  }

  @Get('alerts')
  async getAlerts() {
    return this.performanceService.getAlertRules();
  }

  @Put('alerts/:name')
  async updateAlert(@Param('name') name: string, @Body() updates: Partial<AlertRule>) {
    this.performanceService.updateAlertRule(name, updates);
    
    this.logger.log(`Alert rule updated: ${name}`, {
      operation: 'alert_rule_update',
      resource: 'monitoring',
      alertName: name,
      updates,
    });

    return { success: true, message: `Alert rule ${name} updated` };
  }

  @Get('system/overview')
  async getSystemOverview() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();
    
    return {
      process: {
        pid: process.pid,
        uptime,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        total: cpuUsage.user + cpuUsage.system,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('database/stats')
  async getDatabaseStats() {
    try {
      const [
        userCount,
        householdCount,
        accountCount,
        transactionCount,
        recentTransactions,
      ] = await Promise.all([
        this.prismaService.user.count(),
        this.prismaService.household.count(),
        this.prismaService.account.count(),
        this.prismaService.transaction.count(),
        this.prismaService.transaction.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

      return {
        counts: {
          users: userCount,
          households: householdCount,
          accounts: accountCount,
          transactions: transactionCount,
          recentTransactions,
        },
        growth: {
          transactionsLast24h: recentTransactions,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get database stats', error.stack, {
        operation: 'database_stats',
        resource: 'monitoring',
      });
      throw error;
    }
  }

  @Get('logs/recent')
  async getRecentLogs(
    @Query('level') level: string = 'error',
    @Query('limit') limit: string = '50'
  ) {
    // This would typically query a log aggregation system like Elasticsearch
    // For now, return a placeholder response
    return {
      logs: [],
      level,
      limit: parseInt(limit),
      message: 'Log aggregation system integration required',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('trends/:metric')
  async getMetricTrends(
    @Param('metric') metric: string,
    @Query('timeRange') timeRange: string = '1h',
    @Query('interval') interval: string = '5m'
  ) {
    // This would query time-series data from Prometheus or similar
    // For now, return sample data structure
    return {
      metric,
      timeRange,
      interval,
      dataPoints: [],
      message: 'Time-series data integration required',
      timestamp: new Date().toISOString(),
    };
  }

  private async getSystemMetrics() {
    const memUsage = process.memoryUsage();
    
    return {
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        rss: memUsage.rss,
        systemTotal: os.totalmem(),
        systemFree: os.freemem(),
        systemUsagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
      cpu: {
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length,
      },
      uptime: {
        process: process.uptime(),
        system: os.uptime(),
      },
      network: {
        // Network metrics would be collected here
      },
    };
  }

  private async getBusinessMetrics(timeRange: string) {
    const timeRangeMs = this.parseTimeRange(timeRange);
    const since = new Date(Date.now() - timeRangeMs);

    try {
      const [
        activeUsers,
        newTransactions,
        totalTransactionValue,
        errorCount,
      ] = await Promise.all([
        this.getActiveUsersCount(since),
        this.prismaService.transaction.count({
          where: { createdAt: { gte: since } },
        }),
        this.getTotalTransactionValue(since),
        this.getErrorCount(since),
      ]);

      return {
        users: {
          active: activeUsers,
        },
        transactions: {
          count: newTransactions,
          totalValue: totalTransactionValue,
        },
        errors: {
          count: errorCount,
        },
        timeRange,
        since: since.toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get business metrics', error.stack);
      return {
        error: 'Failed to retrieve business metrics',
        timeRange,
      };
    }
  }

  private async getAlertStatus() {
    const performanceMetrics = this.performanceService.getPerformanceMetrics();
    const activeAlerts = performanceMetrics.alerts.filter(alert => alert.triggered);
    
    return {
      total: performanceMetrics.alerts.length,
      active: activeAlerts.length,
      critical: activeAlerts.filter(alert => 
        performanceMetrics.thresholds.find(t => 
          t.metric === alert.name && t.severity === 'critical'
        )
      ).length,
      alerts: activeAlerts,
    };
  }

  private async getRecentErrors() {
    // This would typically query error logs from a logging system
    // For now, return a placeholder
    return {
      count: 0,
      errors: [],
      message: 'Error log aggregation system integration required',
    };
  }

  private parseTimeRange(timeRange: string): number {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));
    
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // Default to 1 hour
    }
  }

  private async getActiveUsersCount(since: Date): Promise<number> {
    // This would typically query user activity logs
    // For now, return a placeholder based on recent transactions
    const usersWithRecentActivity = await this.prismaService.transaction.findMany({
      where: { createdAt: { gte: since } },
      select: { createdBy: true },
      distinct: ['createdBy'],
    });
    
    return usersWithRecentActivity.length;
  }

  private async getTotalTransactionValue(since: Date): Promise<number> {
    const result = await this.prismaService.transaction.aggregate({
      where: { 
        createdAt: { gte: since },
        amountCents: { gt: 0 }, // Only positive amounts (expenses)
      },
      _sum: { amountCents: true },
    });
    
    return result._sum.amountCents || 0;
  }

  private async getErrorCount(since: Date): Promise<number> {
    // This would typically query error logs
    // For now, return a placeholder
    return 0;
  }
}
