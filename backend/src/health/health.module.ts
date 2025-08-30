import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { RedisHealthIndicator } from './redis-health.indicator';
import { ExternalServiceHealthIndicator } from './external-service-health.indicator';
import { PrismaModule } from '../prisma/prisma.module';
import { MetricsModule } from '../common/metrics/metrics.module';
import { LoggingModule } from '../common/logging/logging.module';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    ConfigModule,
    PrismaModule,
    MetricsModule,
    LoggingModule,
  ],
  controllers: [HealthController],
  providers: [
    PrismaHealthIndicator,
    RedisHealthIndicator,
    ExternalServiceHealthIndicator,
  ],
})
export class HealthModule {}
