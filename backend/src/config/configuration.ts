export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
}

export interface RedisConfig {
  url: string;
  maxRetries: number;
  retryDelay: number;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  sessionSecret: string;
  sessionMaxAge: number;
  passkeyChallengeTimeout: number;
}

export interface CacheConfig {
  defaultTtl: number;
  maxItems: number;
  enableCompression: boolean;
}

export interface SecurityConfig {
  corsOrigins: string[];
  rateLimitWindow: number;
  rateLimitMax: number;
  enableHelmet: boolean;
  enableCsrf: boolean;
}

export interface AppConfig {
  port: number;
  environment: string;
  apiPrefix: string;
  enableSwagger: boolean;
  logLevel: string;
}

export interface ExternalServicesConfig {
  exchangeRateApi: {
    url: string;
    apiKey: string;
    timeout: number;
  };
  ocrService: {
    url: string;
    apiKey: string;
    timeout: number;
  };
  emailService: {
    provider: string;
    apiKey: string;
    fromEmail: string;
  };
}

export interface Configuration {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  auth: AuthConfig;
  cache: CacheConfig;
  security: SecurityConfig;
  externalServices: ExternalServicesConfig;
}

export default (): Configuration => ({
  app: {
    port: parseInt(process.env.BACKEND_PORT || process.env.PORT || '3001', 10),
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api',
    enableSwagger: process.env.ENABLE_SWAGGER === 'true' || process.env.NODE_ENV === 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/permoney_dev',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    sessionSecret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24 hours
    passkeyChallengeTimeout: parseInt(process.env.PASSKEY_CHALLENGE_TIMEOUT || '300000', 10), // 5 minutes
  },
  cache: {
    defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '3600', 10), // 1 hour
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
    enableCompression: process.env.CACHE_ENABLE_COMPRESSION === 'true',
  },
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:4200',
    ],
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    enableHelmet: process.env.ENABLE_HELMET !== 'false',
    enableCsrf: process.env.ENABLE_CSRF !== 'false',
  },
  externalServices: {
    exchangeRateApi: {
      url: process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest',
      apiKey: process.env.EXCHANGE_RATE_API_KEY || '',
      timeout: parseInt(process.env.EXCHANGE_RATE_API_TIMEOUT || '5000', 10),
    },
    ocrService: {
      url: process.env.OCR_SERVICE_URL || '',
      apiKey: process.env.OCR_SERVICE_API_KEY || '',
      timeout: parseInt(process.env.OCR_SERVICE_TIMEOUT || '30000', 10),
    },
    emailService: {
      provider: process.env.EMAIL_PROVIDER || 'sendgrid',
      apiKey: process.env.EMAIL_API_KEY || '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@permoney.com',
    },
  },
});
