# 🚀 PerMoney Deployment Guide

## Overview

This guide covers deploying PerMoney to production environments with a focus on Vercel deployment for optimal performance and scalability.

## Table of Contents
- [Vercel Deployment](#vercel-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Security Configuration](#security-configuration)
- [Monitoring & Analytics](#monitoring--analytics)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Vercel Deployment

### Prerequisites
- Vercel account
- GitHub repository
- Neon PostgreSQL database
- Upstash Redis instance

### Deployment Steps

#### 1. Connect Repository to Vercel
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel
\`\`\`

#### 2. Configure Build Settings
Create `vercel.json` in project root:
\`\`\`json
{
  "version": 2,
  "builds": [
    {
      "src": "app/**/*",
      "use": "@vercel/next"
    },
    {
      "src": "backend/src/**/*",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/src/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/app/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
\`\`\`

#### 3. Configure Package Scripts
Update `package.json`:
\`\`\`json
{
  "scripts": {
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd app && npm run build",
    "build:backend": "cd backend && npm run build",
    "start": "npm run start:frontend",
    "start:frontend": "cd app && npm start",
    "vercel-build": "npm run build"
  }
}
\`\`\`

## Environment Configuration

### Production Environment Variables
Configure these in Vercel Dashboard → Project Settings → Environment Variables:

#### Database Configuration
\`\`\`bash
# Neon PostgreSQL
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
POSTGRES_URL="postgresql://username:password@host/database?sslmode=require"
POSTGRES_PRISMA_URL="postgresql://username:password@host/database?sslmode=require&pgbouncer=true&connect_timeout=15"

# Redis (Upstash)
REDIS_URL="redis://default:password@host:port"
\`\`\`

#### Authentication & Security
\`\`\`bash
# JWT Configuration
JWT_SECRET="your-production-jwt-secret-256-bit"
SESSION_SECRET="your-production-session-secret"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_EXPIRES_IN="30d"

# CORS Configuration
CORS_ORIGINS="https://your-domain.com,https://www.your-domain.com"
FRONTEND_URL="https://your-domain.com"
\`\`\`

#### External Services
\`\`\`bash
# Exchange Rate API
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com/v4/latest"
EXCHANGE_RATE_API_KEY="your-exchange-rate-api-key"

# OCR Service
OCR_SERVICE_URL="https://api.ocr.space/parse/image"
OCR_SERVICE_API_KEY="your-ocr-api-key"

# Email Service
EMAIL_PROVIDER="sendgrid"
EMAIL_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@your-domain.com"
\`\`\`

#### Application Configuration
\`\`\`bash
# API Configuration
NEXT_PUBLIC_API_URL="https://your-api-domain.vercel.app"
API_PREFIX="/api/v1"
PORT="3000"
BACKEND_PORT="3001"

# Feature Flags
ENABLE_SWAGGER="false"
ENABLE_METRICS="true"
ENABLE_HELMET="true"
ENABLE_CSRF="true"

# Performance
CACHE_DEFAULT_TTL="3600"
RATE_LIMIT_WINDOW="900000"
RATE_LIMIT_MAX="100"
\`\`\`

### Environment-Specific Configuration
Create environment-specific files:

#### `backend/src/config/environment.prod.ts`
\`\`\`typescript
export const productionConfig = {
  database: {
    url: process.env.DATABASE_URL,
    ssl: true,
    maxConnections: 20,
    connectionTimeout: 30000
  },
  redis: {
    url: process.env.REDIS_URL,
    maxRetries: 3,
    retryDelay: 1000
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100')
    }
  },
  logging: {
    level: 'info',
    format: 'json'
  }
};
\`\`\`

## Database Setup

### Neon PostgreSQL Configuration

#### 1. Create Neon Database
\`\`\`bash
# Using Neon CLI
npm install -g @neondatabase/cli
neon auth
neon projects create --name permoney-prod
\`\`\`

#### 2. Run Migrations
\`\`\`bash
# Set production database URL
export DATABASE_URL="your-neon-connection-string"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
\`\`\`

#### 3. Seed Production Data
\`\`\`bash
# Run production seeding
npm run db:seed:prod
\`\`\`

### Database Optimization
\`\`\`sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_transactions_user_date 
ON transactions(user_id, date DESC);

CREATE INDEX CONCURRENTLY idx_transactions_category 
ON transactions(category_id);

CREATE INDEX CONCURRENTLY idx_accounts_household 
ON accounts(household_id);

-- Enable connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
\`\`\`

## Security Configuration

### SSL/TLS Configuration
\`\`\`typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions: process.env.NODE_ENV === 'production' ? {
      // SSL configuration for production
    } : undefined
  });

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  await app.listen(process.env.PORT || 3001);
}
\`\`\`

### Rate Limiting
\`\`\`typescript
// backend/src/security/guards/rate-limit.guard.ts
import rateLimit from 'express-rate-limit';

export const createRateLimiter = () => rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW || '900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});
\`\`\`

## Monitoring & Analytics

### Health Checks
\`\`\`typescript
// backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database'),
      () => this.checkRedis(),
      () => this.checkExternalAPIs()
    ]);
  }

  private async checkRedis() {
    // Redis health check implementation
  }

  private async checkExternalAPIs() {
    // External API health checks
  }
}
\`\`\`

### Error Tracking
\`\`\`typescript
// backend/src/common/filters/global-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Log error for monitoring
    this.logger.error({
      message: exception instanceof Error ? exception.message : 'Unknown error',
      stack: exception instanceof Error ? exception.stack : undefined,
      url: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      timestamp: new Date().toISOString()
    });

    // Send error response
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    response.status(status).json({
      success: false,
      statusCode: status,
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : exception instanceof Error ? exception.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }
}
\`\`\`

### Performance Monitoring
\`\`\`typescript
// backend/src/common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log({
          method,
          url,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });

        // Alert on slow requests
        if (duration > 5000) {
          this.logger.warn(`Slow request detected: ${method} ${url} took ${duration}ms`);
        }
      })
    );
  }
}
\`\`\`

## Performance Optimization

### Frontend Optimization
\`\`\`typescript
// app/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  // Enable SWC minification
  swcMinify: true,
  // Bundle analyzer
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
\`\`\`

### Backend Optimization
\`\`\`typescript
// backend/src/app.module.ts
import { Module, CacheModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    
    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: parseInt(process.env.CACHE_DEFAULT_TTL || '3600'),
      max: parseInt(process.env.CACHE_MAX_ITEMS || '1000'),
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot({
      ttl: parseInt(process.env.RATE_LIMIT_WINDOW || '60'),
      limit: parseInt(process.env.RATE_LIMIT_MAX || '10'),
    }),
  ],
})
export class AppModule {}
\`\`\`

## Troubleshooting

### Common Deployment Issues

#### Build Failures
\`\`\`bash
# Clear build cache
vercel --prod --force

# Check build logs
vercel logs your-deployment-url

# Local build test
npm run build
\`\`\`

#### Database Connection Issues
\`\`\`bash
# Test database connection
npx prisma db pull

# Check connection string format
echo $DATABASE_URL

# Verify SSL requirements
psql "$DATABASE_URL" -c "SELECT version();"
\`\`\`

#### Environment Variable Issues
\`\`\`bash
# List all environment variables
vercel env ls

# Add missing environment variable
vercel env add VARIABLE_NAME

# Pull environment variables locally
vercel env pull .env.local
\`\`\`

### Performance Issues
\`\`\`bash
# Analyze bundle size
npm run analyze

# Check Core Web Vitals
npx @vercel/speed-insights

# Monitor API performance
curl -w "@curl-format.txt" -o /dev/null -s "https://your-api.vercel.app/health"
\`\`\`

### Security Issues
\`\`\`bash
# Security audit
npm audit

# Check for vulnerabilities
npm audit fix

# Verify SSL configuration
openssl s_client -connect your-domain.com:443
\`\`\`

## Maintenance

### Regular Tasks
\`\`\`bash
# Update dependencies monthly
npm update

# Security patches
npm audit fix

# Database maintenance
npx prisma migrate deploy

# Monitor logs
vercel logs --follow
\`\`\`

### Backup Strategy
\`\`\`bash
# Database backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Environment backup
vercel env pull .env.backup
\`\`\`

### Scaling Considerations
- Monitor Vercel function execution time limits
- Consider database connection pooling
- Implement CDN for static assets
- Use Redis for session management
- Monitor and optimize database queries

---

*Your PerMoney application is now ready for production deployment with enterprise-grade security, performance, and monitoring.*
\`\`\`

```typescriptreact file="PROJECT_STRUCTURE.md" isDeleted="true"
...deleted...
