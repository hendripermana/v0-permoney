import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InMemoryAuthController } from './in-memory-auth.controller';
import { InMemoryAuthService } from './services/in-memory-auth.service';
import { PasswordService } from './services/password.service';
import { JwtService } from './services/jwt.service';
import { InMemoryJwtAuthGuard } from './in-memory-auth.guard';

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
  controllers: [InMemoryAuthController],
  providers: [
    InMemoryAuthService,
    PasswordService,
    JwtService,
    InMemoryJwtAuthGuard,
  ],
  exports: [InMemoryAuthService, InMemoryJwtAuthGuard, JwtService],
})
export class InMemoryAuthModule {}
