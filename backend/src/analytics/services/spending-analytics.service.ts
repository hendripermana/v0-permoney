import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  SpendingAnalytics,
  CategorySpending,
  SpendingTrend,
  SpendingComparison,
  AnalyticsFilters,
} from '../types/analytics.types';

@Injectable()
export class SpendingAnalyticsService {
  private readonly logger = new Logger(SpendingAnalyticsService.name);
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Get comprehensive spending analytics for a household
   */
  async getSpendingAnalytics(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      includeComparisons?: boolean;
      includeTrends?: boolean;
      groupBy?: 'day' | 'week' | 'month';
    } = {}
  ): Promise<SpendingAnalytics> {
    const cacheKey = `spending_analytics:${householdId}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
    
    try {
      // Try to get from cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      this.logger.log(`Generating spending analytics for household ${householdId}`);

      const [
        basicMetrics,
        topCategories,
        trends,
        comparisons,
      ] = await Promise.all([
        this.getBasicSpendingMetrics(householdId, filters),
        this.getTopCategories(householdId, filters),
        options.includeTrends ? this.getSpendingTrends(householdId, filters, options.groupBy) : [],
        options.includeComparisons ? this.getSpendingComparisons(householdId, filters) : null,
      ]);

      const analytics: SpendingAnalytics = {
        ...basicMetrics,
        topCategories,
        trends,
        comparisons: comparisons || {
          previousPeriod: { totalSpent: 0, totalIncome: 0, netCashflow: 0 },
          changePercentage: { spending: 0, income: 0, netCashflow: 0 },
          trend: 'STABLE',
        },
        currency: filters.currency || 'IDR',
      };

      // Cache the result
      await this.cacheService.set(cacheKey, analytics, this.CACHE_TTL);

      return analytics;
    } catch (error) {
      this.logger.error(`Failed to get spending analytics for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Get basic spending metrics
   */
  private async getBasicSpendingMetrics(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<Omit<SpendingAnalytics, 'topCategories' | 'trends' | 'comparisons' | 'currency'>> {
    const whereClause = this.buildWhereClause(householdId, filters);

    const result = await this.prisma.$queryRaw<Array<{
      total_spent: bigint;
      total_income: bigint;
      transaction_count: bigint;
      avg_transaction: number;
    }>>`
      SELECT
        SUM(CASE WHEN amount_cents < 0 THEN ABS(amount_cents) ELSE 0 END) as total_spent,
        SUM(CASE WHEN amount_cents > 0 THEN amount_cents ELSE 0 END) as total_income,
        COUNT(*) as transaction_count,
        AVG(ABS(amount_cents)) as avg_transaction
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
    `;

    const metrics = result[0];
    const totalSpent = Number(metrics.total_spent) / 100;
    const totalIncome = Number(metrics.total_income) / 100;
    const transactionCount = Number(metrics.transaction_count);
    const averageTransaction = metrics.avg_transaction / 100;

    const daysDiff = Math.ceil(
      (filters.dateRange.endDate.getTime() - filters.dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const averageDaily = daysDiff > 0 ? totalSpent / daysDiff : 0;

    return {
      totalSpent,
      totalIncome,
      netCashflow: totalIncome - totalSpent,
      averageDaily,
      averageTransaction,
      transactionCount,
    };
  }

  /**
   * Get top spending categories
   */
  private async getTopCategories(
    householdId: string,
    filters: AnalyticsFilters,
    limit = 10
  ): Promise<CategorySpending[]> {
    const whereClause = this.buildWhereClause(householdId, filters);

    const results = await this.prisma.$queryRaw<Array<{
      category_id: string;
      category_name: string;
      total_amount: bigint;
      transaction_count: bigint;
      avg_amount: number;
    }>>`
      SELECT
        c.id as category_id,
        COALESCE(c.name, 'Uncategorized') as category_name,
        SUM(ABS(t.amount_cents)) as total_amount,
        COUNT(*) as transaction_count,
        AVG(ABS(t.amount_cents)) as avg_amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
        AND t.amount_cents < 0 -- Only expenses
      GROUP BY c.id, c.name
      ORDER BY total_amount DESC
      LIMIT ${limit}
    `;

    const totalSpent = results.reduce((sum, cat) => sum + Number(cat.total_amount), 0);

    return results.map(cat => ({
      categoryId: cat.category_id || 'uncategorized',
      categoryName: cat.category_name,
      totalAmount: Number(cat.total_amount) / 100,
      transactionCount: Number(cat.transaction_count),
      percentage: totalSpent > 0 ? (Number(cat.total_amount) / totalSpent) * 100 : 0,
      averageAmount: cat.avg_amount / 100,
      trend: 'STABLE', // Will be calculated separately if needed
      trendPercentage: 0,
    }));
  }

  /**
   * Get spending trends over time
   */
  private async getSpendingTrends(
    householdId: string,
    filters: AnalyticsFilters,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<SpendingTrend[]> {
    const whereClause = this.buildWhereClause(householdId, filters);
    const dateGrouping = this.getDateGrouping(groupBy);

    const results = await this.prisma.$queryRaw<Array<{
      date: Date;
      amount: bigint;
    }>>`
      SELECT
        ${dateGrouping} as date,
        SUM(ABS(amount_cents)) as amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
        AND t.amount_cents < 0 -- Only expenses
      GROUP BY ${dateGrouping}
      ORDER BY date
    `;

    return results.map(row => ({
      date: row.date,
      amount: Number(row.amount) / 100,
      type: groupBy.toUpperCase() as 'DAILY' | 'WEEKLY' | 'MONTHLY',
    }));
  }

  /**
   * Get spending comparisons with previous period
   */
  private async getSpendingComparisons(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<SpendingComparison> {
    const periodLength = filters.dateRange.endDate.getTime() - filters.dateRange.startDate.getTime();
    const previousPeriodStart = new Date(filters.dateRange.startDate.getTime() - periodLength);
    const previousPeriodEnd = new Date(filters.dateRange.endDate.getTime() - periodLength);

    const previousFilters = {
      ...filters,
      dateRange: {
        startDate: previousPeriodStart,
        endDate: previousPeriodEnd,
      },
    };

    const previousMetrics = await this.getBasicSpendingMetrics(householdId, previousFilters);

    const currentMetrics = await this.getBasicSpendingMetrics(householdId, filters);

    const calculateChangePercentage = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const spendingChange = calculateChangePercentage(currentMetrics.totalSpent, previousMetrics.totalSpent);
    const incomeChange = calculateChangePercentage(currentMetrics.totalIncome, previousMetrics.totalIncome);
    const netCashflowChange = calculateChangePercentage(currentMetrics.netCashflow, previousMetrics.netCashflow);

    let trend: 'IMPROVING' | 'DECLINING' | 'STABLE' = 'STABLE';
    if (netCashflowChange > 10) {
      trend = 'IMPROVING';
    } else if (netCashflowChange < -10) {
      trend = 'DECLINING';
    }

    return {
      previousPeriod: {
        totalSpent: previousMetrics.totalSpent,
        totalIncome: previousMetrics.totalIncome,
        netCashflow: previousMetrics.netCashflow,
      },
      changePercentage: {
        spending: spendingChange,
        income: incomeChange,
        netCashflow: netCashflowChange,
      },
      trend,
    };
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

    if (filters.merchantIds && filters.merchantIds.length > 0) {
      const merchantList = filters.merchantIds.map(id => `'${id}'`).join(',');
      conditions.push(`t.merchant_id IN (${merchantList})`);
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(tag => 
        `EXISTS (SELECT 1 FROM transaction_tags tt WHERE tt.transaction_id = t.id AND tt.tag = '${tag}')`
      );
      conditions.push(`(${tagConditions.join(' OR ')})`);
    }

    if (filters.amountRange) {
      conditions.push(`ABS(t.amount_cents) >= ${filters.amountRange.min * 100}`);
      conditions.push(`ABS(t.amount_cents) <= ${filters.amountRange.max * 100}`);
    }

    if (filters.currency) {
      conditions.push(`t.currency = '${filters.currency}'`);
    }

    return conditions.join(' AND ');
  }

  /**
   * Get date grouping SQL expression
   */
  private getDateGrouping(groupBy: 'day' | 'week' | 'month'): string {
    switch (groupBy) {
      case 'day':
        return "date_trunc('day', t.date)";
      case 'week':
        return "date_trunc('week', t.date)";
      case 'month':
        return "date_trunc('month', t.date)";
      default:
        return "date_trunc('day', t.date)";
    }
  }
}
