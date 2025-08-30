import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from './session.service';
import { User } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  householdId?: string;
  role?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResult {
  user: Omit<User, 'passwordHash'>;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_EXPIRES_IN = '15m';
  private readonly JWT_REFRESH_EXPIRES_IN = '7d';
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  // In-memory rate limiting (in production, use Redis)
  private loginAttempts = new Map<string, { count: number; lockedUntil?: Date }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(
    email: string,
    password: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResult> {
    // Check rate limiting
    if (this.isRateLimited(email, ipAddress)) {
      throw new UnauthorizedException('Too many login attempts. Please try again later.');
    }

    const user = await this.validateUser(email, password);
    if (!user) {
      this.incrementLoginAttempts(email, ipAddress);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Reset login attempts on successful login
    this.resetLoginAttempts(email, ipAddress);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    await this.sessionService.createSession({
      userId: user.id,
      token: tokens.refreshToken,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<LoginResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        passwordHash: hashedPassword,
        name: userData.name,
      },
    });

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as JwtPayload;

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Verify session exists and is valid
      const session = await this.sessionService.findByToken(refreshToken);
      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session expired');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update session with new refresh token
      await this.sessionService.updateSession(session.id, {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    const session = await this.sessionService.findByToken(refreshToken);
    if (session) {
      await this.sessionService.deleteSession(session.id);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionService.deleteAllUserSessions(userId);
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.JWT_ACCESS_EXPIRES_IN,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.JWT_REFRESH_EXPIRES_IN,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  private sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private isRateLimited(email: string, ipAddress?: string): boolean {
    const key = ipAddress || email;
    const attempts = this.loginAttempts.get(key);

    if (!attempts) return false;

    if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
      return true;
    }

    return attempts.count >= this.MAX_LOGIN_ATTEMPTS;
  }

  private incrementLoginAttempts(email: string, ipAddress?: string): void {
    const key = ipAddress || email;
    const attempts = this.loginAttempts.get(key) || { count: 0 };

    attempts.count++;

    if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
      attempts.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
    }

    this.loginAttempts.set(key, attempts);
  }

  private resetLoginAttempts(email: string, ipAddress?: string): void {
    const key = ipAddress || email;
    this.loginAttempts.delete(key);
  }
}
