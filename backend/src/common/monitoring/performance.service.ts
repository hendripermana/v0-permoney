import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StructuredLoggerService } from '../logging/logger.service';
import { MetricsService } from '../metrics/metrics.service';
import * as os from 'os';

export interface PerformanceThreshold {
  metric: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: number; // in seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

@Injectable()
export class PerformanceMonitoringService {
  private readonly thresholds: PerformanceThreshold[] = [
    {
      metric: 'response_time_p95',
      threshold: 1000, // 1 second
      severity: 'medium',
      description: '95th percentile response time exceeds 1 second',
    },
    {
      metric: 'response_time_p99',
      threshold: 3000, // 3 seconds
      severity: 'high',
      description: '99th percentile response time exceeds 3 seconds',
    },
    {
      metric: 'error_rate',
      threshold: 0.05, // 5%
      severity: 'high',
      description: 'Error rate exceeds 5%',
    },
    {
      metric: 'memory_usage',
      threshold: 0.85, // 85%
      severity: 'medium',
      description: 'Memory usage exceeds 85%',
    },
    {
      metric: 'cpu_usage',
      threshold: 0.80, // 80%
      severity: 'medium',
      description: 'CPU usage exceeds 80%',
    },
    {
      metric: 'database_connection_pool',
      threshold: 0.90, // 90%
      severity: 'high',
      description: 'Database connection pool usage exceeds 90%',
    },
    {
      metric: 'event_loop_lag',
      threshold: 100, // 100ms
      severity: 'high',
      description: 'Event loop lag exceeds 100ms',
    },
  ];

  private readonly alertRules: AlertRule[] = [
    {
      name: 'high_response_time',
      condition: 'avg_over_time(http_request_duration_seconds[5m]) > 1',
      threshold: 1,
      duration: 300, // 5 minutes
      severity: 'medium',
      enabled: true,
    },
    {
      name: 'high_error_rate',
      condition: 'rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05',
      threshold: 0.05,
      duration: 300,
      severity: 'high',
      enabled: true,
    },
    {
      name: 'memory_exhaustion',
      condition: 'nodejs_memory_usage_bytes{type="heapUsed"} / nodejs_memory_usage_bytes{type="heapTotal"} > 0.9',
      threshold: 0.9,
      duration: 600, // 10 minutes
      severity: 'critical',
      enabled: true,
    },
    {
      name: 'database_connectivity',
      condition: 'up{job="database"} == 0',
      threshold: 0,
      duration: 60, // 1 minute
      severity: 'critical',
      enabled: true,
    },
    {
      name: 'redis_connectivity',
      condition: 'up{job="redis"} == 0',
      threshold: 0,
      duration: 60,
      severity: 'high',
      enabled: true,
    },
  ];

  private performanceData: Map<string, number[]> = new Map();
  private alertStates: Map<string, { triggered: boolean; since: Date }> = new Map();

  constructor(
    private configService: ConfigService,
    private logger: StructuredLoggerService,
    private metricsService: MetricsService,
  ) {
    this.startPerformanceMonitoring();
  }

  private startPerformanceMonitoring() {
    // Monitor performance metrics every 30 seconds
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 30000);

    // Check alert rules every minute
    setInterval(() => {
      this.checkAlertRules();
    }, 60000);

    // Clean up old performance data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000);
  }

  private async collectPerformanceMetrics() {
    try {
      const metrics = {
        memory: this.getMemoryMetrics(),
        cpu: this.getCpuMetrics(),
        eventLoop: await this.getEventLoopMetrics(),
        gc: this.getGarbageCollectionMetrics(),
      };

      // Store metrics for trend analysis
      this.storeMetric('memory_heap_used', metrics.memory.heapUsed);
      this.storeMetric('memory_heap_total', metrics.memory.heapTotal);
      this.storeMetric('cpu_usage', metrics.cpu.usage);
      this.storeMetric('event_loop_lag', metrics.eventLoop.lag);

      // Log performance metrics
      this.logger.logPerformanceMetric('system_metrics', 1, 'count', {
        operation: 'performance_monitoring',
        resource: 'system',
        metrics,
      });

      // Check thresholds
      this.checkPerformanceThresholds(metrics);
    } catch (error) {
      this.logger.error('Failed to collect performance metrics', error.stack, {
        operation: 'performance_monitoring',
        resource: 'system',
      });
    }
  }

