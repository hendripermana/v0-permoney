import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from './session.service';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let sessionService: jest.Mocked<SessionService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
    avatarUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
              };
              return config[key as keyof typeof config];
            }),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createSession: jest.fn(),
            findByToken: jest.fn(),
            updateSession: jest.fn(),
            deleteSession: jest.fn(),
            deleteAllUserSessions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    sessionService = module.get(SessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return user and tokens when login is successful', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.signAsync.mockResolvedValue('mock-token');
      sessionService.createSession.mockResolvedValue({} as any);

      const result = await service.login('test@example.com', 'password');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('test@example.com', 'wrong-password')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      prismaService.user.findUnique.mockResolvedValue(inactiveUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await expect(
        service.login('test@example.com', 'password')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create user and return tokens when registration is successful', async () => {
      prismaService.user.findUnique.mockResolvedValue(null); // User doesn't exist
      prismaService.user.create.mockResolvedValue(mockUser);
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
      jwtService.signAsync.mockResolvedValue('mock-token');

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const result = await service.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw BadRequestException when user already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await expect(service.register(userData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        token: 'refresh-token',
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        userAgent: null,
        ipAddress: null,
        createdAt: new Date(),
      };

      jwtService.verify.mockReturnValue({
        sub: 'user-1',
        email: 'test@example.com',
        type: 'refresh',
      });
      sessionService.findByToken.mockResolvedValue(mockSession);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('new-token');
      sessionService.updateSession.mockResolvedValue({} as any);

      const result = await service.refreshTokens('refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
