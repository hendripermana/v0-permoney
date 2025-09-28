import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InMemoryAuthService } from './services/in-memory-auth.service';

@Injectable()
export class InMemoryJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: InMemoryAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

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

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
