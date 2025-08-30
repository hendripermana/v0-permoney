import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SpendingPattern, PatternAnalysisOptions } from '../types/ai-insights.types';

@Injectable()
export class SpendingPatternService {
  private readonly logger = new Logger(SpendingPatternService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analyze spending patterns for a household
   */
  async analyzeSpendingPatterns(
    householdId: string,
    options: PatternAnalysisOptions = {},
  ): Promise<SpendingPattern[]> {
    this.validateHouseholdId(householdId);
    this.validateOptions(options);
    
    this.logger.log(`Analyzing spending patterns for household ${householdId}`);

    const {
      minFrequency = 3,
      minConfidence = 0.5,
      includeSeasonality = true,
      includeTrends = true,
    } = options;

    try {
      const patterns: SpendingPattern[] = [];

      // Analyze different pattern types
      const [
        dailyPatterns,
        weeklyPatterns,
        monthlyPatterns,
        seasonalPatterns,
      ] = await Promise.all([
        this.analyzeDailyPatterns(householdId, minFrequency, minConfidence),
        this.analyzeWeeklyPatterns(householdId, minFrequency, minConfidence),
        this.analyzeMonthlyPatterns(householdId, minFrequency, minConfidence),
        includeSeasonality ? this.analyzeSeasonalPatterns(householdId, minFrequency, minConfidence) : [],
      ]);

      patterns.push(...dailyPatterns, ...weeklyPatterns, ...monthlyPatterns, ...seasonalPatterns);

      // Add trend analysis if requested
      if (includeTrends) {
        await this.addTrendAnalysis(patterns, householdId);
      }

      // Store patterns in database
      await this.storeSpendingPatterns(householdId, patterns);

      this.logger.log(`Found ${patterns.length} spending patterns for household ${householdId}`);
      return patterns;
    } catch (error) {
      this.logger.error(`Failed to analyze spending patterns for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Analyze daily spending patterns
   */
  private async analyzeDailyPatterns(
    householdId: string,
    minFrequency: number,
    minConfidence: number,
  ): Promise<SpendingPattern[]> {
    const patterns: SpendingPattern[] = [];

    // Get transactions from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: ninetyDaysAgo },
        amountCents: { gt: 0 }, // Only expenses
      },
      include: { category: true },
    });

    // Group by category and analyze daily patterns
    const categoryGroups = this.groupTransactionsByCategory(transactions);

    for (const [categoryId, categoryTransactions] of categoryGroups.entries()) {
      const dailySpending = this.aggregateByDay(categoryTransactions);
      
      if (dailySpending.length < minFrequency) continue;

      const averageAmount = this.calculateAverage(dailySpending.map(d => d.amount));
      const confidence = this.calculateConfidence(dailySpending.map(d => d.amount));

      if (confidence >= minConfidence) {
        patterns.push({
          householdId,
          type: 'DAILY',
          categoryId,
          categoryName: categoryTransactions[0].category?.name || 'Uncategorized',
          averageAmount,
          frequency: dailySpending.length,
          confidence,
          trend: 'STABLE', // Will be updated in trend analysis
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze weekly spending patterns
   */
  private async analyzeWeeklyPatterns(
    householdId: string,
    minFrequency: number,
    minConfidence: number,
  ): Promise<SpendingPattern[]> {
    const patterns: SpendingPattern[] = [];

    // Get transactions from the last 12 weeks
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: twelveWeeksAgo },
        amountCents: { gt: 0 },
      },
      include: { category: true },
    });

    // Group by category and day of week
    const categoryGroups = this.groupTransactionsByCategory(transactions);

    for (const [categoryId, categoryTransactions] of categoryGroups.entries()) {
      const weeklyPatterns = this.analyzeWeeklySpendingByDay(categoryTransactions);

      for (const [dayOfWeek, dayData] of weeklyPatterns.entries()) {
        if (dayData.frequency < minFrequency) continue;

        const confidence = this.calculateConfidence(dayData.amounts);

        if (confidence >= minConfidence) {
          patterns.push({
            householdId,
            type: 'WEEKLY',
            categoryId,
            categoryName: categoryTransactions[0].category?.name || 'Uncategorized',
            dayOfWeek,
            averageAmount: dayData.average,
            frequency: dayData.frequency,
            confidence,
            trend: 'STABLE',
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Analyze monthly spending patterns
   */
  private async analyzeMonthlyPatterns(
    householdId: string,
    minFrequency: number,
    minConfidence: number,
  ): Promise<SpendingPattern[]> {
    const patterns: SpendingPattern[] = [];

    // Get transactions from the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: twelveMonthsAgo },
        amountCents: { gt: 0 },
      },
      include: { category: true },
    });

    // Group by category and analyze monthly patterns
    const categoryGroups = this.groupTransactionsByCategory(transactions);

    for (const [categoryId, categoryTransactions] of categoryGroups.entries()) {
      const monthlySpending = this.aggregateByMonth(categoryTransactions);
      
      if (monthlySpending.length < minFrequency) continue;

      const averageAmount = this.calculateAverage(monthlySpending.map(m => m.amount));
      const confidence = this.calculateConfidence(monthlySpending.map(m => m.amount));

      if (confidence >= minConfidence) {
        patterns.push({
          householdId,
          type: 'MONTHLY',
          categoryId,
          categoryName: categoryTransactions[0].category?.name || 'Uncategorized',
          averageAmount,
          frequency: monthlySpending.length,
          confidence,
          trend: 'STABLE',
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze seasonal spending patterns
   */
  private async analyzeSeasonalPatterns(
    householdId: string,
    minFrequency: number,
    minConfidence: number,
  ): Promise<SpendingPattern[]> {
    const patterns: SpendingPattern[] = [];

    // Get transactions from the last 24 months for seasonal analysis
    const twentyFourMonthsAgo = new Date();
    twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: twentyFourMonthsAgo },
        amountCents: { gt: 0 },
      },
      include: { category: true },
    });

    // Group by category and analyze seasonal patterns
    const categoryGroups = this.groupTransactionsByCategory(transactions);

    for (const [categoryId, categoryTransactions] of categoryGroups.entries()) {
      const seasonalPatterns = this.analyzeSeasonalSpendingByMonth(categoryTransactions);

      for (const [month, monthData] of seasonalPatterns.entries()) {
        if (monthData.frequency < minFrequency) continue;

        const confidence = this.calculateConfidence(monthData.amounts);

        if (confidence >= minConfidence) {
          patterns.push({
            householdId,
            type: 'SEASONAL',
            categoryId,
            categoryName: categoryTransactions[0].category?.name || 'Uncategorized',
            month,
            averageAmount: monthData.average,
            frequency: monthData.frequency,
            confidence,
            trend: 'STABLE',
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Add trend analysis to patterns
   */
  private async addTrendAnalysis(patterns: SpendingPattern[], householdId: string): Promise<void> {
    for (const pattern of patterns) {
      const trend = await this.calculateTrend(pattern, householdId);
      pattern.trend = trend;
    }
  }

  /**
   * Calculate trend for a pattern
   */
  private async calculateTrend(pattern: SpendingPattern, householdId: string): Promise<'INCREASING' | 'DECREASING' | 'STABLE'> {
    // Get recent transactions for trend analysis
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        householdId,
        categoryId: pattern.categoryId,
        date: { gte: sixMonthsAgo },
        amountCents: { gt: 0 },
      },
      orderBy: { date: 'asc' },
    });

    if (transactions.length < 6) return 'STABLE';

    // Split into two halves and compare
    const midPoint = Math.floor(transactions.length / 2);
    const firstHalf = transactions.slice(0, midPoint);
    const secondHalf = transactions.slice(midPoint);

    const firstHalfAvg = this.calculateAverage(firstHalf.map(t => Number(t.amountCents)));
    const secondHalfAvg = this.calculateAverage(secondHalf.map(t => Number(t.amountCents)));

    const changePercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    if (changePercentage > 10) return 'INCREASING';
    if (changePercentage < -10) return 'DECREASING';
    return 'STABLE';
  }

  /**
   * Group transactions by category
   */
  private groupTransactionsByCategory(transactions: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();

    for (const transaction of transactions) {
      const categoryId = transaction.categoryId || 'uncategorized';
      if (!groups.has(categoryId)) {
        groups.set(categoryId, []);
      }
      groups.get(categoryId)!.push(transaction);
    }

    return groups;
  }

  /**
   * Aggregate transactions by day
   */
  private aggregateByDay(transactions: any[]): { date: string; amount: number }[] {
    const dailySpending = new Map<string, number>();

    for (const transaction of transactions) {
      const date = transaction.date.toISOString().split('T')[0];
      const amount = Number(transaction.amountCents);
      dailySpending.set(date, (dailySpending.get(date) || 0) + amount);
    }

    return Array.from(dailySpending.entries()).map(([date, amount]) => ({ date, amount }));
  }

  /**
   * Aggregate transactions by month
   */
  private aggregateByMonth(transactions: any[]): { month: string; amount: number }[] {
    const monthlySpending = new Map<string, number>();

    for (const transaction of transactions) {
      const month = transaction.date.toISOString().substring(0, 7); // YYYY-MM
      const amount = Number(transaction.amountCents);
      monthlySpending.set(month, (monthlySpending.get(month) || 0) + amount);
    }

    return Array.from(monthlySpending.entries()).map(([month, amount]) => ({ month, amount }));
  }

  /**
   * Analyze weekly spending by day of week
   */
  private analyzeWeeklySpendingByDay(transactions: any[]): Map<number, { average: number; frequency: number; amounts: number[] }> {
    const weeklyPatterns = new Map<number, number[]>();

    for (const transaction of transactions) {
      const dayOfWeek = new Date(transaction.date).getDay();
      const amount = Number(transaction.amountCents);
      
      if (!weeklyPatterns.has(dayOfWeek)) {
        weeklyPatterns.set(dayOfWeek, []);
      }
      weeklyPatterns.get(dayOfWeek)!.push(amount);
    }

    const result = new Map<number, { average: number; frequency: number; amounts: number[] }>();

    for (const [dayOfWeek, amounts] of weeklyPatterns.entries()) {
      result.set(dayOfWeek, {
        average: this.calculateAverage(amounts),
        frequency: amounts.length,
        amounts,
      });
    }

    return result;
  }

  /**
   * Analyze seasonal spending by month
   */
  private analyzeSeasonalSpendingByMonth(transactions: any[]): Map<number, { average: number; frequency: number; amounts: number[] }> {
    const seasonalPatterns = new Map<number, number[]>();

    for (const transaction of transactions) {
      const month = new Date(transaction.date).getMonth() + 1; // 1-12
      const amount = Number(transaction.amountCents);
      
      if (!seasonalPatterns.has(month)) {
        seasonalPatterns.set(month, []);
      }
      seasonalPatterns.get(month)!.push(amount);
    }

    const result = new Map<number, { average: number; frequency: number; amounts: number[] }>();

    for (const [month, amounts] of seasonalPatterns.entries()) {
      result.set(month, {
        average: this.calculateAverage(amounts),
        frequency: amounts.length,
        amounts,
      });
    }

    return result;
  }

  /**
   * Calculate average of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Calculate confidence score based on variance
   */
  private calculateConfidence(amounts: number[]): number {
    if (amounts.length < 2) return 0;

    const mean = this.calculateAverage(amounts);
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Confidence is inversely related to coefficient of variation
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 1;
    
    // Convert to 0-1 scale where lower variation = higher confidence
    return Math.max(0, Math.min(1, 1 - coefficientOfVariation));
  }

  /**
   * Store spending patterns in database
   */
  private async storeSpendingPatterns(householdId: string, patterns: SpendingPattern[]): Promise<void> {
    if (patterns.length === 0) return;

    // Delete old patterns for this household
    await this.prisma.spendingPattern.deleteMany({
      where: { householdId },
    });

    // Insert new patterns
    await this.prisma.spendingPattern.createMany({
      data: patterns.map(pattern => ({
        householdId: pattern.householdId,
        userId: pattern.userId,
        patternType: pattern.type,
        categoryId: pattern.categoryId,
        merchant: pattern.merchant,
        dayOfWeek: pattern.dayOfWeek,
        hourOfDay: pattern.hourOfDay,
        month: pattern.month,
        averageAmountCents: pattern.averageAmount,
        frequency: pattern.frequency,
        confidenceScore: pattern.confidence,
      })),
    });
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
   * Validate pattern analysis options
   */
  private validateOptions(options: PatternAnalysisOptions): void {
    if (options.minFrequency !== undefined) {
      if (!Number.isInteger(options.minFrequency) || options.minFrequency < 1) {
        throw new BadRequestException('minFrequency must be a positive integer');
      }
    }

    if (options.minConfidence !== undefined) {
      if (typeof options.minConfidence !== 'number' || options.minConfidence < 0 || options.minConfidence > 1) {
        throw new BadRequestException('minConfidence must be a number between 0 and 1');
      }
    }
  }
}
