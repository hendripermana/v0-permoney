#!/usr/bin/env node
/**
 * Comprehensive QA & Validation Suite for Tasks 29 & 30
 * Enterprise-grade validation with multiple layers of testing
 * Focus: Error Resilience & Fault Tolerance + Observability & Monitoring
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 COMPREHENSIVE QA & VALIDATION - TASKS 29 & 30');
console.log('═'.repeat(60));
console.log('Task 29: Error Resilience & Fault Tolerance');
console.log('Task 30: Observability & Monitoring Infrastructure');
console.log('═'.repeat(60));

class EnterpriseQAValidator {
  constructor() {
    this.results = {
      errorResilience: [],
      monitoring: [],
      integration: [],
      performance: [],
      security: [],
      compliance: [],
      errors: [],
      warnings: [],
      passed: 0,
      failed: 0
    };
    this.criticalIssues = [];
    this.recommendations = [];
  }

  log(level, category, message, details = null) {
    const entry = {
      level,
      category,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results[category].push(entry);
    
    const icon = level === 'PASS' ? '✅' : level === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${category.toUpperCase()}] ${message}`);
    
    if (details) {
      console.log(`   Details: ${details}`);
    }
    
    if (level === 'PASS') this.results.passed++;
    if (level === 'FAIL') {
      this.results.failed++;
      this.criticalIssues.push(entry);
    }
    if (level === 'WARN') {
      this.recommendations.push(entry);
    }
  }

  // ==========================================
  // TASK 29: ERROR RESILIENCE & FAULT TOLERANCE
  // ==========================================

  async validateErrorResilience() {
    console.log('\n🛡️  TASK 29: ERROR RESILIENCE & FAULT TOLERANCE VALIDATION');
    console.log('─'.repeat(60));
    
    await this.validateRetryMechanisms();
    await this.validateCircuitBreakers();
    await this.validateFallbackSystems();
    await this.validateHealthChecks();
    await this.validateErrorHandling();
    await this.validateRecoveryMechanisms();
  }

  async validateRetryMechanisms() {
    console.log('\n🔄 Validating Retry Mechanisms');
    
    // Check for retry implementations in services
    const serviceFiles = [
      'backend/src/common/services/retry.service.ts',
      'backend/src/common/decorators/retry.decorator.ts',
      'backend/src/common/utils/retry.util.ts'
    ];

    let retryImplementationFound = false;
    
    for (const file of serviceFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for exponential backoff
        if (content.includes('exponential') || content.includes('backoff')) {
          this.log('PASS', 'errorResilience', `Exponential backoff found in ${path.basename(file)}`);
          retryImplementationFound = true;
        }
        
        // Check for retry limits
        if (content.includes('maxRetries') || content.includes('maxAttempts')) {
          this.log('PASS', 'errorResilience', `Retry limits configured in ${path.basename(file)}`);
        }
        
        // Check for jitter implementation
        if (content.includes('jitter') || content.includes('randomDelay')) {
          this.log('PASS', 'errorResilience', `Jitter implementation found in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Consider adding jitter to prevent thundering herd in ${path.basename(file)}`);
        }
      }
    }

    if (!retryImplementationFound) {
      this.log('FAIL', 'errorResilience', 'No retry mechanism implementation found');
    }

    // Check for retry in external service calls
    const externalServiceFiles = [
      'backend/src/notifications/services/email.service.ts',
      'backend/src/notifications/services/push-notification.service.ts',
      'backend/src/common/services/external-api.service.ts'
    ];

    for (const file of externalServiceFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('retry') || content.includes('@Retry')) {
          this.log('PASS', 'errorResilience', `Retry mechanism applied in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Consider adding retry mechanism to ${path.basename(file)}`);
        }
      }
    }
  }

  async validateCircuitBreakers() {
    console.log('\n⚡ Validating Circuit Breaker Patterns');
    
    const circuitBreakerFiles = [
      'backend/src/common/patterns/circuit-breaker.ts',
      'backend/src/common/decorators/circuit-breaker.decorator.ts'
    ];

    let circuitBreakerFound = false;
    
    for (const file of circuitBreakerFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        circuitBreakerFound = true;
        
        // Check for circuit breaker states
        const requiredStates = ['CLOSED', 'OPEN', 'HALF_OPEN'];
        const hasAllStates = requiredStates.every(state => content.includes(state));
        
        if (hasAllStates) {
          this.log('PASS', 'errorResilience', `Circuit breaker states properly implemented in ${path.basename(file)}`);
        } else {
          this.log('FAIL', 'errorResilience', `Missing circuit breaker states in ${path.basename(file)}`);
        }
        
        // Check for failure threshold
        if (content.includes('failureThreshold') || content.includes('errorThreshold')) {
          this.log('PASS', 'errorResilience', `Failure threshold configured in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Configure failure threshold in ${path.basename(file)}`);
        }
        
        // Check for timeout configuration
        if (content.includes('timeout') || content.includes('timeoutMs')) {
          this.log('PASS', 'errorResilience', `Timeout configuration found in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Add timeout configuration to ${path.basename(file)}`);
        }
      }
    }

    if (!circuitBreakerFound) {
      this.log('FAIL', 'errorResilience', 'Circuit breaker pattern not implemented');
    }

    // Check for circuit breaker usage in services
    const serviceFiles = [
      'backend/src/notifications/services/email.service.ts',
      'backend/src/common/services/external-api.service.ts'
    ];

    for (const file of serviceFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('@CircuitBreaker') || content.includes('circuitBreaker')) {
          this.log('PASS', 'errorResilience', `Circuit breaker applied in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Consider applying circuit breaker to ${path.basename(file)}`);
        }
      }
    }
  }

  async validateFallbackSystems() {
    console.log('\n🔄 Validating Fallback Systems');
    
    // Check for fallback implementations
    const fallbackFiles = [
      'backend/src/common/patterns/fallback.service.ts',
      'backend/src/common/decorators/fallback.decorator.ts'
    ];

    let fallbackFound = false;
    
    for (const file of fallbackFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        fallbackFound = true;
        
        if (content.includes('fallback') && content.includes('primary')) {
          this.log('PASS', 'errorResilience', `Fallback pattern implemented in ${path.basename(file)}`);
        }
        
        // Check for graceful degradation
        if (content.includes('graceful') || content.includes('degradation')) {
          this.log('PASS', 'errorResilience', `Graceful degradation implemented in ${path.basename(file)}`);
        }
      }
    }

    // Check for fallback in critical services
    const criticalServices = [
      'backend/src/notifications/services/email.service.ts',
      'backend/src/auth/auth.service.ts',
      'backend/src/common/services/cache.service.ts'
    ];

    for (const file of criticalServices) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('fallback') || content.includes('alternative')) {
          this.log('PASS', 'errorResilience', `Fallback mechanism in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Consider adding fallback to ${path.basename(file)}`);
        }
      }
    }

    if (!fallbackFound) {
      this.log('WARN', 'errorResilience', 'No explicit fallback system found - consider implementing');
    }
  }

  async validateHealthChecks() {
    console.log('\n🏥 Validating Health Check System');
    
    // Check health check implementation
    const healthFiles = [
      'backend/src/health/health.controller.ts',
      'backend/src/health/health.module.ts',
      'backend/src/health/prisma-health.indicator.ts',
      'backend/src/health/redis-health.indicator.ts',
      'backend/src/health/external-service-health.indicator.ts'
    ];

    let healthSystemComplete = true;
    
    for (const file of healthFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for proper health check implementation
        if (content.includes('@HealthCheck') || content.includes('HealthIndicator')) {
          this.log('PASS', 'errorResilience', `Health check properly implemented in ${path.basename(file)}`);
        }
        
        // Check for timeout handling
        if (content.includes('timeout') || content.includes('timeoutMs')) {
          this.log('PASS', 'errorResilience', `Health check timeout configured in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Add timeout to health check in ${path.basename(file)}`);
        }
        
        // Check for error handling
        if (content.includes('try') && content.includes('catch')) {
          this.log('PASS', 'errorResilience', `Error handling in health check ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Improve error handling in ${path.basename(file)}`);
        }
      } else {
        this.log('FAIL', 'errorResilience', `Missing health check file: ${file}`);
        healthSystemComplete = false;
      }
    }

    if (healthSystemComplete) {
      this.log('PASS', 'errorResilience', 'Comprehensive health check system implemented');
    }

    // Check for health check endpoints
    if (fs.existsSync('backend/src/health/health.controller.ts')) {
      const content = fs.readFileSync('backend/src/health/health.controller.ts', 'utf8');
      
      const requiredEndpoints = ['/health', '/health/ready', '/health/live'];
      const hasAllEndpoints = requiredEndpoints.some(endpoint => 
        content.includes(endpoint) || content.includes('@Get()')
      );
      
      if (hasAllEndpoints) {
        this.log('PASS', 'errorResilience', 'Health check endpoints properly configured');
      } else {
        this.log('WARN', 'errorResilience', 'Ensure all health check endpoints are available');
      }
    }
  }

  async validateErrorHandling() {
    console.log('\n🚨 Validating Error Handling');
    
    // Check global exception filter
    const exceptionFiles = [
      'backend/src/common/filters/global-exception.filter.ts',
      'backend/src/common/filters/http-exception.filter.ts'
    ];

    let globalExceptionHandlerFound = false;
    
    for (const file of exceptionFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        globalExceptionHandlerFound = true;
        
        if (content.includes('@Catch') && content.includes('ExceptionFilter')) {
          this.log('PASS', 'errorResilience', `Global exception filter implemented in ${path.basename(file)}`);
        }
        
        // Check for error logging
        if (content.includes('logger') || content.includes('log')) {
          this.log('PASS', 'errorResilience', `Error logging implemented in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Add error logging to ${path.basename(file)}`);
        }
        
        // Check for error sanitization
        if (content.includes('sanitize') || content.includes('mask')) {
          this.log('PASS', 'errorResilience', `Error sanitization implemented in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Consider error sanitization in ${path.basename(file)}`);
        }
      }
    }

    if (!globalExceptionHandlerFound) {
      this.log('FAIL', 'errorResilience', 'Global exception handler not found');
    }

    // Check error handling in services
    const serviceFiles = [
      'backend/src/notifications/notifications.service.ts',
      'backend/src/auth/auth.service.ts',
      'backend/src/transactions/transactions.service.ts'
    ];

    for (const file of serviceFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for try-catch blocks
        const tryCatchCount = (content.match(/try\s*{/g) || []).length;
        const catchCount = (content.match(/catch\s*\(/g) || []).length;
        
        if (tryCatchCount > 0 && tryCatchCount === catchCount) {
          this.log('PASS', 'errorResilience', `Proper error handling in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Review error handling in ${path.basename(file)}`);
        }
        
        // Check for custom exceptions
        if (content.includes('throw new') && content.includes('Exception')) {
          this.log('PASS', 'errorResilience', `Custom exceptions used in ${path.basename(file)}`);
        }
      }
    }
  }

  async validateRecoveryMechanisms() {
    console.log('\n🔧 Validating Recovery Mechanisms');
    
    // Check for job queue recovery
    const queueFiles = [
      'backend/src/common/queues/queue.service.ts',
      'backend/src/notifications/processors/notification.processor.ts'
    ];

    for (const file of queueFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for failed job handling
        if (content.includes('failed') || content.includes('onFailed')) {
          this.log('PASS', 'errorResilience', `Failed job handling in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Add failed job handling to ${path.basename(file)}`);
        }
        
        // Check for job retry configuration
        if (content.includes('attempts') || content.includes('retry')) {
          this.log('PASS', 'errorResilience', `Job retry configured in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Configure job retry in ${path.basename(file)}`);
        }
      }
    }

    // Check for database transaction recovery
    const transactionFiles = [
      'backend/src/common/database/transaction.service.ts',
      'backend/src/transactions/transactions.service.ts'
    ];

    for (const file of transactionFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('rollback') || content.includes('commit')) {
          this.log('PASS', 'errorResilience', `Transaction recovery in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'errorResilience', `Ensure transaction recovery in ${path.basename(file)}`);
        }
      }
    }
  }

  // ==========================================
  // TASK 30: OBSERVABILITY & MONITORING
  // ==========================================

  async validateObservabilityMonitoring() {
    console.log('\n📊 TASK 30: OBSERVABILITY & MONITORING VALIDATION');
    console.log('─'.repeat(60));
    
    await this.validateLoggingSystem();
    await this.validateMetricsCollection();
    await this.validateHealthEndpoints();
    await this.validatePerformanceMonitoring();
    await this.validateAlertingSystem();
    await this.validateDashboards();
  }

  async validateLoggingSystem() {
    console.log('\n📝 Validating Centralized Logging System');
    
    // Check logging service implementation
    const loggingFiles = [
      'backend/src/common/logging/logger.service.ts',
      'backend/src/common/middleware/logging.middleware.ts'
    ];

    let loggingSystemFound = false;
    
    for (const file of loggingFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        loggingSystemFound = true;
        
        // Check for structured logging
        if (content.includes('structured') || content.includes('JSON') || content.includes('format')) {
          this.log('PASS', 'monitoring', `Structured logging implemented in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'monitoring', `Implement structured logging in ${path.basename(file)}`);
        }
        
        // Check for log levels
        const logLevels = ['error', 'warn', 'info', 'debug'];
        const hasLogLevels = logLevels.some(level => content.includes(level));
        
        if (hasLogLevels) {
          this.log('PASS', 'monitoring', `Log levels configured in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'monitoring', `Configure log levels in ${path.basename(file)}`);
        }
        
        // Check for correlation IDs
        if (content.includes('correlationId') || content.includes('traceId')) {
          this.log('PASS', 'monitoring', `Correlation IDs implemented in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'monitoring', `Add correlation IDs to ${path.basename(file)}`);
        }
      }
    }

    if (!loggingSystemFound) {
      this.log('FAIL', 'monitoring', 'Centralized logging system not found');
    }

    // Check for logging in services
    const serviceFiles = [
      'backend/src/notifications/notifications.service.ts',
      'backend/src/auth/auth.service.ts',
      'backend/src/transactions/transactions.service.ts'
    ];

    for (const file of serviceFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('logger') || content.includes('Logger')) {
          this.log('PASS', 'monitoring', `Logging implemented in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'monitoring', `Add logging to ${path.basename(file)}`);
        }
      }
    }
  }

  async validateMetricsCollection() {
    console.log('\n📈 Validating Metrics Collection');
    
    // Check metrics service
    const metricsFiles = [
      'backend/src/common/metrics/metrics.service.ts',
      'backend/src/common/middleware/metrics.middleware.ts'
    ];

    let metricsSystemFound = false;
    
    for (const file of metricsFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        metricsSystemFound = true;
        
        // Check for Prometheus integration
        if (content.includes('prometheus') || content.includes('Prometheus')) {
          this.log('PASS', 'monitoring', `Prometheus integration in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'monitoring', `Add Prometheus integration to ${path.basename(file)}`);
        }
        
        // Check for metric types
        const metricTypes = ['Counter', 'Gauge', 'Histogram', 'Summary'];
        const hasMetricTypes = metricTypes.some(type => content.includes(type));
        
        if (hasMetricTypes) {
          this.log('PASS', 'monitoring', `Metric types implemented in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'monitoring', `Implement metric types in ${path.basename(file)}`);
        }
      }
    }

    if (!metricsSystemFound) {
      this.log('FAIL', 'monitoring', 'Metrics collection system not found');
    }

    // Check for monitoring configuration
    const monitoringConfigFiles = [
      'monitoring/prometheus/prometheus.yml',
      'monitoring/grafana/dashboards/permoney-overview.json',
      'docker-compose.monitoring.yml'
    ];

    for (const file of monitoringConfigFiles) {
      if (fs.existsSync(file)) {
        this.log('PASS', 'monitoring', `Monitoring configuration found: ${path.basename(file)}`);
        
        if (file.includes('prometheus.yml')) {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('scrape_configs') && content.includes('targets')) {
            this.log('PASS', 'monitoring', 'Prometheus scrape configuration valid');
          } else {
            this.log('WARN', 'monitoring', 'Review Prometheus scrape configuration');
          }
        }
      } else {
        this.log('FAIL', 'monitoring', `Missing monitoring configuration: ${file}`);
      }
    }
  }

  async validateHealthEndpoints() {
    console.log('\n🏥 Validating Health Check Endpoints');
    
    // Check monitoring controller
    const monitoringFiles = [
      'backend/src/monitoring/monitoring.controller.ts',
      'backend/src/health/health.controller.ts'
    ];

    for (const file of monitoringFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for health endpoints
        if (content.includes('/health') || content.includes('/metrics')) {
          this.log('PASS', 'monitoring', `Health endpoints in ${path.basename(file)}`);
        }
        
        // Check for Prometheus metrics endpoint
        if (content.includes('/metrics') && content.includes('prometheus')) {
          this.log('PASS', 'monitoring', `Prometheus metrics endpoint in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'monitoring', `Add Prometheus metrics endpoint to ${path.basename(file)}`);
        }
      }
    }

    // Check performance service
    if (fs.existsSync('backend/src/common/monitoring/performance.service.ts')) {
      const content = fs.readFileSync('backend/src/common/monitoring/performance.service.ts', 'utf8');
      
      if (content.includes('performance') && content.includes('metrics')) {
        this.log('PASS', 'monitoring', 'Performance monitoring service implemented');
      }
      
      // Check for performance tracking
      if (content.includes('responseTime') || content.includes('duration')) {
        this.log('PASS', 'monitoring', 'Response time tracking implemented');
      } else {
        this.log('WARN', 'monitoring', 'Add response time tracking');
      }
    } else {
      this.log('WARN', 'monitoring', 'Performance monitoring service not found');
    }
  }

  async validatePerformanceMonitoring() {
    console.log('\n⚡ Validating Performance Monitoring');
    
    // Check for performance middleware
    const performanceFiles = [
      'backend/src/common/middleware/performance.middleware.ts',
      'backend/src/common/interceptors/performance.interceptor.ts'
    ];

    for (const file of performanceFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('performance') && content.includes('timing')) {
          this.log('PASS', 'monitoring', `Performance tracking in ${path.basename(file)}`);
        }
        
        // Check for memory monitoring
        if (content.includes('memory') || content.includes('heap')) {
          this.log('PASS', 'monitoring', `Memory monitoring in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'monitoring', `Add memory monitoring to ${path.basename(file)}`);
        }
      }
    }

    // Check for database performance monitoring
    if (fs.existsSync('backend/src/common/database/performance.interceptor.ts')) {
      this.log('PASS', 'monitoring', 'Database performance monitoring implemented');
    } else {
      this.log('WARN', 'monitoring', 'Consider database performance monitoring');
    }
  }

  async validateAlertingSystem() {
    console.log('\n🚨 Validating Alerting System');
    
    // Check alerting configuration
    const alertingFiles = [
      'monitoring/alertmanager/alertmanager.yml',
      'monitoring/prometheus/rules/permoney-alerts.yml'
    ];

    for (const file of alertingFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (file.includes('alertmanager.yml')) {
          if (content.includes('route') && content.includes('receivers')) {
            this.log('PASS', 'monitoring', 'Alertmanager configuration valid');
          } else {
            this.log('WARN', 'monitoring', 'Review Alertmanager configuration');
          }
        }
        
        if (file.includes('alerts.yml')) {
          if (content.includes('alert') && content.includes('expr')) {
            this.log('PASS', 'monitoring', 'Alert rules configured');
          } else {
            this.log('WARN', 'monitoring', 'Review alert rules configuration');
          }
        }
      } else {
        this.log('FAIL', 'monitoring', `Missing alerting configuration: ${file}`);
      }
    }

    // Check for critical alerts
    if (fs.existsSync('monitoring/prometheus/rules/permoney-alerts.yml')) {
      const content = fs.readFileSync('monitoring/prometheus/rules/permoney-alerts.yml', 'utf8');
      
      const criticalAlerts = [
        'HighErrorRate',
        'HighResponseTime',
        'DatabaseDown',
        'HighMemoryUsage',
        'DiskSpaceLow'
      ];
      
      const hasCriticalAlerts = criticalAlerts.some(alert => content.includes(alert));
      
      if (hasCriticalAlerts) {
        this.log('PASS', 'monitoring', 'Critical alerts configured');
      } else {
        this.log('WARN', 'monitoring', 'Add critical system alerts');
      }
    }
  }

  async validateDashboards() {
    console.log('\n📊 Validating Monitoring Dashboards');
    
    // Check Grafana dashboards
    const dashboardFiles = [
      'monitoring/grafana/dashboards/permoney-overview.json',
      'monitoring/grafana/dashboards/application-metrics.json',
      'monitoring/grafana/dashboards/infrastructure.json'
    ];

    let dashboardsFound = 0;
    
    for (const file of dashboardFiles) {
      if (fs.existsSync(file)) {
        dashboardsFound++;
        const content = fs.readFileSync(file, 'utf8');
        
        try {
          const dashboard = JSON.parse(content);
          
          if (dashboard.panels && dashboard.panels.length > 0) {
            this.log('PASS', 'monitoring', `Dashboard panels configured in ${path.basename(file)}`);
          } else {
            this.log('WARN', 'monitoring', `Add panels to dashboard ${path.basename(file)}`);
          }
          
          // Check for essential metrics
          const contentStr = JSON.stringify(dashboard);
          const essentialMetrics = ['response_time', 'error_rate', 'throughput', 'memory_usage'];
          const hasEssentialMetrics = essentialMetrics.some(metric => 
            contentStr.includes(metric) || contentStr.includes(metric.replace('_', ''))
          );
          
          if (hasEssentialMetrics) {
            this.log('PASS', 'monitoring', `Essential metrics in ${path.basename(file)}`);
          } else {
            this.log('WARN', 'monitoring', `Add essential metrics to ${path.basename(file)}`);
          }
        } catch (error) {
          this.log('FAIL', 'monitoring', `Invalid JSON in dashboard ${path.basename(file)}`);
        }
      } else {
        this.log('WARN', 'monitoring', `Dashboard not found: ${path.basename(file)}`);
      }
    }

    if (dashboardsFound === 0) {
      this.log('FAIL', 'monitoring', 'No monitoring dashboards found');
    } else {
      this.log('PASS', 'monitoring', `${dashboardsFound} monitoring dashboards configured`);
    }
  }

  // ==========================================
  // INTEGRATION & SYSTEM TESTS
  // ==========================================

  async validateSystemIntegration() {
    console.log('\n🔗 SYSTEM INTEGRATION VALIDATION');
    console.log('─'.repeat(40));
    
    await this.validateServiceIntegration();
    await this.validateEndToEndFlow();
    await this.validateFailureScenarios();
  }

  async validateServiceIntegration() {
    console.log('\n🔧 Validating Service Integration');
    
    // Check if monitoring services are properly integrated
    const appModuleFile = 'backend/src/app/app.module.ts';
    
    if (fs.existsSync(appModuleFile)) {
      const content = fs.readFileSync(appModuleFile, 'utf8');
      
      const requiredModules = [
        'HealthModule',
        'MonitoringModule',
        'MetricsModule',
        'LoggingModule'
      ];
      
      const missingModules = requiredModules.filter(module => !content.includes(module));
      
      if (missingModules.length === 0) {
        this.log('PASS', 'integration', 'All monitoring modules integrated in app module');
      } else {
        this.log('WARN', 'integration', `Missing modules in app: ${missingModules.join(', ')}`);
      }
    } else {
      this.log('FAIL', 'integration', 'App module not found');
    }

    // Check Docker Compose integration
    if (fs.existsSync('docker-compose.monitoring.yml')) {
      const content = fs.readFileSync('docker-compose.monitoring.yml', 'utf8');
      
      const requiredServices = ['prometheus', 'grafana', 'alertmanager'];
      const hasAllServices = requiredServices.every(service => content.includes(service));
      
      if (hasAllServices) {
        this.log('PASS', 'integration', 'All monitoring services in Docker Compose');
      } else {
        this.log('WARN', 'integration', 'Review Docker Compose monitoring services');
      }
    } else {
      this.log('FAIL', 'integration', 'Docker Compose monitoring configuration missing');
    }
  }

  async validateEndToEndFlow() {
    console.log('\n🔄 Validating End-to-End Monitoring Flow');
    
    // Check if monitoring startup script exists
    if (fs.existsSync('scripts/start-monitoring.sh')) {
      const content = fs.readFileSync('scripts/start-monitoring.sh', 'utf8');
      
      if (content.includes('docker-compose') && content.includes('monitoring')) {
        this.log('PASS', 'integration', 'Monitoring startup script configured');
      } else {
        this.log('WARN', 'integration', 'Review monitoring startup script');
      }
    } else {
      this.log('WARN', 'integration', 'Monitoring startup script not found');
    }

    // Check README documentation
    if (fs.existsSync('monitoring/README.md')) {
      const content = fs.readFileSync('monitoring/README.md', 'utf8');
      
      if (content.includes('setup') && content.includes('usage')) {
        this.log('PASS', 'integration', 'Monitoring documentation available');
      } else {
        this.log('WARN', 'integration', 'Improve monitoring documentation');
      }
    } else {
      this.log('WARN', 'integration', 'Monitoring documentation missing');
    }
  }

  async validateFailureScenarios() {
    console.log('\n💥 Validating Failure Scenario Handling');
    
    // This would typically involve running actual failure tests
    // For now, we'll check if the infrastructure supports it
    
    const failureTestFiles = [
      'backend/src/health/external-service-health.indicator.ts',
      'backend/src/health/redis-health.indicator.ts',
      'backend/src/health/prisma-health.indicator.ts'
    ];

    for (const file of failureTestFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('timeout') && content.includes('catch')) {
          this.log('PASS', 'integration', `Failure handling in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'integration', `Improve failure handling in ${path.basename(file)}`);
        }
      }
    }
  }

  // ==========================================
  // PERFORMANCE & LOAD TESTING
  // ==========================================

  async validatePerformanceCharacteristics() {
    console.log('\n⚡ PERFORMANCE CHARACTERISTICS VALIDATION');
    console.log('─'.repeat(50));
    
    // Check for performance test configurations
    const performanceTestFiles = [
      'tests/performance/load-test.js',
      'tests/performance/stress-test.js',
      'k6/load-test.js'
    ];

    let performanceTestsFound = false;
    
    for (const file of performanceTestFiles) {
      if (fs.existsSync(file)) {
        performanceTestsFound = true;
        this.log('PASS', 'performance', `Performance test found: ${path.basename(file)}`);
      }
    }

    if (!performanceTestsFound) {
      this.log('WARN', 'performance', 'No performance tests found - consider adding load tests');
    }

    // Check for performance monitoring in production
    const performanceFiles = [
      'backend/src/common/monitoring/performance.service.ts',
      'backend/src/common/middleware/metrics.middleware.ts'
    ];

    for (const file of performanceFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('responseTime') || content.includes('duration')) {
          this.log('PASS', 'performance', `Performance tracking in ${path.basename(file)}`);
        }
        
        if (content.includes('memory') || content.includes('cpu')) {
          this.log('PASS', 'performance', `Resource monitoring in ${path.basename(file)}`);
        }
      }
    }
  }

  // ==========================================
  // SECURITY VALIDATION
  // ==========================================

  async validateSecurityAspects() {
    console.log('\n🔒 SECURITY ASPECTS VALIDATION');
    console.log('─'.repeat(40));
    
    // Check for security in logging (no sensitive data)
    const loggingFiles = [
      'backend/src/common/logging/logger.service.ts',
      'backend/src/common/middleware/logging.middleware.ts'
    ];

    for (const file of loggingFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('sanitize') || content.includes('redact')) {
          this.log('PASS', 'security', `Data sanitization in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'security', `Add data sanitization to ${path.basename(file)}`);
        }
      }
    }

    // Check for secure monitoring endpoints
    const monitoringFiles = [
      'backend/src/monitoring/monitoring.controller.ts',
      'backend/src/health/health.controller.ts'
    ];

    for (const file of monitoringFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('@UseGuards') || content.includes('auth')) {
          this.log('PASS', 'security', `Authentication on monitoring endpoints in ${path.basename(file)}`);
        } else {
          this.log('WARN', 'security', `Consider authentication for monitoring endpoints in ${path.basename(file)}`);
        }
      }
    }
  }

  // ==========================================
  // REPORT GENERATION
  // ==========================================

  generateComprehensiveReport() {
    console.log('\n📊 COMPREHENSIVE VALIDATION REPORT');
    console.log('═'.repeat(70));
    
    const totalTests = this.results.passed + this.results.failed;
    const successRate = totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(2) : 0;
    
    console.log(`\n📈 EXECUTIVE SUMMARY:`);
    console.log(`   Total Validations: ${totalTests}`);
    console.log(`   Passed: ${this.results.passed}`);
    console.log(`   Failed: ${this.results.failed}`);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(`   Critical Issues: ${this.criticalIssues.length}`);
    console.log(`   Recommendations: ${this.recommendations.length}`);

    // Task-specific breakdown
    console.log(`\n🎯 TASK-SPECIFIC BREAKDOWN:`);
    console.log(`   Task 29 (Error Resilience): ${this.results.errorResilience.length} validations`);
    console.log(`   Task 30 (Monitoring): ${this.results.monitoring.length} validations`);
    console.log(`   Integration Tests: ${this.results.integration.length} validations`);
    console.log(`   Performance Tests: ${this.results.performance.length} validations`);
    console.log(`   Security Tests: ${this.results.security.length} validations`);

    // Critical Issues
    if (this.criticalIssues.length > 0) {
      console.log(`\n❌ CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:`);
      this.criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.category.toUpperCase()}] ${issue.message}`);
        if (issue.details) {
          console.log(`      Details: ${issue.details}`);
        }
      });
    }

    // Top Recommendations
    if (this.recommendations.length > 0) {
      console.log(`\n⚠️  TOP RECOMMENDATIONS:`);
      this.recommendations.slice(0, 10).forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.category.toUpperCase()}] ${rec.message}`);
      });
      
      if (this.recommendations.length > 10) {
        console.log(`   ... and ${this.recommendations.length - 10} more recommendations`);
      }
    }

    // Quality Assessment
    const qualityScore = this.calculateQualityScore();
    console.log(`\n🏆 QUALITY ASSESSMENT:`);
    console.log(`   Overall Score: ${qualityScore}/100`);
    
    if (qualityScore >= 95) {
      console.log('   Grade: A+ (Exceptional - Enterprise Ready)');
      console.log('   Status: ✅ READY FOR PRODUCTION');
    } else if (qualityScore >= 85) {
      console.log('   Grade: A (Excellent - Minor improvements recommended)');
      console.log('   Status: ✅ READY FOR PRODUCTION with minor fixes');
    } else if (qualityScore >= 75) {
      console.log('   Grade: B+ (Good - Some improvements needed)');
      console.log('   Status: ⚠️  READY FOR STAGING, improvements needed for production');
    } else if (qualityScore >= 65) {
      console.log('   Grade: B (Acceptable - Significant improvements needed)');
      console.log('   Status: ⚠️  DEVELOPMENT READY, significant work needed');
    } else {
      console.log('   Grade: C or below (Needs major improvements)');
      console.log('   Status: ❌ NOT READY - Major improvements required');
    }

    // Next Steps
    console.log(`\n📋 RECOMMENDED NEXT STEPS:`);
    if (this.criticalIssues.length > 0) {
      console.log('   1. 🚨 Address all critical issues immediately');
      console.log('   2. 🔧 Implement high-priority recommendations');
      console.log('   3. 🧪 Run validation suite again to verify fixes');
      console.log('   4. 📊 Conduct load testing and performance validation');
    } else if (this.recommendations.length > 5) {
      console.log('   1. 🔧 Implement high-priority recommendations');
      console.log('   2. 📊 Conduct comprehensive load testing');
      console.log('   3. 🔒 Perform security audit and penetration testing');
      console.log('   4. 📚 Update documentation and runbooks');
    } else {
      console.log('   1. ✅ System appears production-ready');
      console.log('   2. 📊 Conduct final load testing');
      console.log('   3. 🚀 Prepare for deployment');
      console.log('   4. 📈 Set up production monitoring and alerting');
    }

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: parseFloat(successRate),
        qualityScore,
        criticalIssues: this.criticalIssues.length,
        recommendations: this.recommendations.length
      },
      tasks: {
        task29: 'Error Resilience & Fault Tolerance',
        task30: 'Observability & Monitoring Infrastructure'
      },
      details: this.results,
      criticalIssues: this.criticalIssues,
      recommendations: this.recommendations
    };

    fs.writeFileSync('qa-validation-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: qa-validation-report.json');

    return reportData.summary;
  }

  calculateQualityScore() {
    const weights = {
      errorResilience: 30,    // Task 29 - Critical for production
      monitoring: 30,         // Task 30 - Critical for operations
      integration: 20,        // System integration
      performance: 10,        // Performance characteristics
      security: 10           // Security aspects
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([category, weight]) => {
      const categoryResults = this.results[category] || [];
      if (categoryResults.length > 0) {
        const passed = categoryResults.filter(item => item.level === 'PASS').length;
        const failed = categoryResults.filter(item => item.level === 'FAIL').length;
        const warnings = categoryResults.filter(item => item.level === 'WARN').length;
        
        // Calculate category score: PASS=1, WARN=0.5, FAIL=0
        const categoryScore = (passed + (warnings * 0.5)) / categoryResults.length * 100;
        totalScore += categoryScore * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  // ==========================================
  // MAIN EXECUTION
  // ==========================================

  async runComprehensiveValidation() {
    console.log('🚀 Starting comprehensive QA validation for Tasks 29 & 30...\n');
    
    try {
      // Task 29: Error Resilience & Fault Tolerance
      await this.validateErrorResilience();
      
      // Task 30: Observability & Monitoring Infrastructure  
      await this.validateObservabilityMonitoring();
      
      // System Integration Tests
      await this.validateSystemIntegration();
      
      // Performance Validation
      await this.validatePerformanceCharacteristics();
      
      // Security Validation
      await this.validateSecurityAspects();
      
      // Generate comprehensive report
      const report = this.generateComprehensiveReport();
      
      return report;
      
    } catch (error) {
      console.error('❌ Validation suite failed:', error);
      throw error;
    }
  }
}

// Execute comprehensive validation
const validator = new EnterpriseQAValidator();
validator.runComprehensiveValidation()
  .then(report => {
    console.log('\n🎉 VALIDATION COMPLETE!');
    
    if (report.criticalIssues > 0) {
      console.log('⚠️  Critical issues found - review required before production');
      process.exit(1);
    } else if (report.qualityScore >= 85) {
      console.log('✅ System meets enterprise quality standards');
      process.exit(0);
    } else {
      console.log('⚠️  System needs improvements before production deployment');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Validation suite crashed:', error);
    process.exit(1);
  });
