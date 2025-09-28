import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { ClerkAuthController } from './clerk-auth.controller';
import { AuthService } from './auth.service';
import { ClerkService } from './services/clerk.service';
import { PasswordService } from './services/password.service';
import { JwtService } from './services/jwt.service';
import { SessionService } from './services/session.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordResetService } from './services/password-reset.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UserContextService } from './services/user-context.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, ClerkAuthController],
  providers: [
    AuthService,
    ClerkService,
    PasswordService,
    JwtService,
    SessionService,
    EmailVerificationService,
    PasswordResetService,
    JwtAuthGuard,
    PrismaService,
    UserContextService,
  ],
  exports: [AuthService, JwtAuthGuard, JwtService, UserContextService],
})
export class AuthModule {}