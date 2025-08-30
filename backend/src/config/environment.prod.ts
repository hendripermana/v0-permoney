export const productionConfig = {
  app: {
    port: Number.parseInt(process.env.BACKEND_PORT || process.env.PORT || "3001", 10),
    environment: "production",
    apiPrefix: process.env.API_PREFIX || "api",
    enableSwagger: false, // Disable Swagger in production
    logLevel: process.env.LOG_LEVEL || "warn", // Less verbose logging in production
  },
  database: {
    url: process.env.DATABASE_URL!,
    maxConnections: Number.parseInt(process.env.DB_MAX_CONNECTIONS || "20", 10), // More connections in production
    connectionTimeout: Number.parseInt(process.env.DB_CONNECTION_TIMEOUT || "30000", 10),
    ssl: {
      rejectUnauthorized: false, // For managed database services
    },
  },
  redis: {
    url: process.env.REDIS_URL!,
    maxRetries: Number.parseInt(process.env.REDIS_MAX_RETRIES || "5", 10), // More retries in production
    retryDelay: Number.parseInt(process.env.REDIS_RETRY_DELAY || "200", 10),
    connectTimeout: 10000,
    lazyConnect: true,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    sessionSecret: process.env.SESSION_SECRET!,
    sessionMaxAge: Number.parseInt(process.env.SESSION_MAX_AGE || "86400000", 10),
    passkeyChallengeTimeout: Number.parseInt(process.env.PASSKEY_CHALLENGE_TIMEOUT || "300000", 10),
  },
  cache: {
    defaultTtl: Number.parseInt(process.env.CACHE_DEFAULT_TTL || "7200", 10), // Longer cache in production
    maxItems: Number.parseInt(process.env.CACHE_MAX_ITEMS || "5000", 10), // More cache items in production
    enableCompression: process.env.CACHE_ENABLE_COMPRESSION === "true",
  },
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(",") || [],
    rateLimitWindow: Number.parseInt(process.env.RATE_LIMIT_WINDOW || "60000", 10),
    rateLimitMax: Number.parseInt(process.env.RATE_LIMIT_MAX || "50", 10), // More restrictive in production
    enableHelmet: process.env.ENABLE_HELMET !== "false",
    enableCsrf: process.env.ENABLE_CSRF !== "false",
    trustProxy: true, // Trust proxy headers in production
  },
  externalServices: {
    exchangeRateApi: {
      url: process.env.EXCHANGE_RATE_API_URL || "https://api.exchangerate-api.com/v4/latest",
      apiKey: process.env.EXCHANGE_RATE_API_KEY || "",
      timeout: Number.parseInt(process.env.EXCHANGE_RATE_API_TIMEOUT || "10000", 10), // Longer timeout in production
    },
    ocrService: {
      url: process.env.OCR_SERVICE_URL || "",
      apiKey: process.env.OCR_SERVICE_API_KEY || "",
      timeout: Number.parseInt(process.env.OCR_SERVICE_TIMEOUT || "60000", 10), // Longer timeout in production
    },
    emailService: {
      provider: process.env.EMAIL_PROVIDER || "sendgrid",
      apiKey: process.env.EMAIL_API_KEY || "",
      fromEmail: process.env.FROM_EMAIL || "noreply@permoney.com",
    },
  },
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS !== "false",
    metricsPort: Number.parseInt(process.env.METRICS_PORT || "9090", 10),
    healthCheckInterval: 30000, // 30 seconds
  },
  logging: {
    level: process.env.LOG_LEVEL || "warn",
    format: process.env.LOG_FORMAT || "json",
    filePath: process.env.LOG_FILE_PATH || "./logs/app.log",
    enableFileLogging: true,
    enableConsoleLogging: true,
    maxFileSize: "10MB",
    maxFiles: 5,
  },
}
