import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = this.getRequest(context);

    // Allow CORS preflight requests to pass through without authentication
    if (request?.method === 'OPTIONS') {
      return true;
    }

    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    const sessionData = await this.authService.validateSession(token);
    if (!sessionData) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Add user info to request
    request.user = { id: sessionData.userId };
    request.sessionId = sessionData.sessionId;

    return true;
  }

  private getRequest(context: ExecutionContext): any {
    const contextType = context.getType<'http' | 'rpc' | 'ws' | 'graphql'>();

    if (contextType === 'http') {
      return context.switchToHttp().getRequest();
    }

    if (contextType === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context).getContext();
      return gqlContext?.req ?? gqlContext;
    }

    if (contextType === 'ws') {
      return context.switchToWs().getClient()?.handshake;
    }

    if (contextType === 'rpc') {
      return context.switchToRpc().getContext();
    }

    return context.switchToHttp().getRequest();
  }

  private extractTokenFromRequest(request: any): string | undefined {
    if (!request) {
      return undefined;
    }

    const authorizationHeader =
      request.headers?.authorization ??
      request.headers?.Authorization ??
      request.handshake?.headers?.authorization;
    const [type, token] = authorizationHeader?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