  private getMemoryMetrics() {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      rss: memUsage.rss,
      external: memUsage.external,
      systemTotal: totalMemory,
      systemFree: freeMemory,
      systemUsagePercent: ((totalMemory - freeMemory) / totalMemory) * 100,
    };
  }

  private getCpuMetrics() {
    const cpuUsage = process.cpuUsage();
    const totalUsage = cpuUsage.user + cpuUsage.system;
    
    return {
      user: cpuUsage.user,
      system: cpuUsage.system,
      total: totalUsage,
      usage: totalUsage / 1000000, // Convert to seconds
    };
  }

  private getEventLoopMetrics() {
    return new Promise<{ lag: number }>((resolve) => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds
        resolve({ lag });
      });
    });
  }

  private getGarbageCollectionMetrics() {
    // This would require additional setup with performance hooks
    // For now, return basic info
    return {
      // GC metrics would be collected here if performance hooks are set up
      available: false,
    };
  }

  private storeMetric(name: string, value: number) {
    if (!this.performanceData.has(name)) {
      this.performanceData.set(name, []);
    }
    
    const data = this.performanceData.get(name)!;
    data.push(value);
    
    // Keep only last 100 data points (about 50 minutes of data)
    if (data.length > 100) {
      data.shift();
    }
  }

  private checkPerformanceThresholds(metrics: any) {
    this.thresholds.forEach(threshold => {
      let currentValue: number;
      
      switch (threshold.metric) {
        case 'memory_usage':
          currentValue = metrics.memory.heapUsagePercent / 100;
          break;
        case 'cpu_usage':
          currentValue = metrics.cpu.usage;
          break;
        case 'event_loop_lag':
          currentValue = metrics.eventLoop.lag;
          break;
        default:
          return;
      }

      if (currentValue > threshold.threshold) {
        this.triggerAlert(threshold.metric, currentValue, threshold);
      }
    });
  }

  private checkAlertRules() {
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      // This is a simplified version - in production, you'd query Prometheus
      // For now, we'll check basic conditions
      this.evaluateAlertRule(rule);
    });
  }

  private evaluateAlertRule(rule: AlertRule) {
    // Simplified alert rule evaluation
    // In production, this would query Prometheus with the actual condition
    let shouldTrigger = false;
    
    switch (rule.name) {
      case 'high_response_time':
        // Check if average response time is high
        shouldTrigger = this.getAverageMetric('response_time') > rule.threshold * 1000;
        break;
      case 'high_error_rate':
        shouldTrigger = this.getErrorRate() > rule.threshold;
        break;
      case 'memory_exhaustion':
        shouldTrigger = this.getAverageMetric('memory_heap_used') / this.getAverageMetric('memory_heap_total') > rule.threshold;
        break;
    }

    const alertKey = rule.name;
    const currentState = this.alertStates.get(alertKey);

    if (shouldTrigger && !currentState?.triggered) {
      // New alert
      this.alertStates.set(alertKey, { triggered: true, since: new Date() });
      this.sendAlert(rule, 'triggered');
    } else if (!shouldTrigger && currentState?.triggered) {
      // Alert resolved
      this.alertStates.set(alertKey, { triggered: false, since: new Date() });
      this.sendAlert(rule, 'resolved');
    }
  }

  private getAverageMetric(name: string): number {
    const data = this.performanceData.get(name);
    if (!data || data.length === 0) return 0;
    
    return data.reduce((sum, value) => sum + value, 0) / data.length;
  }

  private getErrorRate(): number {
    // This would be calculated from actual metrics
    // For now, return a placeholder
    return 0;
  }

  private triggerAlert(metric: string, value: number, threshold: PerformanceThreshold) {
    const alertKey = `threshold_${metric}`;
    const currentState = this.alertStates.get(alertKey);
    
    if (!currentState?.triggered) {
      this.alertStates.set(alertKey, { triggered: true, since: new Date() });
      
      this.logger.warn(`Performance threshold exceeded: ${threshold.description}`, {
        operation: 'performance_alert',
        resource: 'system',
        metric,
        currentValue: value,
        threshold: threshold.threshold,
        severity: threshold.severity,
      });

      // Record alert metric
      this.metricsService.recordError('performance_threshold', threshold.severity);
    }
  }

  private sendAlert(rule: AlertRule, status: 'triggered' | 'resolved') {
    const alertData = {
      rule: rule.name,
      status,
      severity: rule.severity,
      condition: rule.condition,
      threshold: rule.threshold,
      timestamp: new Date().toISOString(),
    };

    this.logger.warn(`Alert ${status}: ${rule.name}`, {
      operation: 'alert',
      resource: 'monitoring',
      alertData,
    });

    // In production, this would send notifications via email, Slack, etc.
    this.sendNotification(alertData);
  }

  private sendNotification(alertData: any) {
    // Placeholder for notification system integration
    // This would integrate with email, Slack, PagerDuty, etc.
    console.log('Alert notification:', alertData);
  }

  private cleanupOldData() {
    // Clean up performance data older than 1 hour
    this.performanceData.forEach((data, key) => {
      if (data.length > 120) { // Keep last 2 hours of data (30s intervals)
        this.performanceData.set(key, data.slice(-120));
      }
    });

    this.logger.debug('Cleaned up old performance data', {
      operation: 'cleanup',
      resource: 'performance_data',
    });
  }

  // Public methods for getting performance data
  getPerformanceMetrics() {
    return {
      memory: this.getMemoryMetrics(),
      cpu: this.getCpuMetrics(),
      alerts: Array.from(this.alertStates.entries()).map(([name, state]) => ({
        name,
        triggered: state.triggered,
        since: state.since,
      })),
      thresholds: this.thresholds,
    };
  }

  getAlertRules() {
    return this.alertRules;
  }

  updateAlertRule(name: string, updates: Partial<AlertRule>) {
    const ruleIndex = this.alertRules.findIndex(rule => rule.name === name);
    if (ruleIndex !== -1) {
      this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
      
      this.logger.log(`Alert rule updated: ${name}`, {
        operation: 'alert_rule_update',
        resource: 'monitoring',
        updates,
      });
    }
  }
}
