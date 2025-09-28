import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { PasswordService } from './password.service';
import { JwtService } from './jwt.service';
import { 
  RegisterDto, 
  LoginDto, 
  RefreshTokenDto, 
  AuthResponseDto,
  UserProfileDto
} from '../dto/auth.dto';

interface InMemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  emailVerified: boolean;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemorySession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date;
}

@Injectable()
export class InMemoryAuthService {
  private users: Map<string, InMemoryUser> = new Map();
  private sessions: Map<string, InMemorySession> = new Map();
  private usersByEmail: Map<string, string> = new Map(); // email -> userId mapping

  constructor(
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto, userAgent?: string, ipAddress?: string): Promise<AuthResponseDto> {
    const { email, password, name } = registerDto;

    // Check if user already exists
    if (this.usersByEmail.has(email)) {
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
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: InMemoryUser = {
      id: userId,
      email,
      passwordHash,
      name,
      emailVerified: true, // Auto-verify for testing
      isActive: true,
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(userId, user);
    this.usersByEmail.set(email, userId);

    // Create session
    const session = await this.createSession(userId, userAgent, ipAddress);

    // Generate tokens
    const tokenPair = this.jwtService.generateTokenPair({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'access',
    });

    // Update session with correct tokens
    session.token = tokenPair.accessToken;
    session.refreshToken = tokenPair.refreshToken;
    this.sessions.set(session.id, session);

    return {
      success: true,
      message: 'Registration successful',
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

  async login(loginDto: LoginDto, userAgent?: string, ipAddress?: string): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const userId = this.usersByEmail.get(email);
    if (!userId) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = this.users.get(userId);
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
    if (!(await this.passwordService.comparePassword(password, user.passwordHash))) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }
      user.updatedAt = new Date();
      this.users.set(userId, user);

      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = new Date();
    user.updatedAt = new Date();
    this.users.set(userId, user);

    // Create session
    const session = await this.createSession(userId, userAgent, ipAddress);

    // Generate tokens
    const tokenPair = this.jwtService.generateTokenPair({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'access',
    });

    // Update session with correct tokens
    session.token = tokenPair.accessToken;
    session.refreshToken = tokenPair.refreshToken;
    this.sessions.set(session.id, session);

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
    const session = this.findActiveRefreshSession(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user
    const user = this.users.get(payload.sub);
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
    session.token = tokenPair.accessToken;
    session.refreshToken = tokenPair.refreshToken;
    session.lastUsedAt = new Date();
    this.sessions.set(session.id, session);

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
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.set(sessionId, session);
    }

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = this.users.get(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async validateSession(token: string): Promise<{ userId: string; sessionId: string } | null> {
    try {
      const payload = this.jwtService.verifyAccessToken(token);
      const session = this.findActiveSession(token);
      
      if (!session) {
        return null;
      }

      // Update last used
      session.lastUsedAt = new Date();
      this.sessions.set(session.id, session);

      return {
        userId: payload.sub,
        sessionId: session.id,
      };
    } catch {
      return null;
    }
  }

  private async createSession(userId: string, userAgent?: string, ipAddress?: string): Promise<InMemorySession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session: InMemorySession = {
      id: sessionId,
      userId,
      token: '', // Will be set later
      refreshToken: '', // Will be set later
      expiresAt,
      refreshExpiresAt,
      userAgent,
      ipAddress,
      isActive: true,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  private findActiveSession(token: string): InMemorySession | null {
    for (const session of this.sessions.values()) {
      if (session.token === token && session.isActive && session.expiresAt > new Date()) {
        return session;
      }
    }
    return null;
  }

  private findActiveRefreshSession(refreshToken: string): InMemorySession | null {
    for (const session of this.sessions.values()) {
      if (session.refreshToken === refreshToken && session.isActive && session.refreshExpiresAt > new Date()) {
        return session;
      }
    }
    return null;
  }
}
