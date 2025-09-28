import { Controller, Post, Body, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ClerkService } from './services/clerk.service';
import { AuthService } from './auth.service';

interface ClerkAuthRequest {
  token: string;
}

@Controller('auth/clerk')
export class ClerkAuthController {
  constructor(
    private readonly clerkService: ClerkService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Authenticate user via Clerk token
   */
  @Post('authenticate')
  async authenticate(@Body() body: ClerkAuthRequest, @Req() request: Request) {
    const { token } = body;

    if (!token) {
      throw new UnauthorizedException('Clerk token is required');
    }

    try {
      // Verify Clerk token
      const payload = await this.clerkService.verifyClerkToken(token);

      if (!payload) {
        throw new UnauthorizedException('Invalid Clerk token');
      }

      // Find or create user
      const user = await this.clerkService.findOrCreateUserFromClerk(payload.sub, {
        email: payload.email,
        name: payload.name,
        avatar: payload.avatar,
      });

      // Update last login
      await this.authService.updateLastLogin(user.id);

      // Generate our own JWT tokens for API access
      const tokenPair = await this.authService.generateTokenPair({
        sub: user.id,
        email: user.email,
        name: user.name,
        type: 'access',
      });

      // Create session
      const session = await this.authService.createSession({
        userId: user.id,
        token: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
        expiresAt: new Date(Date.now() + tokenPair.expiresIn * 1000),
      });

      return {
        success: true,
        message: 'Authentication successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
          isActive: user.isActive,
        },
        tokens: {
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          expiresIn: tokenPair.expiresIn,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Handle Clerk webhooks
   */
  @Post('webhook')
  async handleWebhook(@Body() body: any, @Req() request: Request) {
    // Verify webhook signature (implement based on Clerk docs)
    const signature = request.headers['clerk-signature'] as string;

    if (!signature) {
      throw new UnauthorizedException('Missing Clerk webhook signature');
    }

    try {
      // Process webhook event
      await this.clerkService.handleClerkWebhook(body.type, body.data);

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      throw new UnauthorizedException('Failed to process webhook');
    }
  }
}
