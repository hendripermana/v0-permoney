import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
