import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  TrendAnalysis,
  TrendPoint,
  SeasonalityData,
  SeasonalFactor,
  PeakPeriod,
  ForecastPoint,
  AnalyticsFilters,
} from '../types/analytics.types';

@Injectable()
export class TrendAnalyticsService {
  private readonly logger = new Logger(TrendAnalyticsService.name);
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Get comprehensive trend analysis
   */
  async getTrendAnalysis(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      period: 'daily' | 'weekly' | 'monthly' | 'yearly';
      trendType?: 'spending' | 'income' | 'net_worth' | 'category';
      includeSeasonality?: boolean;
      includeForecast?: boolean;
      forecastPeriods?: number;
    }
  ): Promise<TrendAnalysis> {
    const cacheKey = `trend_analytics:${householdId}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
    
    try {
      // Try to get from cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      this.logger.log(`Generating trend analysis for household ${householdId}`);

      const [
        trends,
        seasonality,
        forecast,
      ] = await Promise.all([
        this.getTrends(householdId, filters, options),
        options.includeSeasonality ? this.getSeasonality(householdId, filters, options) : this.getEmptySeasonality(),
        options.includeForecast ? this.getForecast(householdId, filters, options) : [],
      ]);

      const analysis: TrendAnalysis = {
        period: options.period.toUpperCase() as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
        trends,
        seasonality,
        forecast,
      };

      // Cache the result
      await this.cacheService.set(cacheKey, analysis, this.CACHE_TTL);

      return analysis;
    } catch (error) {
      this.logger.error(`Failed to get trend analysis for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Get trend data points
   */
  private async getTrends(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      period: 'daily' | 'weekly' | 'monthly' | 'yearly';
      trendType?: 'spending' | 'income' | 'net_worth' | 'category';
    }
  ): Promise<TrendPoint[]> {
    const dateGrouping = this.getDateGrouping(options.period);
    const trendType = options.trendType || 'spending';

    switch (trendType) {
      case 'spending':
        return this.getSpendingTrends(householdId, filters, dateGrouping);
      case 'income':
        return this.getIncomeTrends(householdId, filters, dateGrouping);
      case 'net_worth':
        return this.getNetWorthTrends(householdId, filters, dateGrouping);
      case 'category':
        return this.getCategoryTrends(householdId, filters, dateGrouping);
      default:
        return this.getSpendingTrends(householdId, filters, dateGrouping);
    }
  }

  /**
   * Get spending trends
   */
  private async getSpendingTrends(
    householdId: string,
    filters: AnalyticsFilters,
    dateGrouping: string
  ): Promise<TrendPoint[]> {
    const whereClause = this.buildWhereClause(householdId, filters);

    const results = await this.prisma.$queryRaw<Array<{
      date: Date;
      value: bigint;
    }>>`
      SELECT
        ${dateGrouping} as date,
        SUM(ABS(t.amount_cents)) as value
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
        AND t.amount_cents < 0 -- Only expenses
      GROUP BY ${dateGrouping}
      ORDER BY date
    `;

    return results.map(row => ({
      date: row.date,
      value: Number(row.value) / 100,
      type: 'SPENDING',
    }));
  }

  /**
   * Get income trends
   */
  private async getIncomeTrends(
    householdId: string,
    filters: AnalyticsFilters,
    dateGrouping: string
  ): Promise<TrendPoint[]> {
    const whereClause = this.buildWhereClause(householdId, filters);

    const results = await this.prisma.$queryRaw<Array<{
      date: Date;
      value: bigint;
    }>>`
      SELECT
        ${dateGrouping} as date,
        SUM(t.amount_cents) as value
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
        AND t.amount_cents > 0 -- Only income
      GROUP BY ${dateGrouping}
      ORDER BY date
    `;

    return results.map(row => ({
      date: row.date,
      value: Number(row.value) / 100,
      type: 'INCOME',
    }));
  }

  /**
   * Get net worth trends
   */
  private async getNetWorthTrends(
    householdId: string,
    filters: AnalyticsFilters,
    dateGrouping: string
  ): Promise<TrendPoint[]> {
    // Use materialized view if available
    const useView = await this.checkMaterializedViewExists('net_worth_tracking');

    if (useView) {
      return this.getNetWorthTrendsFromView(householdId, filters, dateGrouping);
    } else {
      return this.calculateNetWorthTrends(householdId, filters, dateGrouping);
    }
  }

  /**
   * Get net worth trends from materialized view
   */
  private async getNetWorthTrendsFromView(
    householdId: string,
    filters: AnalyticsFilters,
    dateGrouping: string
  ): Promise<TrendPoint[]> {
    const results = await this.prisma.$queryRaw<Array<{
      date: Date;
      net_worth_cents: bigint;
    }>>`
      SELECT
        ${dateGrouping} as date,
        AVG(net_worth_cents) as net_worth_cents
      FROM net_worth_tracking
      WHERE household_id = ${householdId}
        AND date >= ${filters.dateRange.startDate}
        AND date <= ${filters.dateRange.endDate}
        ${filters.currency ? `AND currency = '${filters.currency}'` : ''}
      GROUP BY ${dateGrouping}
      ORDER BY date
    `;

    return results.map(row => ({
      date: row.date,
      value: Number(row.net_worth_cents) / 100,
      type: 'NET_WORTH',
    }));
  }

  /**
   * Calculate net worth trends from transactions
   */
  private async calculateNetWorthTrends(
    householdId: string,
    filters: AnalyticsFilters,
    dateGrouping: string
  ): Promise<TrendPoint[]> {
    // This would be a complex calculation - simplified for now
    const results = await this.prisma.$queryRaw<Array<{
      date: Date;
      net_change: bigint;
    }>>`
      SELECT
        ${dateGrouping} as date,
        SUM(t.amount_cents) as net_change
      FROM transactions t
      WHERE t.household_id = ${householdId}
        AND t.date >= ${filters.dateRange.startDate}
        AND t.date <= ${filters.dateRange.endDate}
        AND t.transfer_account_id IS NULL
        ${filters.currency ? `AND t.currency = '${filters.currency}'` : ''}
      GROUP BY ${dateGrouping}
      ORDER BY date
    `;

    // Convert to cumulative net worth changes
    let cumulativeValue = 0;
    return results.map(row => {
      cumulativeValue += Number(row.net_change) / 100;
      return {
        date: row.date,
        value: cumulativeValue,
        type: 'NET_WORTH',
      };
    });
  }

  /**
   * Get category trends
   */
  private async getCategoryTrends(
    householdId: string,
    filters: AnalyticsFilters,
    dateGrouping: string
  ): Promise<TrendPoint[]> {
    const whereClause = this.buildWhereClause(householdId, filters);

    const results = await this.prisma.$queryRaw<Array<{
      date: Date;
      category: string;
      value: bigint;
    }>>`
      SELECT
        ${dateGrouping} as date,
        COALESCE(c.name, 'Uncategorized') as category,
        SUM(ABS(t.amount_cents)) as value
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
      GROUP BY ${dateGrouping}, c.name
      ORDER BY date, value DESC
    `;

    return results.map(row => ({
      date: row.date,
      value: Number(row.value) / 100,
      category: row.category,
      type: 'CATEGORY',
    }));
  }

  /**
   * Get seasonality analysis
   */
  private async getSeasonality(
    householdId: string,
    filters: AnalyticsFilters,
    options: { period: string; trendType?: string }
  ): Promise<SeasonalityData> {
    // Get historical data for seasonality analysis (at least 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const historicalFilters = {
      ...filters,
      dateRange: {
        startDate: twoYearsAgo,
        endDate: filters.dateRange.endDate,
      },
    };

    const trends = await this.getTrends(householdId, historicalFilters, options);
    
    if (trends.length < 24) { // Need at least 2 years of monthly data
      return this.getEmptySeasonality();
    }

    const seasonalFactors = this.calculateSeasonalFactors(trends, options.period);
    const peakPeriods = this.identifyPeakPeriods(seasonalFactors);

    return {
      hasSeasonality: this.detectSeasonality(seasonalFactors),
      seasonalFactors,
      peakPeriods,
    };
  }

  /**
   * Calculate seasonal factors
   */
  private calculateSeasonalFactors(
    trends: TrendPoint[],
    period: string
  ): SeasonalFactor[] {
    const factors: SeasonalFactor[] = [];
    const periodGroups: Record<string, number[]> = {};

    // Group data by period (month, quarter, etc.)
    for (const trend of trends) {
      const periodKey = this.getPeriodKey(trend.date, period);
      if (!periodGroups[periodKey]) {
        periodGroups[periodKey] = [];
      }
      periodGroups[periodKey].push(trend.value);
    }

    // Calculate average for each period
    const overallAverage = trends.reduce((sum, t) => sum + t.value, 0) / trends.length;

    for (const [periodKey, values] of Object.entries(periodGroups)) {
      const periodAverage = values.reduce((sum, val) => sum + val, 0) / values.length;
      const factor = overallAverage > 0 ? periodAverage / overallAverage : 1;

      factors.push({
        period: periodKey,
        factor,
      });
    }

    return factors.sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Identify peak periods
   */
  private identifyPeakPeriods(seasonalFactors: SeasonalFactor[]): PeakPeriod[] {
    const peaks: PeakPeriod[] = [];
    const sortedFactors = [...seasonalFactors].sort((a, b) => b.factor - a.factor);

    // Take top 3 periods as peaks
    for (let i = 0; i < Math.min(3, sortedFactors.length); i++) {
      const factor = sortedFactors[i];
      if (factor.factor > 1.1) { // At least 10% above average
        peaks.push({
          period: factor.period,
          amount: factor.factor,
          description: `${Math.round((factor.factor - 1) * 100)}% above average`,
        });
      }
    }

    return peaks;
  }

  /**
   * Detect if there's significant seasonality
   */
  private detectSeasonality(seasonalFactors: SeasonalFactor[]): boolean {
    if (seasonalFactors.length < 4) return false;

    const factors = seasonalFactors.map(sf => sf.factor);
    const mean = factors.reduce((sum, f) => sum + f, 0) / factors.length;
    const variance = factors.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / factors.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    // Consider seasonal if coefficient of variation > 0.15
    return coefficientOfVariation > 0.15;
  }

  /**
   * Get forecast data
   */
  private async getForecast(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      period: string;
      trendType?: string;
      forecastPeriods?: number;
    }
  ): Promise<ForecastPoint[]> {
    const forecastPeriods = options.forecastPeriods || 6;
    const trends = await this.getTrends(householdId, filters, options);

    if (trends.length < 3) {
      return []; // Need at least 3 data points for forecasting
    }

    return this.generateForecast(trends, forecastPeriods, options.period);
  }

  /**
   * Generate forecast using simple linear regression
   */
  private generateForecast(
    trends: TrendPoint[],
    forecastPeriods: number,
    period: string
  ): ForecastPoint[] {
    const n = trends.length;
    const x = trends.map((_, i) => i);
    const y = trends.map(t => t.value);

    // Calculate linear regression
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

    // Calculate standard error for confidence intervals
    const standardError = Math.sqrt(ssRes / (n - 2));

    const forecast: ForecastPoint[] = [];
    const lastDate = trends[trends.length - 1].date;

    for (let i = 1; i <= forecastPeriods; i++) {
      const futureX = n + i - 1;
      const predictedValue = slope * futureX + intercept;
      
      // Calculate confidence interval (95%)
      const margin = 1.96 * standardError * Math.sqrt(1 + 1/n + Math.pow(futureX - sumX/n, 2) / (sumXX - sumX*sumX/n));
      
      const forecastDate = this.addPeriod(lastDate, i, period);
      
      forecast.push({
        date: forecastDate,
        predictedValue: Math.max(0, predictedValue), // Don't predict negative values
        confidence: Math.max(0.1, Math.min(0.9, rSquared)), // Clamp confidence between 10% and 90%
        upperBound: Math.max(0, predictedValue + margin),
        lowerBound: Math.max(0, predictedValue - margin),
      });
    }

    return forecast;
  }

  /**
   * Get empty seasonality data
   */
  private getEmptySeasonality(): SeasonalityData {
    return {
      hasSeasonality: false,
      seasonalFactors: [],
      peakPeriods: [],
    };
  }

  /**
   * Get period key for grouping
   */
  private getPeriodKey(date: Date, period: string): string {
    switch (period) {
      case 'daily':
        return date.toISOString().split('T')[0];
      case 'weekly': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `Week of ${weekStart.toISOString().split('T')[0]}`;
      }
      case 'monthly':
        return date.toLocaleString('default', { month: 'long' });
      case 'yearly':
        return `Q${Math.floor(date.getMonth() / 3) + 1}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  /**
   * Add period to date
   */
  private addPeriod(date: Date, periods: number, period: string): Date {
    const newDate = new Date(date);
    
    switch (period) {
      case 'daily':
        newDate.setDate(newDate.getDate() + periods);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + (periods * 7));
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + periods);
        break;
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() + periods);
        break;
    }
    
    return newDate;
  }

  /**
   * Check if materialized view exists
   */
  private async checkMaterializedViewExists(viewName: string): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM pg_matviews WHERE matviewname = ${viewName}
        ) as exists
      `;
      return result[0]?.exists || false;
    } catch {
      return false;
    }
  }

  /**
   * Get date grouping SQL expression
   */
  private getDateGrouping(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): string {
    switch (period) {
      case 'daily':
        return "date_trunc('day', t.date)";
      case 'weekly':
        return "date_trunc('week', t.date)";
      case 'monthly':
        return "date_trunc('month', t.date)";
      case 'yearly':
        return "date_trunc('year', t.date)";
      default:
        return "date_trunc('day', t.date)";
    }
  }

  /**
   * Build WHERE clause for queries
   */
  private buildWhereClause(householdId: string, filters: AnalyticsFilters): string {
    const conditions = [
      `t.household_id = '${householdId}'`,
      `t.date >= '${filters.dateRange.startDate.toISOString().split('T')[0]}'`,
      `t.date <= '${filters.dateRange.endDate.toISOString().split('T')[0]}'`,
    ];

    if (!filters.includeTransfers) {
      conditions.push('t.transfer_account_id IS NULL');
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      const categoryList = filters.categoryIds.map(id => `'${id}'`).join(',');
      conditions.push(`t.category_id IN (${categoryList})`);
    }

    if (filters.accountIds && filters.accountIds.length > 0) {
      const accountList = filters.accountIds.map(id => `'${id}'`).join(',');
      conditions.push(`t.account_id IN (${accountList})`);
    }

    if (filters.currency) {
      conditions.push(`t.currency = '${filters.currency}'`);
    }

    return conditions.join(' AND ');
  }
}
