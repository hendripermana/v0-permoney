import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface RequestWithCsrf extends Request {
  csrfToken?: string;
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly csrfSecret: string;
  private readonly enabled: boolean;
  private readonly excludedPaths = [
    '/api/auth/passkey/authentication-options',
    '/api/auth/passkey/authenticate',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
  ];

  constructor(private readonly configService: ConfigService) {
    this.csrfSecret = this.configService.get<string>('CSRF_SECRET') || 'default-csrf-secret';
    const security = this.configService.get<any>('security');
    this.enabled = security?.enableCsrf !== false;
  }

  use(req: RequestWithCsrf, res: Response, next: NextFunction) {
    // If CSRF is disabled via config, no-op
    if (!this.enabled) {
      return next();
    }

    // Skip CSRF protection for GET requests and excluded paths
    if (req.method === 'GET' || this.excludedPaths.includes(req.path)) {
      return next();
    }

    // Skip CSRF for WebAuthn endpoints (they have their own challenge mechanism)
    if (req.path.includes('/passkey/')) {
      return next();
    }

    const token = (req.headers['x-csrf-token'] as string) || (req.body && (req.body as any)._csrf);
    
    if (!token) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (!this.validateCsrfToken(token, (req as any).sessionID || req.ip)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    next();
  }

  generateCsrfToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const hash = crypto
      .createHmac('sha256', this.csrfSecret)
      .update(`${sessionId}:${timestamp}`)
      .digest('hex');
    
    return Buffer.from(`${timestamp}:${hash}`).toString('base64');
  }

  private validateCsrfToken(token: string, sessionId: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const [timestamp, hash] = decoded.split(':');
      
      if (!timestamp || !hash) {
        return false;
      }

      // Check if token is not older than 1 hour
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 60 * 60 * 1000) {
        return false;
      }

      const expectedHash = crypto
        .createHmac('sha256', this.csrfSecret)
        .update(`${sessionId}:${timestamp}`)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );
    } catch (error) {
      return false;
    }
  }
}
