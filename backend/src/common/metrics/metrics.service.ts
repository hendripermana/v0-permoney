import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly register: client.Registry;
  
  // HTTP Metrics
  private readonly httpRequestsTotal: client.Counter<string>;
  private readonly httpRequestDuration: client.Histogram<string>;
  private readonly httpRequestsInFlight: client.Gauge<string>;
  
  // Database Metrics
  private readonly databaseConnectionsActive: client.Gauge<string>;
  private readonly databaseQueryDuration: client.Histogram<string>;
  private readonly databaseQueriesTotal: client.Counter<string>;
  
  // Business Metrics
  private readonly transactionsCreated: client.Counter<string>;
  private readonly usersActive: client.Gauge<string>;
  private readonly householdsActive: client.Gauge<string>;
  private readonly accountsTotal: client.Gauge<string>;
  
  // System Metrics
  private readonly memoryUsage: client.Gauge<string>;
  private readonly cpuUsage: client.Gauge<string>;
  private readonly eventLoopLag: client.Histogram<string>;
  
  // Error Metrics
  private readonly errorsTotal: client.Counter<string>;
  private readonly authFailures: client.Counter<string>;
  
  // Performance Metrics
  private readonly cacheHitRate: client.Gauge<string>;
  private readonly backgroundJobsProcessed: client.Counter<string>;
  private readonly backgroundJobDuration: client.Histogram<string>;

  constructor(private configService: ConfigService) {
    this.register = new client.Registry();
    
    // Set default labels
    this.register.setDefaultLabels({
      app: 'permoney-backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: this.configService.get('NODE_ENV', 'development'),
    });

    // Initialize HTTP metrics
    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.register],
    });

    this.httpRequestsInFlight = new client.Gauge({
      name: 'http_requests_in_flight',
      help: 'Number of HTTP requests currently being processed',
      registers: [this.register],
    });

    // Initialize database metrics
    this.databaseConnectionsActive = new client.Gauge({
      name: 'database_connections_active',
      help: 'Number of active database connections',
      registers: [this.register],
    });

    this.databaseQueryDuration = new client.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
      registers: [this.register],
    });

    this.databaseQueriesTotal = new client.Counter({
      name: 'database_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table', 'status'],
      registers: [this.register],
    });

    // Initialize business metrics
    this.transactionsCreated = new client.Counter({
      name: 'transactions_created_total',
      help: 'Total number of financial transactions created',
      labelNames: ['household_id', 'category'],
      registers: [this.register],
    });

    this.usersActive = new client.Gauge({
      name: 'users_active',
      help: 'Number of active users',
      registers: [this.register],
    });

    this.householdsActive = new client.Gauge({
      name: 'households_active',
      help: 'Number of active households',
      registers: [this.register],
    });

    this.accountsTotal = new client.Gauge({
      name: 'accounts_total',
      help: 'Total number of financial accounts',
      labelNames: ['type', 'currency'],
      registers: [this.register],
    });

    // Initialize system metrics
    this.memoryUsage = new client.Gauge({
      name: 'nodejs_memory_usage_bytes',
      help: 'Node.js memory usage in bytes',
      labelNames: ['type'],
      registers: [this.register],
    });

    this.cpuUsage = new client.Gauge({
      name: 'nodejs_cpu_usage_percent',
      help: 'Node.js CPU usage percentage',
      registers: [this.register],
    });

    this.eventLoopLag = new client.Histogram({
      name: 'nodejs_eventloop_lag_seconds',
      help: 'Event loop lag in seconds',
      buckets: [0.001, 0.01, 0.1, 1, 10],
      registers: [this.register],
    });

    // Initialize error metrics
    this.errorsTotal = new client.Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'severity'],
      registers: [this.register],
    });

    this.authFailures = new client.Counter({
      name: 'auth_failures_total',
      help: 'Total number of authentication failures',
      labelNames: ['type', 'reason'],
      registers: [this.register],
    });

    // Initialize performance metrics
    this.cacheHitRate = new client.Gauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate percentage',
      labelNames: ['cache_type'],
      registers: [this.register],
    });

    this.backgroundJobsProcessed = new client.Counter({
      name: 'background_jobs_processed_total',
      help: 'Total number of background jobs processed',
      labelNames: ['job_type', 'status'],
      registers: [this.register],
    });

    this.backgroundJobDuration = new client.Histogram({
      name: 'background_job_duration_seconds',
      help: 'Duration of background jobs in seconds',
      labelNames: ['job_type'],
      buckets: [1, 5, 10, 30, 60, 300, 600],
      registers: [this.register],
    });

    // Collect default metrics
    client.collectDefaultMetrics({ register: this.register });

    // Start system metrics collection
    this.startSystemMetricsCollection();
  }

  // HTTP Metrics Methods
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString() },
      duration / 1000
    );
  }

  incrementHttpRequestsInFlight() {
    this.httpRequestsInFlight.inc();
  }

  decrementHttpRequestsInFlight() {
    this.httpRequestsInFlight.dec();
  }

  // Database Metrics Methods
  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean) {
    this.databaseQueriesTotal.inc({
      operation,
      table,
      status: success ? 'success' : 'error',
    });
    this.databaseQueryDuration.observe({ operation, table }, duration / 1000);
  }

  setDatabaseConnections(count: number) {
    this.databaseConnectionsActive.set(count);
  }

  // Business Metrics Methods
  recordTransactionCreated(householdId: string, category: string) {
    this.transactionsCreated.inc({ household_id: householdId, category });
  }

  setActiveUsers(count: number) {
    this.usersActive.set(count);
  }

  setActiveHouseholds(count: number) {
    this.householdsActive.set(count);
  }

  setAccountsTotal(type: string, currency: string, count: number) {
    this.accountsTotal.set({ type, currency }, count);
  }

  // Error Metrics Methods
  recordError(type: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    this.errorsTotal.inc({ type, severity });
  }

  recordAuthFailure(type: string, reason: string) {
    this.authFailures.inc({ type, reason });
  }

  // Performance Metrics Methods
  setCacheHitRate(cacheType: string, rate: number) {
    this.cacheHitRate.set({ cache_type: cacheType }, rate);
  }

  recordBackgroundJob(jobType: string, duration: number, success: boolean) {
    this.backgroundJobsProcessed.inc({
      job_type: jobType,
      status: success ? 'success' : 'error',
    });
    this.backgroundJobDuration.observe({ job_type: jobType }, duration / 1000);
  }

  // System Metrics Collection
  private startSystemMetricsCollection() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
      this.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
      this.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
      this.memoryUsage.set({ type: 'external' }, memUsage.external);

      const cpuUsage = process.cpuUsage();
      const totalUsage = cpuUsage.user + cpuUsage.system;
      this.cpuUsage.set(totalUsage / 1000000); // Convert to seconds
    }, 5000);

    // Event loop lag measurement
    setInterval(() => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1e9;
        this.eventLoopLag.observe(lag);
      });
    }, 1000);
  }

  // Get metrics for Prometheus scraping
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Get registry for custom metrics
  getRegistry(): client.Registry {
    return this.register;
  }
}
