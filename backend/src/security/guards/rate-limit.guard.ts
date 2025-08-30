import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitService, RateLimitType } from '../services/rate-limit.service';

export const RATE_LIMIT_CONFIG = 'rate_limit_config';

export interface RateLimitConfig {
  type: RateLimitType;
  windowMs?: number;
  maxRequests?: number;
  blockDurationMs?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
}

export const RateLimit = (config: RateLimitConfig) =>
  Reflector.createDecorator<RateLimitConfig>({ key: RATE_LIMIT_CONFIG, value: config });

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_CONFIG,
      context.getHandler(),
    );

    if (!config) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const user = (request as any).user;

    // Check if user/IP is whitelisted
    if (user) {
      const isWhitelisted = await this.rateLimitService.isWhitelisted(user.id, 'user');
      if (isWhitelisted) {
        return true;
      }
    }

    const isIPWhitelisted = await this.rateLimitService.isWhitelisted(request.ip, 'ip');
    if (isIPWhitelisted) {
      return true;
    }

    // Generate rate limit key
    let key: string;
    if (config.keyGenerator) {
      key = config.keyGenerator(request);
    } else {
      switch (config.type) {
        case RateLimitType.PER_USER:
          key = user ? this.rateLimitService.generateUserKey(user.id, request.path) : request.ip;
          break;
        case RateLimitType.PER_IP:
          key = this.rateLimitService.generateIPKey(request.ip, request.path);
          break;
        case RateLimitType.PER_ENDPOINT:
          key = this.rateLimitService.generateEndpointKey(request.method, request.path, user?.id || request.ip);
          break;
        case RateLimitType.LOGIN_ATTEMPTS:
          key = `login:${request.ip}`;
          break;
        case RateLimitType.PASSWORD_RESET:
          key = `password_reset:${request.ip}`;
          break;
        default:
          key = request.ip;
      }
    }

    // Check rate limit
    const rateLimitConfig = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      blockDurationMs: config.blockDurationMs,
      skipSuccessfulRequests: config.skipSuccessfulRequests,
      skipFailedRequests: config.skipFailedRequests,
    };

    const result = await this.rateLimitService.checkRateLimit(
      key,
      config.type,
      rateLimitConfig,
    );

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', result.totalHits);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', result.resetTime.getTime());

    if (result.blocked) {
      response.setHeader('X-RateLimit-Blocked', 'true');
      response.setHeader('X-RateLimit-Block-Expires', result.blockExpiresAt?.getTime() || '');
    }

    if (!result.allowed) {
      // Call custom handler if provided
      if (config.onLimitReached) {
        config.onLimitReached(request, response);
      }

      const message = result.blocked
        ? `Rate limit exceeded. Blocked until ${result.blockExpiresAt?.toISOString()}`
        : `Rate limit exceeded. Try again after ${result.resetTime.toISOString()}`;

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message,
          error: 'Too Many Requests',
          retryAfter: result.blocked
            ? Math.ceil((result.blockExpiresAt!.getTime() - Date.now()) / 1000)
            : Math.ceil((result.resetTime.getTime() - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
