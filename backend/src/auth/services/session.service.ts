import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from './jwt.service';

export interface CreateSessionData {
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

export interface SessionInfo {
  id: string;
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
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async createSession(data: CreateSessionData): Promise<SessionInfo> {
    const { userId, token, userAgent, ipAddress, expiresAt } = data;

    // Calculate refresh token expiration
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create session in database
    const session = await this.prisma.session.create({
      data: {
        userId,
        token,
        refreshToken: '', // Will be generated separately if needed
        expiresAt,
        refreshExpiresAt,
        userAgent,
        ipAddress,
      },
    });

    return {
      id: session.id,
      token: session.token,
      refreshToken: session.refreshToken!,
      expiresAt: session.expiresAt,
      refreshExpiresAt: session.refreshExpiresAt!,
      userAgent: session.userAgent || undefined,
      ipAddress: session.ipAddress || undefined,
      isActive: session.isActive,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
    };
  }

  async findActiveSession(token: string): Promise<SessionInfo | null> {
    const session = await this.prisma.session.findFirst({
      where: {
        token,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      token: session.token,
      refreshToken: session.refreshToken!,
      expiresAt: session.expiresAt,
      refreshExpiresAt: session.refreshExpiresAt!,
      userAgent: session.userAgent || undefined,
      ipAddress: session.ipAddress || undefined,
      isActive: session.isActive,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
    };
  }

  async findActiveRefreshSession(refreshToken: string): Promise<SessionInfo | null> {
    const session = await this.prisma.session.findFirst({
      where: {
        refreshToken,
        isActive: true,
        refreshExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      token: session.token,
      refreshToken: session.refreshToken!,
      expiresAt: session.expiresAt,
      refreshExpiresAt: session.refreshExpiresAt!,
      userAgent: session.userAgent || undefined,
      ipAddress: session.ipAddress || undefined,
      isActive: session.isActive,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
    };
  }

  async updateSessionLastUsed(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date() },
    });
  }

  async deactivateSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  async deactivateAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { refreshExpiresAt: { lt: new Date() } },
        ],
        isActive: true,
      },
      data: { isActive: false },
    });

    return result.count;
  }

  async getUserActiveSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return sessions.map(session => ({
      id: session.id,
      token: session.token,
      refreshToken: session.refreshToken!,
      expiresAt: session.expiresAt,
      refreshExpiresAt: session.refreshExpiresAt!,
      userAgent: session.userAgent || undefined,
      ipAddress: session.ipAddress || undefined,
      isActive: session.isActive,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
    }));
  }
}
