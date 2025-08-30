import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventProcessor } from './processors/event.processor';
import { BehaviorAnalysisService } from './services/behavior-analysis.service';
import { PatternDetectionService } from './services/pattern-detection.service';
import { InsightGenerationService } from './services/insight-generation.service';
import { AnalyticsQueries } from './queries/analytics.queries';
import { EventTrackingInterceptor } from './interceptors/event-tracking.interceptor';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    BullModule.registerQueue({
      name: 'events',
    }),
    BullModule.registerQueue({
      name: 'analytics',
    }),
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventProcessor,
    BehaviorAnalysisService,
    PatternDetectionService,
    InsightGenerationService,
    AnalyticsQueries,
    EventTrackingInterceptor,
  ],
  exports: [
    EventsService, 
    BehaviorAnalysisService, 
    EventTrackingInterceptor,
    AnalyticsQueries,
  ],
})
export class EventsModule {}
