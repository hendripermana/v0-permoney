import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  CategoryBreakdown,
  TrendData,
  AnalyticsFilters,
} from '../types/analytics.types';

@Injectable()
export class CategoryAnalyticsService {
  private readonly logger = new Logger(CategoryAnalyticsService.name);
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Get comprehensive category breakdown and analysis
   */
  async getCategoryBreakdown(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      includeSubcategories?: boolean;
      includeTrends?: boolean;
      limit?: number;
    } = {}
  ): Promise<CategoryBreakdown[]> {
    const cacheKey = `category_analytics:${householdId}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
    
    try {
      // Try to get from cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      this.logger.log(`Generating category breakdown for household ${householdId}`);

      const breakdown = await this.generateCategoryBreakdown(householdId, filters, options);

      // Cache the result
      await this.cacheService.set(cacheKey, breakdown, this.CACHE_TTL);

      return breakdown;
    } catch (error) {
      this.logger.error(`Failed to get category breakdown for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Get category trends over time
   */
  async getCategoryTrends(
    householdId: string,
    filters: AnalyticsFilters,
    categoryIds?: string[]
  ): Promise<Record<string, TrendData>> {
    const cacheKey = `category_trends:${householdId}:${JSON.stringify(filters)}:${JSON.stringify(categoryIds)}`;
    
    try {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const trends = await this.calculateCategoryTrends(householdId, filters, categoryIds);

      await this.cacheService.set(cacheKey, trends, this.CACHE_TTL);

      return trends;
    } catch (error) {
      this.logger.error(`Failed to get category trends for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Generate comprehensive category breakdown
   */
  private async generateCategoryBreakdown(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      includeSubcategories?: boolean;
      includeTrends?: boolean;
      limit?: number;
    }
  ): Promise<CategoryBreakdown[]> {
    const limit = options.limit || 20;
    const whereClause = this.buildWhereClause(householdId, filters);

    // Get parent categories first
    const parentCategories = await this.getParentCategories(householdId, filters, whereClause, limit);

    const breakdown: CategoryBreakdown[] = [];

    for (const parent of parentCategories) {
      const categoryBreakdown: CategoryBreakdown = {
        categoryId: parent.category_id,
        categoryName: parent.category_name,
        totalAmount: Number(parent.total_amount) / 100,
        transactionCount: Number(parent.transaction_count),
        percentage: parent.percentage,
        averageAmount: parent.avg_amount / 100,
        trend: { direction: 'STABLE', percentage: 0, previousPeriodAmount: 0 },
      };

      // Add trend data if requested
      if (options.includeTrends) {
        categoryBreakdown.trend = await this.getCategoryTrend(
          householdId, 
          parent.category_id, 
          filters
        );
      }

      // Add subcategories if requested
      if (options.includeSubcategories) {
        categoryBreakdown.subcategories = await this.getSubcategories(
          householdId, 
          parent.category_id, 
          filters, 
          whereClause,
          options.includeTrends
        );
      }

      breakdown.push(categoryBreakdown);
    }

    return breakdown;
  }

  /**
   * Get parent categories with spending data
   */
  private async getParentCategories(
    householdId: string,
    filters: AnalyticsFilters,
    whereClause: string,
    limit: number
  ): Promise<Array<{
    category_id: string;
    category_name: string;
    total_amount: bigint;
    transaction_count: bigint;
    avg_amount: number;
    percentage: number;
  }>> {
    const results = await this.prisma.$queryRaw<Array<{
      category_id: string;
      category_name: string;
      total_amount: bigint;
      transaction_count: bigint;
      avg_amount: number;
    }>>`
      WITH category_totals AS (
        SELECT
          COALESCE(c.id, 'uncategorized') as category_id,
          COALESCE(c.name, 'Uncategorized') as category_name,
          SUM(ABS(t.amount_cents)) as total_amount,
          COUNT(*) as transaction_count,
          AVG(ABS(t.amount_cents)) as avg_amount
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE ${whereClause}
          AND (c.parent_id IS NULL OR c.parent_id = c.id OR c.id IS NULL)
        GROUP BY c.id, c.name
      ),
      total_spending AS (
        SELECT SUM(total_amount) as grand_total
        FROM category_totals
      )
      SELECT
        ct.*,
        (ct.total_amount * 100.0 / ts.grand_total) as percentage
      FROM category_totals ct
      CROSS JOIN total_spending ts
      ORDER BY ct.total_amount DESC
      LIMIT ${limit}
    `;

    return results.map(row => ({
      ...row,
      percentage: Number(row.percentage) || 0,
    }));
  }

  /**
   * Get subcategories for a parent category
   */
  private async getSubcategories(
    householdId: string,
    parentCategoryId: string,
    filters: AnalyticsFilters,
    whereClause: string,
    includeTrends: boolean
  ): Promise<CategoryBreakdown[]> {
    if (parentCategoryId === 'uncategorized') {
      return [];
    }

    const results = await this.prisma.$queryRaw<Array<{
      category_id: string;
      category_name: string;
      total_amount: bigint;
      transaction_count: bigint;
      avg_amount: number;
    }>>`
      WITH subcategory_totals AS (
        SELECT
          c.id as category_id,
          c.name as category_name,
          SUM(ABS(t.amount_cents)) as total_amount,
          COUNT(*) as transaction_count,
          AVG(ABS(t.amount_cents)) as avg_amount
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE ${whereClause}
          AND c.parent_id = ${parentCategoryId}
        GROUP BY c.id, c.name
      ),
      parent_total AS (
        SELECT SUM(total_amount) as parent_total
        FROM subcategory_totals
      )
      SELECT
        st.*,
        (st.total_amount * 100.0 / pt.parent_total) as percentage
      FROM subcategory_totals st
      CROSS JOIN parent_total pt
      ORDER BY st.total_amount DESC
    `;

    const subcategories: CategoryBreakdown[] = [];

    for (const sub of results) {
      const subcategory: CategoryBreakdown = {
        categoryId: sub.category_id,
        categoryName: sub.category_name,
        parentCategoryId,
        totalAmount: Number(sub.total_amount) / 100,
        transactionCount: Number(sub.transaction_count),
        percentage: Number(sub.percentage) || 0,
        averageAmount: sub.avg_amount / 100,
        trend: { direction: 'STABLE', percentage: 0, previousPeriodAmount: 0 },
      };

      if (includeTrends) {
        subcategory.trend = await this.getCategoryTrend(
          householdId, 
          sub.category_id, 
          filters
        );
      }

      subcategories.push(subcategory);
    }

    return subcategories;
  }

  /**
   * Get trend data for a specific category
   */
  private async getCategoryTrend(
    householdId: string,
    categoryId: string,
    filters: AnalyticsFilters
  ): Promise<TrendData> {
    // Calculate previous period
    const periodLength = filters.dateRange.endDate.getTime() - filters.dateRange.startDate.getTime();
    const previousPeriodStart = new Date(filters.dateRange.startDate.getTime() - periodLength);
    const previousPeriodEnd = new Date(filters.dateRange.endDate.getTime() - periodLength);

    const [currentAmount, previousAmount] = await Promise.all([
      this.getCategoryAmount(householdId, categoryId, filters.dateRange.startDate, filters.dateRange.endDate, filters),
      this.getCategoryAmount(householdId, categoryId, previousPeriodStart, previousPeriodEnd, filters),
    ]);

    let direction: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    let percentage = 0;

    if (previousAmount > 0) {
      percentage = ((currentAmount - previousAmount) / previousAmount) * 100;
      
      if (percentage > 10) {
        direction = 'UP';
      } else if (percentage < -10) {
        direction = 'DOWN';
      }
    } else if (currentAmount > 0) {
      direction = 'UP';
      percentage = 100;
    }

    return {
      direction,
      percentage: Math.round(percentage * 100) / 100,
      previousPeriodAmount: previousAmount,
    };
  }

  /**
   * Get total amount for a category in a date range
   */
  private async getCategoryAmount(
    householdId: string,
    categoryId: string,
    startDate: Date,
    endDate: Date,
    filters: AnalyticsFilters
  ): Promise<number> {
    const categoryCondition = categoryId === 'uncategorized' 
      ? 't.category_id IS NULL' 
      : `t.category_id = '${categoryId}'`;

    const result = await this.prisma.$queryRaw<Array<{ total_amount: bigint }>>`
      SELECT COALESCE(SUM(ABS(t.amount_cents)), 0) as total_amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.household_id = ${householdId}
        AND t.date >= ${startDate}
        AND t.date <= ${endDate}
        AND ${categoryCondition}
        ${!filters.includeTransfers ? 'AND t.transfer_account_id IS NULL' : ''}
        ${filters.currency ? `AND t.currency = '${filters.currency}'` : ''}
        ${filters.accountIds && filters.accountIds.length > 0 
          ? `AND t.account_id IN (${filters.accountIds.map(id => `'${id}'`).join(',')})` 
          : ''}
    `;

    return Number(result[0]?.total_amount || 0) / 100;
  }

  /**
   * Calculate category trends for multiple categories
   */
  private async calculateCategoryTrends(
    householdId: string,
    filters: AnalyticsFilters,
    categoryIds?: string[]
  ): Promise<Record<string, TrendData>> {
    const trends: Record<string, TrendData> = {};

    // Get all categories if none specified
    const targetCategories = categoryIds || await this.getAllCategoryIds(householdId, filters);

    for (const categoryId of targetCategories) {
      trends[categoryId] = await this.getCategoryTrend(householdId, categoryId, filters);
    }

    return trends;
  }

  /**
   * Get all category IDs that have transactions in the period
   */
  private async getAllCategoryIds(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<string[]> {
    const whereClause = this.buildWhereClause(householdId, filters);

    const results = await this.prisma.$queryRaw<Array<{ category_id: string }>>`
      SELECT DISTINCT COALESCE(t.category_id, 'uncategorized') as category_id
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
    `;

    return results.map(row => row.category_id);
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

    if (filters.amountRange) {
      conditions.push(`ABS(t.amount_cents) >= ${filters.amountRange.min * 100}`);
      conditions.push(`ABS(t.amount_cents) <= ${filters.amountRange.max * 100}`);
    }

    return conditions.join(' AND ');
  }
}
