import * as Joi from 'joi';

const booleanSchema = (defaultValue: boolean) =>
  Joi.boolean()
    .truthy('true')
    .truthy('1')
    .truthy('yes')
    .truthy('on')
    .falsy('false')
    .falsy('0')
    .falsy('no')
    .falsy('off')
    .default(defaultValue);

export const configValidationSchema = Joi.object({
  // App configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  BACKEND_PORT: Joi.number().port().default(3001),
  PORT: Joi.number().port().default(3001),
  API_PREFIX: Joi.string().default('api'),
  ENABLE_SWAGGER: booleanSchema(true),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),

  // Database configuration
  DATABASE_URL: Joi.string().uri().optional(),
  DB_HOST: Joi.string().hostname().optional(),
  DB_PORT: Joi.number().port().optional(),
  DB_USERNAME: Joi.string().optional(),
  DB_PASSWORD: Joi.string().allow('').optional(),
  DB_NAME: Joi.string().optional(),
  POSTGRES_HOST: Joi.string().hostname().optional(),
  POSTGRES_PORT: Joi.number().port().optional(),
  POSTGRES_USER: Joi.string().optional(),
  POSTGRES_PASSWORD: Joi.string().allow('').optional(),
  POSTGRES_DB: Joi.string().optional(),
  DB_MAX_CONNECTIONS: Joi.number().integer().min(1).max(100).default(10),
  DB_CONNECTION_TIMEOUT: Joi.number().integer().min(1000).default(30000),

  // Redis configuration
  REDIS_URL: Joi.string().uri().default('redis://localhost:6379'),
  REDIS_MAX_RETRIES: Joi.number().integer().min(0).max(10).default(3),
  REDIS_RETRY_DELAY: Joi.number().integer().min(50).default(100),

  // Authentication configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  SESSION_SECRET: Joi.string().min(32).required(),
  SESSION_MAX_AGE: Joi.number().integer().min(60000).default(86400000), // Min 1 minute
  PASSKEY_CHALLENGE_TIMEOUT: Joi.number().integer().min(60000).default(300000), // Min 1 minute

  // Cache configuration
  CACHE_DEFAULT_TTL: Joi.number().integer().min(60).default(3600), // Min 1 minute
  CACHE_MAX_ITEMS: Joi.number().integer().min(100).default(1000),
  CACHE_ENABLE_COMPRESSION: booleanSchema(false),

  // Security configuration
  CORS_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:4200'),
  RATE_LIMIT_WINDOW: Joi.number().integer().min(1000).default(60000), // Min 1 second
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(100),
  ENABLE_HELMET: booleanSchema(true),
  ENABLE_CSRF: booleanSchema(true),

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
}).custom((value, helpers) => {
  const resolved = { ...value } as Record<string, any>;

  resolved.DB_HOST = resolved.DB_HOST ?? resolved.POSTGRES_HOST ?? 'localhost';
  resolved.DB_PORT = resolved.DB_PORT ?? resolved.POSTGRES_PORT ?? 5432;
  resolved.DB_USERNAME = resolved.DB_USERNAME ?? resolved.POSTGRES_USER ?? 'postgres';
  resolved.DB_PASSWORD = resolved.DB_PASSWORD ?? resolved.POSTGRES_PASSWORD ?? 'password';
  resolved.DB_NAME = resolved.DB_NAME ?? resolved.POSTGRES_DB ?? 'permoney';

  const hasDatabaseUrl = Boolean(resolved.DATABASE_URL);
  const hasDatabaseParts =
    Boolean(resolved.DB_HOST) &&
    Boolean(resolved.DB_PORT) &&
    Boolean(resolved.DB_USERNAME) &&
    resolved.DB_PASSWORD !== undefined &&
    Boolean(resolved.DB_NAME);

  if (!hasDatabaseUrl && !hasDatabaseParts) {
    return helpers.error('any.custom', {
      message:
        'Database configuration missing. Provide DATABASE_URL or the DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME variables.',
    });
  }

  return resolved;
}, 'Database configuration validation');
