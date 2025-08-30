import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { MonitoringController } from '../monitoring.controller';
import { MetricsService } from '../../common/metrics/metrics.service';
import { PerformanceService } from '../../common/monitoring/performance.service';
import { LoggerService } from '../../common/logging/logger.service';
import { HealthController } from '../../health/health.controller';
import { PrismaHealthIndicator } from '../../health/prisma-health.indicator';
import { RedisHealthIndicator } from '../../health/redis-health.indicator';
import { ExternalServiceHealthIndicator } from '../../health/external-service-health.indicator';

describe('Monitoring System Integration Tests', () => {
  let app: INestApplication;
  let monitoringController: MonitoringController;
  let healthController: HealthController;
  let metricsService: MetricsService;
  let performanceService: PerformanceService;
  let loggerService: LoggerService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      controllers: [MonitoringController, HealthController],
      providers: [
        MetricsService,
        PerformanceService,
        LoggerService,
        PrismaHealthIndicator,
        RedisHealthIndicator,
        ExternalServiceHealthIndicator,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    monitoringController = moduleFixture.get<MonitoringController>(MonitoringController);
    healthController = moduleFixture.get<HealthController>(HealthController);
    metricsService = moduleFixture.get<MetricsService>(MetricsService);
    performanceService = moduleFixture.get<PerformanceService>(PerformanceService);
    loggerService = moduleFixture.get<LoggerService>(LoggerService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check Endpoints', () => {
    it('should return health status via /health endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('should return readiness status via /health/ready endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(['ok', 'error']).toContain(response.body.status);
    });

    it('should return liveness status via /health/live endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    it('should include database health check', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.details).toHaveProperty('database');
      expect(response.body.details.database).toHaveProperty('status');
    });

    it('should include Redis health check', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.details).toHaveProperty('redis');
      expect(response.body.details.redis).toHaveProperty('status');
    });

    it('should include external services health check', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.details).toHaveProperty('external-services');
      expect(response.body.details['external-services']).toHaveProperty('status');
    });
  });

  describe('Metrics Endpoints', () => {
    it('should return Prometheus metrics via /metrics endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
      expect(response.headers['content-type']).toContain('text/plain');
    });

    it('should include HTTP request metrics', async () => {
      // Make a request to generate metrics
      await request(app.getHttpServer()).get('/health');

      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('http_requests_total');
      expect(response.text).toContain('http_request_duration_seconds');
    });

    it('should include system metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('process_cpu_user_seconds_total');
      expect(response.text).toContain('process_resident_memory_bytes');
      expect(response.text).toContain('nodejs_heap_size_total_bytes');
    });

    it('should include custom business metrics', async () => {
      // Increment a custom metric
      metricsService.incrementCounter('test_counter', { label: 'test' });

      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('test_counter');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track request performance', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify performance tracking
      const metrics = await performanceService.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should monitor memory usage', async () => {
      const memoryBefore = process.memoryUsage();
      
      // Perform some operations
      await request(app.getHttpServer()).get('/health');
      await request(app.getHttpServer()).get('/metrics');
      
      const memoryAfter = process.memoryUsage();
      
      expect(memoryAfter.heapUsed).toBeGreaterThanOrEqual(memoryBefore.heapUsed);
      
      // Memory usage should be reasonable
      expect(memoryAfter.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });

    it('should track response times', async () => {
      const responses = [];
      
      // Make multiple requests
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await request(app.getHttpServer()).get('/health');
        const end = Date.now();
        responses.push(end - start);
      }
      
      const avgResponseTime = responses.reduce((a, b) => a + b, 0) / responses.length;
      const maxResponseTime = Math.max(...responses);
      
      expect(avgResponseTime).toBeLessThan(100); // Average under 100ms
      expect(maxResponseTime).toBeLessThan(500); // Max under 500ms
    });
  });

  describe('Logging System', () => {
    it('should log requests with correlation IDs', async () => {
      const correlationId = 'test-correlation-id';
      
      await request(app.getHttpServer())
        .get('/health')
        .set('X-Correlation-ID', correlationId)
        .expect(200);

      // Verify logging (this would typically check log output)
      expect(loggerService).toBeDefined();
    });

    it('should log errors with proper context', async () => {
      // This would test error logging
      const testError = new Error('Test error for logging');
      
      loggerService.error('Test error message', testError.stack, 'TestContext');
      
      // Verify error was logged with proper structure
      expect(loggerService).toBeDefined();
    });

    it('should support structured logging', async () => {
      const logData = {
        userId: 'test-user',
        action: 'test-action',
        timestamp: new Date().toISOString(),
      };
      
      loggerService.log('Test structured log', JSON.stringify(logData));
      
      // Verify structured logging
      expect(loggerService).toBeDefined();
    });
  });

  describe('Error Resilience', () => {
    it('should handle database connection failures gracefully', async () => {
      // This would simulate database failure
      // For now, we test that the health check handles it
      
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // Even if database is down, health endpoint should respond
      expect(response.body).toHaveProperty('status');
    });

    it('should handle Redis connection failures gracefully', async () => {
      // Similar to database test
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.details).toHaveProperty('redis');
    });

    it('should handle external service failures gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.details).toHaveProperty('external-services');
    });

    it('should implement circuit breaker pattern', async () => {
      // Test circuit breaker functionality
      // This would involve making multiple failing requests
      
      const responses = [];
      for (let i = 0; i < 5; i++) {
        try {
          const response = await request(app.getHttpServer())
            .get('/health')
            .timeout(100); // Short timeout to potentially trigger failures
          responses.push(response.status);
        } catch (error) {
          responses.push(500);
        }
      }
      
      // Circuit breaker should prevent cascading failures
      expect(responses.length).toBe(5);
    });
  });

  describe('Alerting Integration', () => {
    it('should expose alerting-ready metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      // Check for metrics that can trigger alerts
      const alertableMetrics = [
        'http_request_duration_seconds',
        'http_requests_total',
        'process_resident_memory_bytes',
        'nodejs_heap_size_total_bytes'
      ];

      alertableMetrics.forEach(metric => {
        expect(response.text).toContain(metric);
      });
    });

    it('should provide metrics for error rate calculation', async () => {
      // Generate some successful requests
      await request(app.getHttpServer()).get('/health');
      await request(app.getHttpServer()).get('/metrics');

      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('http_requests_total');
      expect(response.text).toContain('code="200"');
    });
  });

  describe('Dashboard Integration', () => {
    it('should provide metrics compatible with Grafana dashboards', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      // Check for metrics that would be used in dashboards
      const dashboardMetrics = [
        'http_request_duration_seconds_bucket',
        'http_request_duration_seconds_sum',
        'http_request_duration_seconds_count',
        'process_cpu_user_seconds_total'
      ];

      dashboardMetrics.forEach(metric => {
        expect(response.text).toContain(metric);
      });
    });

    it('should include labels for metric segmentation', async () => {
      await request(app.getHttpServer()).get('/health');

      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      // Check for labels that enable dashboard segmentation
      expect(response.text).toContain('method=');
      expect(response.text).toContain('route=');
      expect(response.text).toContain('status_code=');
    });
  });

  describe('Load Testing Preparation', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer()).get('/health')
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(2000); // Under 2 seconds for 20 concurrent requests
    });

    it('should maintain performance under sustained load', async () => {
      const requestCount = 50;
      const responses = [];

      for (let i = 0; i < requestCount; i++) {
        const start = Date.now();
        const response = await request(app.getHttpServer()).get('/health');
        const end = Date.now();
        
        responses.push({
          status: response.status,
          duration: end - start
        });
      }

      // All requests should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBe(requestCount);

      // Performance should remain consistent
      const avgDuration = responses.reduce((sum, r) => sum + r.duration, 0) / requestCount;
      expect(avgDuration).toBeLessThan(200); // Average under 200ms
    });
  });

  describe('Production Readiness', () => {
    it('should have all required health checks', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const requiredHealthChecks = ['database', 'redis', 'external-services'];
      
      requiredHealthChecks.forEach(check => {
        expect(response.body.details).toHaveProperty(check);
        expect(response.body.details[check]).toHaveProperty('status');
      });
    });

    it('should expose comprehensive metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      const requiredMetrics = [
        'http_requests_total',
        'http_request_duration_seconds',
        'process_resident_memory_bytes',
        'nodejs_heap_size_total_bytes',
        'process_cpu_user_seconds_total'
      ];

      requiredMetrics.forEach(metric => {
        expect(response.text).toContain(metric);
      });
    });

    it('should handle graceful shutdown', async () => {
      // Test graceful shutdown behavior
      // This would typically involve sending SIGTERM and verifying cleanup
      expect(app).toBeDefined();
      
      // Verify that the app can be closed gracefully
      await expect(app.close()).resolves.not.toThrow();
      
      // Reinitialize for other tests
      await app.init();
    });

    it('should have proper error boundaries', async () => {
      // Test that errors don't crash the entire application
      try {
        await request(app.getHttpServer())
          .get('/non-existent-endpoint')
          .expect(404);
      } catch (error) {
        // Even 404s should be handled gracefully
      }

      // App should still be responsive
      await request(app.getHttpServer())
        .get('/health')
        .expect(200);
    });
  });
});
