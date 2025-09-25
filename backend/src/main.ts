import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app/app.module';
import { Configuration } from './config/configuration';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuditInterceptor } from './security/interceptors/audit.interceptor';
import * as session from 'express-session';
import * as connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService<Configuration>);
    
    // Get configuration values
    const appConfig = configService.get('app');
    const authConfig = configService.get('auth');
    const securityConfig = configService.get('security');
    const databaseConfig = configService.get('database');
    
    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Global interceptors
    const loggingInterceptor = app.get(LoggingInterceptor);
    const auditInterceptor = app.get(AuditInterceptor);
    app.useGlobalInterceptors(loggingInterceptor, auditInterceptor);

    // Security headers with Helmet
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", 'https:', 'wss:'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }));

    // Compression
    app.use(compression());

    // Session configuration for CSRF protection (serverless-safe)
    // Only enable session when CSRF is explicitly enabled
    if (securityConfig.enableCsrf) {
      const PgSession = (connectPgSimple as any)(session);
      app.use(
        session({
          store: new PgSession({
            conString: databaseConfig.url,
            tableName: 'session',
            createTableIfMissing: true,
          }),
          secret: authConfig.sessionSecret,
          resave: false,
          saveUninitialized: false,
          cookie: {
            secure: appConfig.environment === 'production',
            httpOnly: true,
            maxAge: authConfig.sessionMaxAge,
            sameSite: 'strict',
          },
        }),
      );
    }
    
    // CORS configuration (allow configured origins plus common Vercel subdomains)
    const corsOrigins = Array.isArray(securityConfig.corsOrigins) && securityConfig.corsOrigins.length > 0
      ? securityConfig.corsOrigins
      : ['http://localhost:3000'];
    const corsOriginWithVercel = [...corsOrigins, /\.vercel\.app$/, /\.v0\.app$/];

    app.enableCors({
      origin: corsOriginWithVercel as any,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-CSRF-Token',
        'X-Request-ID',
      ],
    });
    // Backward-compatible API version alias: /api/v1 -> /api
    app.use((req: any, _res: any, next: any) => {
      const base = `/${appConfig.apiPrefix}`;
      const v1 = `${base}/v1`;
      if (req.url === v1) {
        req.url = base;
      } else if (req.url.startsWith(v1 + '/')) {
        req.url = base + req.url.substring(v1.length);
      }
      next();
    });

    app.setGlobalPrefix(appConfig.apiPrefix);
    
    await app.listen(appConfig.port);
    Logger.log(
      `🚀 Application is running on: http://localhost:${appConfig.port}/${appConfig.apiPrefix}`
    );
    Logger.log(
      `📚 Health Check: http://localhost:${appConfig.port}/${appConfig.apiPrefix}/health`
    );
    Logger.log(
      `🔍 Environment: ${appConfig.environment}`
    );
  } catch (error) {
    Logger.error('Failed to start the application', error);
    process.exit(1);
  }
}

bootstrap();
