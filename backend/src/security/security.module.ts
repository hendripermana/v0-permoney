import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './services/encryption.service';
import { AuditService } from './services/audit.service';
import { SecurityScannerService } from './services/security-scanner.service';
import { RateLimitService } from './services/rate-limit.service';
import { IncidentResponseService } from './services/incident-response.service';
import { SecurityController } from './security.controller';
import { SecurityGuard } from './guards/security.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { SecurityMiddleware } from './middleware/security.middleware';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [ConfigModule, PrismaModule, CacheModule],
  controllers: [SecurityController],
  providers: [
    EncryptionService,
    AuditService,
    SecurityScannerService,
    RateLimitService,
    IncidentResponseService,
    SecurityGuard,
    RateLimitGuard,
    SecurityMiddleware,
    AuditInterceptor,
  ],
  exports: [
    EncryptionService,
    AuditService,
    SecurityScannerService,
    RateLimitService,
    IncidentResponseService,
    SecurityGuard,
    RateLimitGuard,
    SecurityMiddleware,
    AuditInterceptor,
  ],
})
export class SecurityModule {}
