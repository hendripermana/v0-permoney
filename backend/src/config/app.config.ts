import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  environment: string;
  apiPrefix: string;
  enableSwagger: boolean;
  logLevel: string;
  corsOrigins: string[];
  enableHelmet: boolean;
  enableCsrf: boolean;
  rateLimitWindow: number;
  rateLimitMax: number;
}

export default registerAs('app', (): AppConfig => {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api',
    enableSwagger: process.env.ENABLE_SWAGGER === 'true' || process.env.NODE_ENV === 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3002',
    ],
    enableHelmet: process.env.ENABLE_HELMET !== 'false',
    enableCsrf: process.env.ENABLE_CSRF === 'true',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  };
});
