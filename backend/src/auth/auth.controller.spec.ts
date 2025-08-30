import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasskeyService } from './passkey.service';
import { SessionService } from './session.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 900,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
            logoutAll: jest.fn(),
          },
        },
        {
          provide: PasskeyService,
          useValue: {
            generateRegistrationOptions: jest.fn(),
            verifyRegistration: jest.fn(),
            generateAuthenticationOptions: jest.fn(),
            verifyAuthentication: jest.fn(),
            getUserPasskeys: jest.fn(),
            deletePasskey: jest.fn(),
            renamePasskey: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            getUserSessions: jest.fn(),
            deleteSession: jest.fn(),
            revokeAllUserSessions: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    await app.init();

    authService = module.get(AuthService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      authService.register.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        email: 'invalid-email',
        password: '123', // Too short
        name: '', // Empty
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      authService.login.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
        expect.any(String), // userAgent
        expect.any(String), // ipAddress
      );
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const refreshDto = {
        refreshToken: 'valid-refresh-token',
      };

      authService.refreshTokens.mockResolvedValue(mockTokens);

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshDto)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Tokens refreshed successfully');
      expect(response.body).toHaveProperty('tokens');
      expect(authService.refreshTokens).toHaveBeenCalledWith(refreshDto.refreshToken);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const refreshDto = {
        refreshToken: 'valid-refresh-token',
      };

      authService.logout.mockResolvedValue();

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send(refreshDto)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');
      expect(authService.logout).toHaveBeenCalledWith(refreshDto.refreshToken);
    });
  });
});
