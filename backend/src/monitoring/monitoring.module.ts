import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitoringController } from './monitoring.controller';
import { MonitoringModule as CommonMonitoringModule } from '../common/monitoring/monitoring.module';
import { MetricsModule } from '../common/metrics/metrics.module';
import { LoggingModule } from '../common/logging/logging.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    CommonMonitoringModule,
    MetricsModule,
    LoggingModule,
    PrismaModule,
    AuthModule,
  ],
  controllers: [MonitoringController],
})
export class MonitoringModule {}
