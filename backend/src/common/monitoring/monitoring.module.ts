import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PerformanceMonitoringService } from './performance.service';
import { LoggingModule } from '../logging/logging.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    LoggingModule,
    MetricsModule,
  ],
  providers: [PerformanceMonitoringService],
  exports: [PerformanceMonitoringService],
})
export class MonitoringModule {}
