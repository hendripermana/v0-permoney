import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Delete,
  Param,
  Put,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { PasskeyService } from './passkey.service';
import { SessionService } from './session.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import {
  PasskeyRegistrationDto,
  PasskeyAuthenticationDto,
  PasskeyVerificationDto,
} from './dto/passkey.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passkeyService: PasskeyService,
    private readonly sessionService: SessionService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
  ) {
    const result = await this.authService.register(registerDto);
    // Log registration attempt for security monitoring
    console.log(`Registration attempt from ${ipAddress} with user-agent: ${userAgent}`);
    return {
      message: 'Registration successful',
      user: result.user,
      tokens: result.tokens,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
  ) {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
      userAgent,
      ipAddress,
    );
    return {
      message: 'Login successful',
      user: result.user,
      tokens: result.tokens,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(refreshTokenDto.refreshToken);
    return {
      message: 'Tokens refreshed successfully',
      tokens,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return { message: 'Logout successful' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Request() req: any) {
    await this.authService.logoutAll(req.user.id);
    return { message: 'All sessions logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return {
      user: req.user,
    };
  }

  // Passkey endpoints
  @Post('passkey/registration-options')
  @UseGuards(JwtAuthGuard)
  async generatePasskeyRegistrationOptions(
    @Request() req: any,
    @Body() passkeyRegistrationDto: PasskeyRegistrationDto,
  ) {
    const options = await this.passkeyService.generateRegistrationOptions(
      req.user.id,
      passkeyRegistrationDto.name,
    );
    return options;
  }

  @Post('passkey/register')
  @UseGuards(JwtAuthGuard)
  async registerPasskey(
    @Request() req: any,
    @Body() passkeyVerificationDto: PasskeyVerificationDto,
  ) {
    const result = await this.passkeyService.verifyRegistration(
      req.user.id,
      passkeyVerificationDto.name,
      passkeyVerificationDto.response,
    );
    return {
      message: result.verified ? 'Passkey registered successfully' : 'Passkey registration failed',
      verified: result.verified,
    };
  }

  @Public()
  @Post('passkey/authentication-options')
  async generatePasskeyAuthenticationOptions(
    @Body() body: { email?: string },
  ) {
    const options = await this.passkeyService.generateAuthenticationOptions(body.email);
    return options;
  }

  @Public()
  @Post('passkey/authenticate')
  async authenticateWithPasskey(
    @Body() passkeyAuthenticationDto: PasskeyAuthenticationDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
  ) {
    const result = await this.passkeyService.verifyAuthentication(
      passkeyAuthenticationDto.response,
      userAgent,
      ipAddress,
    );

    if (result.verified) {
      return {
        message: 'Passkey authentication successful',
        user: result.user,
        tokens: result.tokens,
      };
    }

    return {
      message: 'Passkey authentication failed',
      verified: false,
    };
  }

  @Get('passkeys')
  @UseGuards(JwtAuthGuard)
  async getUserPasskeys(@Request() req: any) {
    const passkeys = await this.passkeyService.getUserPasskeys(req.user.id);
    return { passkeys };
  }

  @Delete('passkeys/:passkeyId')
  @UseGuards(JwtAuthGuard)
  async deletePasskey(@Request() req: any, @Param('passkeyId') passkeyId: string) {
    await this.passkeyService.deletePasskey(req.user.id, passkeyId);
    return { message: 'Passkey deleted successfully' };
  }

  @Put('passkeys/:passkeyId')
  @UseGuards(JwtAuthGuard)
  async renamePasskey(
    @Request() req: any,
    @Param('passkeyId') passkeyId: string,
    @Body() body: { name: string },
  ) {
    await this.passkeyService.renamePasskey(req.user.id, passkeyId, body.name);
    return { message: 'Passkey renamed successfully' };
  }

  // Session management endpoints
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getUserSessions(@Request() req: any) {
    const sessions = await this.sessionService.getUserSessions(req.user.id);
    return { sessions };
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  async deleteSession(@Request() req: any, @Param('sessionId') sessionId: string) {
    await this.sessionService.deleteSession(sessionId);
    return { message: 'Session deleted successfully' };
  }

  @Post('sessions/revoke-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeAllSessions(@Request() req: any) {
    await this.sessionService.revokeAllUserSessions(req.user.id);
    return { message: 'All sessions revoked successfully' };
  }

  @Public()
  @Get('csrf-token')
  async getCsrfToken(@Request() req: any) {
    // This would be implemented with the CSRF middleware
    const sessionId = req.sessionID || req.session?.id || 'anonymous';
    return {
      csrfToken: req.csrfToken?.() || 'csrf-token-placeholder',
      sessionId: sessionId,
    };
  }
}
