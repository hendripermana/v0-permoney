import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CacheService } from '../cache/cache.service';

export interface CreateSessionData {
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

export interface UpdateSessionData {
  token?: string;
  expiresAt?: Date;
}

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
  private readonly MAX_SESSIONS_PER_USER = 5;
  private readonly REDIS_SESSION_PREFIX = 'session:';
  private readonly REDIS_USER_SESSIONS_PREFIX = 'user_sessions:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly cacheService: CacheService,
  ) {}

  async createSession(data: CreateSessionData): Promise<SessionData> {
    // Clean up old sessions for the user if they exceed the limit
    await this.cleanupUserSessions(data.userId);

    // Create session in database
    const dbSession = await this.prisma.session.create({
      data: {
        userId: data.userId,
        token: data.token,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        expiresAt: data.expiresAt,
      },
    });

    // Create session data for Redis
    const sessionData: SessionData = {
      id: dbSession.id,
      userId: dbSession.userId,
      token: dbSession.token,
      userAgent: dbSession.userAgent,
      ipAddress: dbSession.ipAddress,
      createdAt: dbSession.createdAt,
      expiresAt: dbSession.expiresAt,
      lastActivity: new Date(),
    };

    // Store in Redis with TTL
    const ttlSeconds = Math.floor((data.expiresAt.getTime() - Date.now()) / 1000);
    await this.redisService.setSession(dbSession.id, sessionData, ttlSeconds);

    // Add to user's session set
    await this.redisService.sadd(`${this.REDIS_USER_SESSIONS_PREFIX}${data.userId}`, dbSession.id);

    this.logger.log(`Created session ${dbSession.id} for user ${data.userId}`);
    return sessionData;
  }

  async findByToken(token: string): Promise<SessionData | null> {
    // First try to find in database to get session ID
    const dbSession = await this.prisma.session.findUnique({
      where: { token },
      select: { id: true },
    });

    if (!dbSession) {
      return null;
    }

    // Try to get from Redis first
    const cachedSession = await this.redisService.getSession(dbSession.id);
    if (cachedSession) {
      // Update last activity
      cachedSession.lastActivity = new Date();
      await this.redisService.setSession(dbSession.id, cachedSession);
      return cachedSession;
    }

    // Fallback to database
    const session = await this.prisma.session.findUnique({
      where: { token },
    });

    if (!session) {
      return null;
    }

    const sessionData: SessionData = {
      id: session.id,
      userId: session.userId,
      token: session.token,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastActivity: new Date(),
    };

    // Cache in Redis
    const ttlSeconds = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
    if (ttlSeconds > 0) {
      await this.redisService.setSession(session.id, sessionData, ttlSeconds);
    }

    return sessionData;
  }

  async updateSession(sessionId: string, data: UpdateSessionData): Promise<SessionData | null> {
    // Update in database
    const updatedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data,
    });

    // Update in Redis
    const cachedSession = await this.redisService.getSession(sessionId);
    if (cachedSession) {
      const updatedSessionData: SessionData = {
        ...cachedSession,
        token: data.token || cachedSession.token,
        expiresAt: data.expiresAt || cachedSession.expiresAt,
        lastActivity: new Date(),
      };

      const ttlSeconds = Math.floor((updatedSessionData.expiresAt.getTime() - Date.now()) / 1000);
      if (ttlSeconds > 0) {
        await this.redisService.setSession(sessionId, updatedSessionData, ttlSeconds);
      } else {
        await this.redisService.deleteSession(sessionId);
      }

      return updatedSessionData;
    }

    // If not in cache, create session data from database
    const sessionData: SessionData = {
      id: updatedSession.id,
      userId: updatedSession.userId,
      token: updatedSession.token,
      userAgent: updatedSession.userAgent,
      ipAddress: updatedSession.ipAddress,
      createdAt: updatedSession.createdAt,
      expiresAt: updatedSession.expiresAt,
      lastActivity: new Date(),
    };

    const ttlSeconds = Math.floor((sessionData.expiresAt.getTime() - Date.now()) / 1000);
    if (ttlSeconds > 0) {
      await this.redisService.setSession(sessionId, sessionData, ttlSeconds);
    }

    return sessionData;
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      // Get session data to find user ID
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        select: { userId: true },
      });

      // Delete from database
      await this.prisma.session.delete({
        where: { id: sessionId },
      });

      // Delete from Redis
      await this.redisService.deleteSession(sessionId);

      // Remove from user's session set
      if (session) {
        await this.redisService.srem(`${this.REDIS_USER_SESSIONS_PREFIX}${session.userId}`, sessionId);
      }

      this.logger.log(`Deleted session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to delete session ${sessionId}:`, error);
      throw error;
    }
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    try {
      // Get all session IDs for the user
      const sessions = await this.prisma.session.findMany({
        where: { userId },
        select: { id: true },
      });

      // Delete from database
      await this.prisma.session.deleteMany({
        where: { userId },
      });

      // Delete from Redis
      for (const session of sessions) {
        await this.redisService.deleteSession(session.id);
      }

      // Clear user's session set
      await this.redisService.del(`${this.REDIS_USER_SESSIONS_PREFIX}${userId}`);

      this.logger.log(`Deleted all sessions for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete all sessions for user ${userId}:`, error);
      throw error;
    }
  }

  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return false;
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      await this.deleteSession(sessionId);
      return false;
    }

    return true;
  }

  async extendSession(sessionId: string): Promise<void> {
    try {
      // Try to get from Redis first
      let sessionData = await this.redisService.getSession(sessionId);
      
      if (!sessionData) {
        // Fallback to database
        const dbSession = await this.prisma.session.findUnique({
          where: { id: sessionId },
        });

        if (!dbSession) {
          return;
        }

        sessionData = {
          id: dbSession.id,
          userId: dbSession.userId,
          token: dbSession.token,
          userAgent: dbSession.userAgent,
          ipAddress: dbSession.ipAddress,
          createdAt: dbSession.createdAt,
          expiresAt: dbSession.expiresAt,
          lastActivity: new Date(),
        };
      }

      // Check if session hasn't exceeded absolute timeout
      const sessionAge = Date.now() - sessionData.createdAt.getTime();
      if (sessionAge > this.ABSOLUTE_TIMEOUT) {
        await this.deleteSession(sessionId);
        return;
      }

      // Extend session by idle timeout
      const newExpiresAt = new Date(Date.now() + this.IDLE_TIMEOUT);
      await this.updateSession(sessionId, { expiresAt: newExpiresAt });

      this.logger.debug(`Extended session ${sessionId} until ${newExpiresAt}`);
    } catch (error) {
      this.logger.error(`Failed to extend session ${sessionId}:`, error);
    }
  }

  private async cleanupUserSessions(userId: string): Promise<void> {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Remove expired sessions
    const expiredSessions = sessions.filter(session => session.expiresAt < new Date());
    if (expiredSessions.length > 0) {
      await this.prisma.session.deleteMany({
        where: {
          id: { in: expiredSessions.map(s => s.id) },
        },
      });
    }

    // Remove oldest sessions if user has too many active sessions
    const activeSessions = sessions.filter(session => session.expiresAt >= new Date());
    if (activeSessions.length >= this.MAX_SESSIONS_PER_USER) {
      const sessionsToDelete = activeSessions.slice(this.MAX_SESSIONS_PER_USER - 1);
      await this.prisma.session.deleteMany({
        where: {
          id: { in: sessionsToDelete.map(s => s.id) },
        },
      });
    }
  }

  // Cleanup expired sessions every hour
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions(): Promise<void> {
    const deletedCount = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${deletedCount.count} expired sessions`);
  }

  // Security method to revoke all sessions for a user (useful for security incidents)
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.deleteAllUserSessions(userId);
  }

  // Get session statistics for monitoring
  async getSessionStats() {
    const [totalSessions, expiredSessions, activeSessions] = await Promise.all([
      this.prisma.session.count(),
      this.prisma.session.count({
        where: { expiresAt: { lt: new Date() } },
      }),
      this.prisma.session.count({
        where: { expiresAt: { gte: new Date() } },
      }),
    ]);

    return {
      total: totalSessions,
      expired: expiredSessions,
      active: activeSessions,
    };
  }
}
