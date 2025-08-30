import { registerAs } from "@nestjs/config"

export default registerAs("production", () => ({
  // Security hardening for production
  security: {
    enableHelmet: process.env.ENABLE_HELMET === "true",
    enableCsrf: process.env.ENABLE_CSRF === "true",
    corsOrigins: process.env.CORS_ORIGINS?.split(",") || [],
    rateLimitWindow: Number.parseInt(process.env.RATE_LIMIT_WINDOW || "60000"),
    rateLimitMax: Number.parseInt(process.env.RATE_LIMIT_MAX || "100"),
    sessionSecure: true,
    cookieSecure: true,
    hstsMaxAge: 31536000, // 1 year
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-eval'"], // Required for some frameworks
        connectSrc: ["'self'", "https:", "wss:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
      },
    },
  },

  // Database optimization for production
  database: {
    ssl: true,
    maxConnections: Number.parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
    connectionTimeout: Number.parseInt(process.env.DB_CONNECTION_TIMEOUT || "30000"),
    idleTimeout: 30000,
    acquireTimeout: 60000,
    createTimeout: 30000,
    destroyTimeout: 5000,
    reapInterval: 1000,
    createRetryInterval: 200,
    propagateCreateError: false,
  },

  // Redis configuration for production
  redis: {
    maxRetriesPerRequest: Number.parseInt(process.env.REDIS_MAX_RETRIES || "3"),
    retryDelayOnFailover: Number.parseInt(process.env.REDIS_RETRY_DELAY || "1000"),
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4,
    connectTimeout: 10000,
    commandTimeout: 5000,
  },

  // Caching strategy for production
  cache: {
    ttl: Number.parseInt(process.env.CACHE_DEFAULT_TTL || "3600"),
    max: Number.parseInt(process.env.CACHE_MAX_ITEMS || "1000"),
    enableCompression: process.env.CACHE_ENABLE_COMPRESSION === "true",
    compressionThreshold: 1024, // Compress responses larger than 1KB
  },

  // Logging configuration for production
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: process.env.LOG_FORMAT || "json",
    filePath: process.env.LOG_FILE_PATH || "./logs/app.log",
    enableFileLogging: true,
    enableConsoleLogging: false,
    maxFiles: 10,
    maxSize: "10m",
    enableErrorStack: false, // Don't expose stack traces in production
  },

  // Performance optimizations
  performance: {
    enableCompression: true,
    compressionLevel: 6,
    compressionThreshold: 1024,
    enableEtag: true,
    enableLastModified: true,
    maxRequestSize: "10mb",
    maxParameterLimit: 1000,
  },

  // Monitoring and health checks
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === "true",
    metricsPort: Number.parseInt(process.env.METRICS_PORT || "9090"),
    healthCheckInterval: 30000,
    enableDetailedHealthCheck: false, // Don't expose internal details
  },

  // External service timeouts
  externalServices: {
    defaultTimeout: 10000,
    exchangeRateTimeout: Number.parseInt(process.env.EXCHANGE_RATE_API_TIMEOUT || "5000"),
    ocrTimeout: Number.parseInt(process.env.OCR_SERVICE_TIMEOUT || "30000"),
    emailTimeout: 15000,
  },
}))
