import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { AIInsightsService } from './ai-insights.service';
import { AIInsightsController } from './ai-insights.controller';
import { SpendingPatternService } from './services/spending-pattern.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { NarrativeGenerationService } from './services/narrative-generation.service';
import { RecommendationService } from './services/recommendation.service';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [AIInsightsController],
  providers: [
    AIInsightsService,
    SpendingPatternService,
    AnomalyDetectionService,
    NarrativeGenerationService,
    RecommendationService,
  ],
  exports: [AIInsightsService],
})
export class AIInsightsModule {}
