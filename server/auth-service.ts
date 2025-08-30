import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  LoginSchema,
  RegisterSchema,
  SocialLoginSchema,
  TwoFactorSchema,
} from '../shared/schema';
import { z } from 'zod';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
  message?: string;
  requiresTwoFactor?: boolean;
}

export class AuthService {
  // Rate limiting for login attempts
  private loginAttempts = new Map<
    string,
    { count: number; lockedUntil?: Date }
  >();

  // Traditional email/password authentication
  async login(
    email: string,
    password: string,
    ipAddress?: string
  ): Promise<AuthResult> {
    try {
      // Check rate limiting
      if (this.isRateLimited(email, ipAddress)) {
        return {
          success: false,
          error: 'ACCOUNT_LOCKED',
          message: 'Too many login attempts. Please try again later.',
        };
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user || !user.password) {
        this.incrementLoginAttempts(email, ipAddress);
        return {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        };
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        this.incrementLoginAttempts(email, ipAddress);
        return {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        };
      }

      // Reset login attempts on successful login
      this.resetLoginAttempts(email, ipAddress);

      const token = this.generateToken(user.id);
      const authUser = this.mapToAuthUser(user);

      return {
        success: true,
        user: authUser,
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'LOGIN_ERROR',
        message: 'An error occurred during login',
      };
    }
  }

  // User registration
  async register(
    userData: z.infer<typeof RegisterSchema>
  ): Promise<AuthResult> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      });

      const token = this.generateToken(user.id);
      const authUser = this.mapToAuthUser(user);

      return {
        success: true,
        user: authUser,
        token,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'DUPLICATE_USER',
          message: 'Username or email already exists',
        };
      }

      console.error('Registration error:', error);
      return {
        success: false,
        error: 'REGISTRATION_ERROR',
        message: 'An error occurred during registration',
      };
    }
  }

  // Social login (Google, GitHub, Apple)
  async socialLogin(provider: string, profile: any): Promise<AuthResult> {
    try {
      let user = await this.findUserBySocialId(provider, profile.id);

      if (!user) {
        // Create new user from social profile
        user = await this.createUserFromSocialProfile(provider, profile);
      }

      const token = this.generateToken(user.id);
      const authUser = this.mapToAuthUser(user);

      return {
        success: true,
        user: authUser,
        token,
      };
    } catch (error) {
      console.error('Social login error:', error);
      return {
        success: false,
        error: 'SOCIAL_LOGIN_ERROR',
        message: 'An error occurred during social login',
      };
    }
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) return null;

      return this.mapToAuthUser(user);
    } catch (error) {
      return null;
    }
  }

  // Helper methods
  private generateToken(userId: number): string {
    return jwt.sign(
      { userId, iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  private mapToAuthUser(user: any): AuthUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      avatar: user.avatar || undefined,
      emailVerified: false, // Default for now
      twoFactorEnabled: false, // Default for now
    };
  }

  private async findUserBySocialId(provider: string, socialId: string) {
    const fieldMap: Record<string, string> = {
      google: 'googleId',
      github: 'githubId',
      apple: 'appleId',
    };

    const field = fieldMap[provider];
    if (!field) return null;

    return await prisma.user.findUnique({
      where: { [field]: socialId } as any,
    });
  }

  private async createUserFromSocialProfile(provider: string, profile: any) {
    const fieldMap: Record<string, string> = {
      google: 'googleId',
      github: 'githubId',
      apple: 'appleId',
    };

    const field = fieldMap[provider];
    if (!field) throw new Error('Invalid provider');

    const userData: any = {
      username: profile.email.split('@')[0] + '_' + provider,
      email: profile.email,
      firstName: profile.name?.split(' ')[0],
      lastName: profile.name?.split(' ').slice(1).join(' '),
      avatar: profile.picture,
      [field]: profile.id,
    };

    return await prisma.user.create({
      data: userData,
    });
  }

  private isRateLimited(email: string, ipAddress?: string): boolean {
    const key = ipAddress || email;
    const attempts = this.loginAttempts.get(key);

    if (!attempts) return false;

    if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
      return true;
    }

    return attempts.count >= 5;
  }

  private incrementLoginAttempts(email: string, ipAddress?: string) {
    const key = ipAddress || email;
    const attempts = this.loginAttempts.get(key) || { count: 0 };

    attempts.count++;

    if (attempts.count >= 5) {
      attempts.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }

    this.loginAttempts.set(key, attempts);
  }

  private resetLoginAttempts(email: string, ipAddress?: string) {
    const key = ipAddress || email;
    this.loginAttempts.delete(key);
  }
}

export const authService = new AuthService();
