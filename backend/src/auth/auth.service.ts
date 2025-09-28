import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './services/password.service';
import { JwtService, JwtPayload } from './services/jwt.service';
import { SessionService } from './services/session.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordResetService } from './services/password-reset.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ChangePasswordDto,
  AuthResponseDto,
  UserProfileDto
} from './dto/auth.dto';

// Re-export JwtPayload for use in strategies
export type { JwtPayload };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  async register(registerDto: RegisterDto, userAgent?: string, ipAddress?: string): Promise<AuthResponseDto> {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        emailVerified: false, // Will be verified via email
      },
    });

    // Create email verification token
    const verificationToken = await this.emailVerificationService.createVerificationToken(user.id);

    // Create session
    // Generate tokens
    const tokenPair = this.jwtService.generateTokenPair({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'access',
    });

    const session = await this.sessionService.createSession({
      userId: user.id,
      token: tokenPair.accessToken,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + tokenPair.expiresIn * 1000),
    });


    // Update session with correct tokens
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
      },
    });

    return {
      success: true,
      message: 'Registration successful. Please verify your email.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
      tokens: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked due to too many failed login attempts');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lockedUntil: user.failedLoginAttempts >= 4 ? new Date(Date.now() + 15 * 60 * 1000) : undefined, // Lock for 15 minutes after 5 failed attempts
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return user;
  }

  async login(loginDto: LoginDto, userAgent?: string, ipAddress?: string): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Validate user credentials
    const user = await this.validateUser(email, password);

    // Update last login time
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // Create session
    // Generate tokens
    const tokenPair = this.jwtService.generateTokenPair({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'access',
    });

    const session = await this.sessionService.createSession({
      userId: user.id,
      token: tokenPair.accessToken,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + tokenPair.expiresIn * 1000),
    });

    // Update session with correct tokens
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
      },
    });

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
      tokens: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;

    // Verify refresh token
    const payload = this.jwtService.verifyRefreshToken(refreshToken);

    // Find active session
    const session = await this.sessionService.findActiveRefreshSession(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Generate new tokens
    const tokenPair = this.jwtService.generateTokenPair({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'access',
    });

    // Update session
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        lastUsedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Token refreshed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
      tokens: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
      },
    };
  }

  async logout(sessionId: string): Promise<{ success: boolean; message: string }> {
    await this.sessionService.deactivateSession(sessionId);

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  async logoutAll(userId: string): Promise<{ success: boolean; message: string }> {
    await this.sessionService.deactivateAllUserSessions(userId);

    return {
      success: true,
      message: 'Logged out from all devices',
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ success: boolean; message: string }> {
    return this.emailVerificationService.verifyEmail(verifyEmailDto.token);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    const result = await this.passwordResetService.createResetToken(forgotPasswordDto.email);
    return {
      success: result.success,
      message: result.message,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    return this.passwordResetService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    if (!(await this.passwordService.comparePassword(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const newPasswordHash = await this.passwordService.hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Deactivate all sessions for security
    await this.sessionService.deactivateAllUserSessions(userId);

    return {
      success: true,
      message: 'Password changed successfully. Please login again.',
    };
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || undefined,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async validateSession(token: string): Promise<{ userId: string; sessionId: string } | null> {
    try {
      const payload = this.jwtService.verifyAccessToken(token);
      const session = await this.sessionService.findActiveSession(token);

      if (!session) {
        return null;
      }

      // Update last used
      await this.sessionService.updateSessionLastUsed(session.id);

      return {
        userId: payload.sub,
        sessionId: session.id,
      };
    } catch {
      return null;
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  /**
   * Generate JWT token pair
   */
  async generateTokenPair(payload: any): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    return this.jwtService.generateTokenPair(payload);
  }

  /**
   * Create a new session
   */
  async createSession(sessionData: {
    userId: string;
    token: string;
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
  }) {
    return this.sessionService.createSession({
      userId: sessionData.userId,
      token: sessionData.token,
      userAgent: sessionData.userAgent,
      ipAddress: sessionData.ipAddress,
      expiresAt: sessionData.expiresAt,
    });
  }
}