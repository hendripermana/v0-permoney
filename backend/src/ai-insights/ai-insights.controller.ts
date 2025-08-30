import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
  Body,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIInsightsService } from './ai-insights.service';
import {
  AIInsight,
  MonthlyReport,
  SpendingPattern,
  FinancialAnomaly,
  PersonalizedRecommendation,
} from './types/ai-insights.types';
import {
  GenerateInsightsDto,
  PatternAnalysisDto,
  AnomalyDetectionDto,
  MonthlyReportDto,
} from './dto/ai-insights.dto';

// @ApiTags('AI Insights')
// @ApiBearerAuth()
@Controller('ai-insights')
@UseGuards(JwtAuthGuard)
export class AIInsightsController {
  constructor(private readonly aiInsightsService: AIInsightsService) {}

  /**
   * Generate comprehensive AI insights for a household
   */
  @Post(':householdId/generate')
  @HttpCode(HttpStatus.CREATED)
  async generateInsights(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() options?: GenerateInsightsDto
  ): Promise<AIInsight[]> {
    this.validateHouseholdId(householdId);
    return this.aiInsightsService.generateInsights(householdId, options);
  }

  /**
   * Get stored insights for a household
   */
  @Get(':householdId/insights')
  async getInsights(
    @Param('householdId', ParseUUIDPipe) householdId: string
  ): Promise<AIInsight[]> {
    this.validateHouseholdId(householdId);
    return this.aiInsightsService.getStoredInsights(householdId);
  }

  /**
   * Generate monthly report with storytelling
   */
  @Post(':householdId/monthly-report/:year/:month')
  @HttpCode(HttpStatus.CREATED)
  async generateMonthlyReport(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Body() options?: MonthlyReportDto
  ): Promise<MonthlyReport> {
    this.validateHouseholdId(householdId);
    this.validateDateParams(year, month);
    return this.aiInsightsService.generateMonthlyReport(
      householdId,
      year,
      month,
      options
    );
  }

  /**
   * Get spending patterns for a household
   */
  @Get(':householdId/spending-patterns')
  async getSpendingPatterns(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() options?: PatternAnalysisDto
  ): Promise<SpendingPattern[]> {
    this.validateHouseholdId(householdId);
    return this.aiInsightsService.getSpendingPatterns(householdId, options);
  }

  /**
   * Detect financial anomalies
   */
  @Get(':householdId/anomalies')
  async detectAnomalies(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() options?: AnomalyDetectionDto
  ): Promise<FinancialAnomaly[]> {
    this.validateHouseholdId(householdId);
    return this.aiInsightsService.detectAnomalies(householdId, options);
  }

  /**
   * Get personalized recommendations
   */
  @Get(':householdId/recommendations')
  async getRecommendations(
    @Param('householdId', ParseUUIDPipe) householdId: string
  ): Promise<PersonalizedRecommendation[]> {
    this.validateHouseholdId(householdId);
    return this.aiInsightsService.getRecommendations(householdId);
  }

  /**
   * Dismiss an insight
   */
  @Delete('insights/:insightId')
  async dismissInsight(
    @Param('insightId', ParseUUIDPipe) insightId: string
  ): Promise<void> {
    this.validateInsightId(insightId);
    return this.aiInsightsService.dismissInsight(insightId);
  }

  /**
   * Validate household ID format and constraints
   */
  private validateHouseholdId(householdId: string): void {
    if (!householdId || householdId.trim().length === 0) {
      throw new BadRequestException('Household ID is required');
    }
    // UUID validation is handled by ParseUUIDPipe
  }

  /**
   * Validate insight ID format and constraints
   */
  private validateInsightId(insightId: string): void {
    if (!insightId || insightId.trim().length === 0) {
      throw new BadRequestException('Insight ID is required');
    }
    // UUID validation is handled by ParseUUIDPipe
  }

  /**
   * Validate date parameters for monthly reports
   */
  private validateDateParams(year: number, month: number): void {
    const currentYear = new Date().getFullYear();

    if (year < 2020 || year > currentYear + 1) {
      throw new BadRequestException(
        `Year must be between 2020 and ${currentYear + 1}`
      );
    }

    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    // Don't allow future months beyond current month
    const currentDate = new Date();
    const requestedDate = new Date(year, month - 1);

    if (requestedDate > currentDate) {
      throw new BadRequestException(
        'Cannot generate reports for future months'
      );
    }
  }
}
