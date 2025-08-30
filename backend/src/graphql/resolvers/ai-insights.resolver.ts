import { Resolver, Query, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AIInsightsService } from '../../ai-insights/ai-insights.service';
import { Insight, MonthlyReport } from '../types/analytics.types';
import { InsightType } from '../types/common.types';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AIInsightsResolver {
  constructor(private aiInsightsService: AIInsightsService) {}

  @Query(() => [Insight])
  async insights(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('type', { type: () => InsightType, nullable: true }) type?: InsightType,
  ): Promise<Insight[]> {
    // Placeholder implementation - would integrate with actual AI insights service
    return [];
  }

  @Query(() => MonthlyReport, { nullable: true })
  async monthlyReport(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('year', { type: () => Int }) year: number,
    @Args('month', { type: () => Int }) month: number,
  ): Promise<MonthlyReport | null> {
    // Placeholder implementation
    return null;
  }
}
