import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // App configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  BACKEND_PORT: Joi.number().port().default(3001),
  PORT: Joi.number().port().default(3001),
  API_PREFIX: Joi.string().default('api'),
  ENABLE_SWAGGER: Joi.boolean().default(true),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),

  // Database configuration
  DATABASE_URL: Joi.string().uri().required(),
  DB_MAX_CONNECTIONS: Joi.number().integer().min(1).max(100).default(10),
  DB_CONNECTION_TIMEOUT: Joi.number().integer().min(1000).default(30000),

  // Redis configuration
  REDIS_URL: Joi.string().uri().required(),
  REDIS_MAX_RETRIES: Joi.number().integer().min(0).max(10).default(3),
  REDIS_RETRY_DELAY: Joi.number().integer().min(50).default(100),

  // Authentication configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
  SESSION_SECRET: Joi.string().min(32).required(),
  SESSION_MAX_AGE: Joi.number().integer().min(60000).default(86400000), // Min 1 minute
  PASSKEY_CHALLENGE_TIMEOUT: Joi.number().integer().min(60000).default(300000), // Min 1 minute

  // Cache configuration
  CACHE_DEFAULT_TTL: Joi.number().integer().min(60).default(3600), // Min 1 minute
  CACHE_MAX_ITEMS: Joi.number().integer().min(100).default(1000),
  CACHE_ENABLE_COMPRESSION: Joi.boolean().default(false),

  // Security configuration
  CORS_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:4200'),
  RATE_LIMIT_WINDOW: Joi.number().integer().min(1000).default(60000), // Min 1 second
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(100),
  ENABLE_HELMET: Joi.boolean().default(true),
  ENABLE_CSRF: Joi.boolean().default(true),

  // External services configuration
  EXCHANGE_RATE_API_URL: Joi.string().uri().default('https://api.exchangerate-api.com/v4/latest'),
  EXCHANGE_RATE_API_KEY: Joi.string().allow('').default(''),
  EXCHANGE_RATE_API_TIMEOUT: Joi.number().integer().min(1000).default(5000),

  OCR_SERVICE_URL: Joi.string().uri().allow('').default(''),
  OCR_SERVICE_API_KEY: Joi.string().allow('').default(''),
  OCR_SERVICE_TIMEOUT: Joi.number().integer().min(5000).default(30000),

  EMAIL_PROVIDER: Joi.string().valid('sendgrid', 'ses', 'smtp').default('sendgrid'),
  EMAIL_API_KEY: Joi.string().allow('').default(''),
  FROM_EMAIL: Joi.string().email().default('noreply@permoney.com'),

  // Frontend URL for CORS and redirects
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
});
