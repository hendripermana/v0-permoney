import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpendingPatternService } from './services/spending-pattern.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { NarrativeGenerationService } from './services/narrative-generation.service';
import { RecommendationService } from './services/recommendation.service';
import {
  AIInsight,
  MonthlyReport,
  SpendingPattern,
  FinancialAnomaly,
  PersonalizedRecommendation,
} from './types/ai-insights.types';

@Injectable()
export class AIInsightsService {
  private readonly logger = new Logger(AIInsightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly spendingPatternService: SpendingPatternService,
    private readonly anomalyDetectionService: AnomalyDetectionService,
    private readonly narrativeGenerationService: NarrativeGenerationService,
    private readonly recommendationService: RecommendationService,
  ) {}

  /**
   * Generate comprehensive AI insights for a household
   */
  async generateInsights(householdId: string, options?: any): Promise<AIInsight[]> {
    this.validateHouseholdId(householdId);
    this.logger.log(`Generating AI insights for household ${householdId}`);

    try {
      const [
        spendingPatterns,
        anomalies,
        recommendations,
      ] = await Promise.all([
        this.spendingPatternService.analyzeSpendingPatterns(householdId),
        this.anomalyDetectionService.detectAnomalies(householdId),
        this.recommendationService.generateRecommendations(householdId),
      ]);

      const insights: AIInsight[] = [
        ...this.convertPatternsToInsights(spendingPatterns),
        ...this.convertAnomaliesToInsights(anomalies),
        ...this.convertRecommendationsToInsights(recommendations),
      ];

      // Store insights in database
      await this.storeInsights(householdId, insights);

      this.logger.log(`Generated ${insights.length} AI insights for household ${householdId}`);
      return insights;
    } catch (error) {
      this.logger.error(`Failed to generate AI insights for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Generate monthly narrative report with storytelling
   */
  async generateMonthlyReport(
    householdId: string,
    year: number,
    month: number,
    options?: any,
  ): Promise<MonthlyReport> {
    this.validateHouseholdId(householdId);
    this.validateDateParams(year, month);
    this.logger.log(`Generating monthly report for household ${householdId}, ${year}-${month}`);

    try {
      const report = await this.narrativeGenerationService.generateMonthlyReport(
        householdId,
        year,
        month,
      );

      // Store report in database
      await this.storeMonthlyReport(householdId, report);

      return report;
    } catch (error) {
      this.logger.error(`Failed to generate monthly report for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Get spending patterns for a household
   */
  async getSpendingPatterns(householdId: string, options?: any): Promise<SpendingPattern[]> {
    this.validateHouseholdId(householdId);
    return this.spendingPatternService.analyzeSpendingPatterns(householdId, options);
  }

  /**
   * Detect financial anomalies
   */
  async detectAnomalies(householdId: string, options?: any): Promise<FinancialAnomaly[]> {
    this.validateHouseholdId(householdId);
    return this.anomalyDetectionService.detectAnomalies(householdId, options);
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(householdId: string): Promise<PersonalizedRecommendation[]> {
    this.validateHouseholdId(householdId);
    return this.recommendationService.generateRecommendations(householdId);
  }

  /**
   * Get stored insights for a household
   */
  async getStoredInsights(householdId: string): Promise<AIInsight[]> {
    const insights = await this.prisma.financialInsight.findMany({
      where: {
        householdId,
        OR: [
          { validUntil: { gte: new Date() } },
          { validUntil: null },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return insights.map(insight => ({
      id: insight.id,
      type: insight.insightType,
      title: insight.title,
      description: insight.description,
      data: insight.data as Record<string, unknown>,
      priority: insight.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      isActionable: insight.isActionable,
      validUntil: insight.validUntil,
      createdAt: insight.createdAt,
    }));
  }

  /**
   * Dismiss an insight
   */
  async dismissInsight(insightId: string): Promise<void> {
    this.validateInsightId(insightId);
    
    try {
      const result = await this.prisma.financialInsight.update({
        where: { id: insightId },
        data: { isDismissed: true },
      });
      
      if (!result) {
        throw new NotFoundException(`Insight with ID ${insightId} not found`);
      }
      
      this.logger.log(`Dismissed insight ${insightId}`);
    } catch (error) {
      if (error.code === 'P2025') { // Prisma record not found
        throw new NotFoundException(`Insight with ID ${insightId} not found`);
      }
      this.logger.error(`Failed to dismiss insight ${insightId}:`, error);
      throw error;
    }
  }

  /**
   * Convert spending patterns to insights
   */
  private convertPatternsToInsights(patterns: SpendingPattern[]): AIInsight[] {
    if (!patterns || !Array.isArray(patterns)) {
      return [];
    }
    return patterns.map(pattern => ({
      type: 'SPENDING_PATTERN',
      title: this.generatePatternTitle(pattern),
      description: this.generatePatternDescription(pattern),
      data: pattern,
      priority: this.calculatePatternPriority(pattern),
      isActionable: true,
    }));
  }

  /**
   * Convert anomalies to insights
   */
  private convertAnomaliesToInsights(anomalies: FinancialAnomaly[]): AIInsight[] {
    if (!anomalies || !Array.isArray(anomalies)) {
      return [];
    }
    return anomalies.map(anomaly => ({
      type: 'ANOMALY_DETECTED',
      title: anomaly.title,
      description: anomaly.description,
      data: anomaly,
      priority: anomaly.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      isActionable: true,
    }));
  }

  /**
   * Convert recommendations to insights
   */
  private convertRecommendationsToInsights(recommendations: PersonalizedRecommendation[]): AIInsight[] {
    if (!recommendations || !Array.isArray(recommendations)) {
      return [];
    }
    return recommendations.map(recommendation => ({
      type: 'RECOMMENDATION',
      title: recommendation.title,
      description: recommendation.description,
      data: recommendation,
      priority: recommendation.priority,
      isActionable: true,
    }));
  }

  /**
   * Generate title for spending pattern
   */
  private generatePatternTitle(pattern: SpendingPattern): string {
    switch (pattern.type) {
      case 'DAILY':
        return `Daily Spending Pattern in ${pattern.categoryName}`;
      case 'WEEKLY':
        return `Weekly Spending Pattern in ${pattern.categoryName}`;
      case 'MONTHLY':
        return `Monthly Spending Pattern in ${pattern.categoryName}`;
      case 'SEASONAL':
        return `Seasonal Spending Pattern in ${pattern.categoryName}`;
      default:
        return `Spending Pattern Detected`;
    }
  }

  /**
   * Generate description for spending pattern
   */
  private generatePatternDescription(pattern: SpendingPattern): string {
    const amount = this.formatCurrency(pattern.averageAmount);
    const confidence = (pattern.confidence * 100).toFixed(0);

    switch (pattern.type) {
      case 'DAILY':
        return `You typically spend ${amount} daily on ${pattern.categoryName} (${confidence}% confidence)`;
      case 'WEEKLY': {
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pattern.dayOfWeek || 0];
        return `You typically spend ${amount} on ${dayName}s for ${pattern.categoryName} (${confidence}% confidence)`;
      }
      case 'MONTHLY':
        return `You typically spend ${amount} monthly on ${pattern.categoryName} (${confidence}% confidence)`;
      case 'SEASONAL': {
        const monthName = new Date(2024, (pattern.month || 1) - 1).toLocaleString('default', { month: 'long' });
        return `You typically spend more on ${pattern.categoryName} in ${monthName} (${confidence}% confidence)`;
      }
      default:
        return `Spending pattern detected for ${pattern.categoryName}`;
    }
  }

  /**
   * Calculate priority for spending pattern
   */
  private calculatePatternPriority(pattern: SpendingPattern): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    if (pattern.confidence > 0.8 && pattern.averageAmount > 1000000) { // High confidence, high amount
      return 'HIGH';
    } else if (pattern.confidence > 0.6) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Store insights in database
   */
  private async storeInsights(householdId: string, insights: AIInsight[]): Promise<void> {
    if (insights.length === 0) return;

    // Delete old insights of the same types
    const insightTypes = [...new Set(insights.map(i => i.type))];
    await this.prisma.financialInsight.deleteMany({
      where: {
        householdId,
        insightType: { in: insightTypes },
      },
    });

    // Insert new insights
    await this.prisma.financialInsight.createMany({
      data: insights.map(insight => ({
        householdId,
        insightType: insight.type,
        title: insight.title,
        description: insight.description,
        data: insight.data,
        priority: insight.priority,
        isActionable: insight.isActionable,
        validUntil: insight.validUntil,
      })),
    });
  }

  /**
   * Store monthly report in database
   */
  private async storeMonthlyReport(householdId: string, report: MonthlyReport): Promise<void> {
    // Store as a special insight type
    await this.prisma.financialInsight.create({
      data: {
        householdId,
        insightType: 'MONTHLY_REPORT',
        title: report.title,
        description: report.summary,
        data: report,
        priority: 'MEDIUM',
        isActionable: false,
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Valid for 90 days
      },
    });
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amountCents: number): string {
    const amount = amountCents / 100;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Validate household ID
   */
  private validateHouseholdId(householdId: string): void {
    if (!householdId || typeof householdId !== 'string' || householdId.trim().length === 0) {
      throw new BadRequestException('Valid household ID is required');
    }
  }

  /**
   * Validate insight ID
   */
  private validateInsightId(insightId: string): void {
    if (!insightId || typeof insightId !== 'string' || insightId.trim().length === 0) {
      throw new BadRequestException('Valid insight ID is required');
    }
  }

  /**
   * Validate date parameters
   */
  private validateDateParams(year: number, month: number): void {
    const currentYear = new Date().getFullYear();
    
    if (!Number.isInteger(year) || year < 2020 || year > currentYear + 1) {
      throw new BadRequestException(`Year must be an integer between 2020 and ${currentYear + 1}`);
    }
    
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('Month must be an integer between 1 and 12');
    }

    // Don't allow future months beyond current month
    const currentDate = new Date();
    const requestedDate = new Date(year, month - 1);
    
    if (requestedDate > currentDate) {
      throw new BadRequestException('Cannot generate reports for future months');
    }
  }
}
