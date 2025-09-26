import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import { AuditService, AuditEventType, AuditSeverity } from '../services/audit.service';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private readonly helmetMiddleware: any;
  private readonly rateLimitMiddleware: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {
    // Configure Helmet for security headers
    this.helmetMiddleware = helmet({
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
          mediaSrc: ["'self'"],
          manifestSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for API compatibility
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    });

    // Configure basic rate limiting
    this.rateLimitMiddleware = rateLimit({
      windowMs: this.configService.get<number>('security.rateLimitWindow', 60000), // 1 minute
      max: this.configService.get<number>('security.rateLimitMax', 100),
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded, please try again later',
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        this.auditService.logSecurityViolation(
          'Global rate limit exceeded',
          {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            path: req.path,
            method: req.method,
          },
          AuditSeverity.MEDIUM,
        );

        res.status(429).json({
          statusCode: 429,
          message: 'Rate limit exceeded, please try again later',
          error: 'Too Many Requests',
        });
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Apply security headers
    this.helmetMiddleware(req, res, (err: any) => {
      if (err) {
        this.logger.error('Helmet middleware error', err);
        return next(err);
      }

      // Apply rate limiting
      this.rateLimitMiddleware(req, res, (rateLimitErr: any) => {
        if (rateLimitErr) {
          return next(rateLimitErr);
        }

        // Additional security checks
        this.performSecurityChecks(req, res, next);
      });
    });
  }

  private performSecurityChecks(req: Request, res: Response, next: NextFunction) {
    try {
      // Check for suspicious patterns
      this.checkSuspiciousPatterns(req);

      // Validate request headers
      this.validateRequestHeaders(req);

      // Check for potential attacks
      this.checkForAttacks(req);

      // Add security response headers
      this.addSecurityHeaders(res);

      next();
    } catch (error) {
      this.logger.error('Security check failed', error);
      next(error);
    }
  }

  private checkSuspiciousPatterns(req: Request) {
    const suspiciousPatterns = [
      // SQL Injection patterns
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      // XSS patterns
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      // Path traversal
      /\.\.\//g,
      /\.\.\\/g,
      // Command injection
      /[;&|`$(){}[\]]/g,
    ];

    const checkString = `${req.url} ${JSON.stringify(req.query)} ${JSON.stringify(req.body)}`;

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(checkString)) {
        this.auditService.logSecurityViolation(
          'Suspicious pattern detected',
          {
            pattern: pattern.toString(),
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            query: req.query,
            body: req.body,
          },
          AuditSeverity.HIGH,
        );

        // Don't block immediately, just log for analysis
        this.logger.warn('Suspicious pattern detected', {
          pattern: pattern.toString(),
          url: req.url,
          ip: req.ip,
        });
        break;
      }
    }
  }

  private validateRequestHeaders(req: Request) {
    // Check for missing or suspicious headers
    const userAgent = req.headers['user-agent'];
    if (!userAgent || userAgent.length < 10) {
      this.auditService.logSecurityViolation(
        'Suspicious or missing User-Agent header',
        {
          userAgent,
          ip: req.ip,
          path: req.path,
        },
        AuditSeverity.LOW,
      );
    }

    // Check for excessively long headers (potential buffer overflow)
    for (const [name, value] of Object.entries(req.headers)) {
      if (typeof value === 'string' && value.length > 8192) {
        this.auditService.logSecurityViolation(
          'Excessively long header detected',
          {
            headerName: name,
            headerLength: value.length,
            ip: req.ip,
            path: req.path,
          },
          AuditSeverity.MEDIUM,
        );
      }
    }

    // Check for suspicious referer
    const referer = req.headers.referer;
    if (referer && !this.isValidReferer(referer)) {
      this.auditService.logSecurityViolation(
        'Suspicious referer header',
        {
          referer,
          ip: req.ip,
          path: req.path,
        },
        AuditSeverity.LOW,
      );
    }
  }

  private checkForAttacks(req: Request) {
    // Check for potential DDoS patterns
    const requestSize = JSON.stringify(req.body).length + req.url.length;
    if (requestSize > 1024 * 1024) { // 1MB
      this.auditService.logSecurityViolation(
        'Unusually large request detected',
        {
          requestSize,
          ip: req.ip,
          path: req.path,
          method: req.method,
        },
        AuditSeverity.MEDIUM,
      );
    }

    // Check for potential brute force patterns
    if (req.path.includes('/auth/login') && req.method === 'POST') {
      // This would be handled by specific rate limiting, but we can log it
      this.logger.debug('Login attempt detected', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    // Check for potential enumeration attacks
    if (req.path.includes('/users/') && req.method === 'GET') {
      const userId = req.path.split('/users/')[1];
      if (userId && !this.isValidUUID(userId)) {
        this.auditService.logSecurityViolation(
          'Potential user enumeration attempt',
          {
            attemptedUserId: userId,
            ip: req.ip,
            path: req.path,
          },
          AuditSeverity.MEDIUM,
        );
      }
    }
  }

  private addSecurityHeaders(res: Response) {
    // Additional custom security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Add custom security identifier
    res.setHeader('X-Security-Policy', 'enforced');
  }

  private isValidReferer(referer: string): boolean {
    try {
      const url = new URL(referer);
      const allowedDomains = this.configService.get<string[]>('security.corsOrigins', []);
      
      return allowedDomains.some(domain => {
        const domainUrl = new URL(domain);
        return url.hostname === domainUrl.hostname;
      });
    } catch {
      return false;
    }
  }

  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
