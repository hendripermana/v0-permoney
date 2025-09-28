import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
    jwtKey: process.env.CLERK_JWT_KEY, // optional
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);

    // Allow CORS preflight
    if (request?.method === 'OPTIONS') return true;

    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      // Verify Clerk-issued token (Session or Custom JWT via template)
      const decoded = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
        // audience, issuer checks can be configured here if needed
      });

      // Attach user info to request for downstream usage
      request.user = { id: decoded.sub };
      // Optionally attach raw claims for role/permission mapping
      request.auth = decoded;

      return true;
    } catch (err) {
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
}
