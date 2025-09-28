import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { RequestContextService } from '../../common/services/request-context.service';
import { UserContextService } from '../services/user-context.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });

  constructor(
    private readonly userContextService: UserContextService,
    private readonly requestContext: RequestContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);

    // Allow CORS preflight
    if (request?.method === 'OPTIONS') return true;

    try {
      const authContext = await this.authenticateWithClerk(request);
      const { userId, householdId } = await this.userContextService.resolveUserContext(authContext.clerkUserId);

      request.user = {
        sub: userId,
        userId,
        householdId,
        clerkId: authContext.clerkUserId,
      };
      request.auth = authContext.payload;

      this.requestContext.setUserId(userId);
      if (householdId) {
        this.requestContext.setHouseholdId(householdId);
      }

      return true;
    } catch (err) {
      Logger.warn(`Token verification failed: ${(err as Error)?.message ?? err}`, ClerkAuthGuard.name);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private getRequest(context: ExecutionContext): any {
    const type = context.getType<'http' | 'graphql' | 'ws' | 'rpc'>();

    if (type === 'http') {
      return context.switchToHttp().getRequest();
    }

    if (type === 'graphql') {
      // Lazy import to avoid dependency if GraphQL not used at runtime
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { GqlExecutionContext } = require('@nestjs/graphql');
      const gqlCtx = GqlExecutionContext.create(context).getContext();
      return gqlCtx?.req ?? gqlCtx;
    }

    if (type === 'ws') {
      return context.switchToWs().getClient()?.handshake;
    }

    if (type === 'rpc') {
      return context.switchToRpc().getContext();
    }

    return context.switchToHttp().getRequest();
  }

  private extractBearerToken(request: any): string | undefined {
    const header =
      request?.headers?.authorization ||
      request?.headers?.Authorization ||
      request?.handshake?.headers?.authorization;

    const [scheme, value] = (header ?? '').split(' ');
    if (scheme !== 'Bearer' || !value) return undefined;
    return value;
  }

  private extractSessionToken(request: any): string | undefined {
    if (request?.cookies?.__session) {
      return request.cookies.__session;
    }

    const cookieHeader: string | undefined = request?.headers?.cookie;
    if (!cookieHeader) return undefined;

    const cookies = cookieHeader.split(';').map((part: string) => part.trim());
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === '__session' && value) {
        return decodeURIComponent(value);
      }
    }

    return undefined;
  }

  private buildRequestUrl(request: any): string {
    const headerProto = request?.headers?.['x-forwarded-proto'];
    const proto = Array.isArray(headerProto)
      ? headerProto[0]
      : headerProto?.split(',')[0]?.trim() ?? request?.protocol ?? 'http';
    const host = request?.headers?.host;
    const url = request?.originalUrl ?? request?.url ?? '';
    return host ? `${proto}://${host}${url}` : url;
  }

  private async authenticateWithClerk(request: any): Promise<{ clerkUserId: string; payload: any }> {
    let authPayload: any;
    let clerkUserId: string | undefined;

    try {
      const url = this.buildRequestUrl(request);
      const method = (request?.method ?? 'GET').toUpperCase();
      const headers = new Headers();

      Object.entries(request?.headers ?? {}).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v as string));
        } else if (typeof value !== 'undefined') {
          headers.append(key, value as string);
        }
      });

      const clerkRequest = new Request(url, {
        method,
        headers,
      });

      const authResult = await this.clerk.authenticateRequest(clerkRequest);

      if (authResult?.isSignedIn) {
        authPayload = typeof authResult.toAuth === 'function' ? await authResult.toAuth() : authResult;
        clerkUserId = authPayload?.userId;
      }
    } catch (authError) {
      Logger.debug(`Primary Clerk authentication failed: ${(authError as Error)?.message ?? authError}`, ClerkAuthGuard.name);
    }

    if (!clerkUserId) {
      const token = this.extractBearerToken(request) ?? this.extractSessionToken(request);
      if (!token) {
        throw new UnauthorizedException('Access token is required');
      }

      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      clerkUserId = verifiedToken?.sub;
      authPayload = verifiedToken;
    }

    if (!clerkUserId) {
      throw new UnauthorizedException('Unable to authenticate Clerk session');
    }

    return { clerkUserId, payload: authPayload };
  }
}
