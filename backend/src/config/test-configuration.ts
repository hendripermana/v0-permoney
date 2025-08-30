import { Configuration } from './configuration';

export const testConfiguration = (): Configuration => ({
  app: {
    port: 3001,
    environment: 'test',
    apiPrefix: 'api',
    enableSwagger: false,
    logLevel: 'error',
  },
  database: {
    url: 'postgresql://test:test@localhost:5432/permoney_test',
    maxConnections: 5,
    connectionTimeout: 5000,
  },
  redis: {
    url: 'redis://localhost:6379',
    maxRetries: 3,
    retryDelay: 100,
  },
  auth: {
    jwtSecret: 'test-jwt-secret-that-is-at-least-32-characters-long-for-security',
    jwtExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
    sessionSecret: 'test-session-secret-that-is-at-least-32-characters-long-for-security',
    sessionMaxAge: 86400000,
    passkeyChallengeTimeout: 300000,
  },
  cache: {
    defaultTtl: 3600,
    maxItems: 1000,
    enableCompression: false,
  },
  security: {
    corsOrigins: ['http://localhost:3000', 'http://localhost:4200'],
    rateLimitWindow: 60000,
    rateLimitMax: 100,
    enableHelmet: true,
    enableCsrf: false,
  },
  externalServices: {
    exchangeRateApi: {
      url: 'https://api.test.com/v4/latest',
      apiKey: 'test-api-key',
      timeout: 5000,
    },
    ocrService: {
      url: 'https://ocr.test.com',
      apiKey: 'test-ocr-key',
      timeout: 30000,
    },
    emailService: {
      provider: 'test',
      apiKey: 'test-email-key',
      fromEmail: 'test@permoney.com',
    },
  },
});
