import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  CashflowAnalysis,
  CategoryFlow,
  MonthlyFlow,
  ProjectedFlow,
  AnalyticsFilters,
} from '../types/analytics.types';

@Injectable()
export class CashflowAnalyticsService {
  private readonly logger = new Logger(CashflowAnalyticsService.name);
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Get comprehensive cashflow analysis for a household
   */
  async getCashflowAnalysis(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      includeProjections?: boolean;
      projectionMonths?: number;
    } = {}
  ): Promise<CashflowAnalysis> {
    const cacheKey = `cashflow_analytics:${householdId}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
    
    try {
      // Try to get from cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      this.logger.log(`Generating cashflow analysis for household ${householdId}`);

      const [
        totalFlows,
        inflowByCategory,
        outflowByCategory,
        monthlyFlow,
        projectedFlow,
      ] = await Promise.all([
        this.getTotalCashflows(householdId, filters),
        this.getInflowByCategory(householdId, filters),
        this.getOutflowByCategory(householdId, filters),
        this.getMonthlyFlow(householdId, filters),
        options.includeProjections 
          ? this.getProjectedFlow(householdId, filters, options.projectionMonths || 6)
          : [],
      ]);

      const analysis: CashflowAnalysis = {
        ...totalFlows,
        inflowByCategory,
        outflowByCategory,
        monthlyFlow,
        projectedFlow,
        currency: filters.currency || 'IDR',
      };

      // Cache the result
      await this.cacheService.set(cacheKey, analysis, this.CACHE_TTL);

      return analysis;
    } catch (error) {
      this.logger.error(`Failed to get cashflow analysis for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Get total inflow and outflow amounts
   */
  private async getTotalCashflows(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<Pick<CashflowAnalysis, 'totalInflow' | 'totalOutflow' | 'netCashflow'>> {
    const whereClause = this.buildWhereClause(householdId, filters);

    const result = await this.prisma.$queryRaw<Array<{
      total_inflow: bigint;
      total_outflow: bigint;
    }>>`
      SELECT
        SUM(CASE WHEN amount_cents > 0 THEN amount_cents ELSE 0 END) as total_inflow,
        SUM(CASE WHEN amount_cents < 0 THEN ABS(amount_cents) ELSE 0 END) as total_outflow
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
    `;

    const flows = result[0];
    const totalInflow = Number(flows.total_inflow) / 100;
    const totalOutflow = Number(flows.total_outflow) / 100;

    return {
      totalInflow,
      totalOutflow,
      netCashflow: totalInflow - totalOutflow,
    };
  }

  /**
   * Get inflow breakdown by category
   */
  private async getInflowByCategory(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<CategoryFlow[]> {
    const whereClause = this.buildWhereClause(householdId, filters);

    const results = await this.prisma.$queryRaw<Array<{
      category_id: string;
      category_name: string;
      amount: bigint;
      transaction_count: bigint;
    }>>`
      SELECT
        COALESCE(c.id, 'uncategorized') as category_id,
        COALESCE(c.name, 'Uncategorized') as category_name,
        SUM(t.amount_cents) as amount,
        COUNT(*) as transaction_count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
        AND t.amount_cents > 0 -- Only inflows
      GROUP BY c.id, c.name
      ORDER BY amount DESC
    `;

    const totalInflow = results.reduce((sum, cat) => sum + Number(cat.amount), 0);

    return results.map(cat => ({
      categoryId: cat.category_id,
      categoryName: cat.category_name,
      amount: Number(cat.amount) / 100,
      percentage: totalInflow > 0 ? (Number(cat.amount) / totalInflow) * 100 : 0,
      transactionCount: Number(cat.transaction_count),
    }));
  }

  /**
   * Get outflow breakdown by category
   */
  private async getOutflowByCategory(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<CategoryFlow[]> {
    const whereClause = this.buildWhereClause(householdId, filters);

    const results = await this.prisma.$queryRaw<Array<{
      category_id: string;
      category_name: string;
      amount: bigint;
      transaction_count: bigint;
    }>>`
      SELECT
        COALESCE(c.id, 'uncategorized') as category_id,
        COALESCE(c.name, 'Uncategorized') as category_name,
        SUM(ABS(t.amount_cents)) as amount,
        COUNT(*) as transaction_count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
        AND t.amount_cents < 0 -- Only outflows
      GROUP BY c.id, c.name
      ORDER BY amount DESC
    `;

    const totalOutflow = results.reduce((sum, cat) => sum + Number(cat.amount), 0);

    return results.map(cat => ({
      categoryId: cat.category_id,
      categoryName: cat.category_name,
      amount: Number(cat.amount) / 100,
      percentage: totalOutflow > 0 ? (Number(cat.amount) / totalOutflow) * 100 : 0,
      transactionCount: Number(cat.transaction_count),
    }));
  }

  /**
   * Get monthly cashflow data
   */
  private async getMonthlyFlow(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<MonthlyFlow[]> {
    const whereClause = this.buildWhereClause(householdId, filters);

    const results = await this.prisma.$queryRaw<Array<{
      month: Date;
      inflow: bigint;
      outflow: bigint;
    }>>`
      SELECT
        date_trunc('month', t.date) as month,
        SUM(CASE WHEN t.amount_cents > 0 THEN t.amount_cents ELSE 0 END) as inflow,
        SUM(CASE WHEN t.amount_cents < 0 THEN ABS(t.amount_cents) ELSE 0 END) as outflow
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
      GROUP BY date_trunc('month', t.date)
      ORDER BY month
    `;

    return results.map(row => ({
      month: row.month,
      inflow: Number(row.inflow) / 100,
      outflow: Number(row.outflow) / 100,
      netFlow: (Number(row.inflow) - Number(row.outflow)) / 100,
    }));
  }

  /**
   * Get projected cashflow based on historical patterns
   */
  private async getProjectedFlow(
    householdId: string,
    filters: AnalyticsFilters,
    projectionMonths: number
  ): Promise<ProjectedFlow[]> {
    // Get historical monthly averages for the last 12 months
    const historicalData = await this.getHistoricalAverages(householdId, filters);
    
    if (historicalData.length === 0) {
      return [];
    }

    const projections: ProjectedFlow[] = [];
    const lastMonth = new Date(filters.dateRange.endDate);
    
    // Calculate seasonal factors
    const seasonalFactors = this.calculateSeasonalFactors(historicalData);
    
    for (let i = 1; i <= projectionMonths; i++) {
      const projectionDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + i, 1);
      const monthIndex = projectionDate.getMonth();
      
      const seasonalFactor = seasonalFactors[monthIndex] || 1;
      const baseInflow = historicalData.reduce((sum, d) => sum + d.avgInflow, 0) / historicalData.length;
      const baseOutflow = historicalData.reduce((sum, d) => sum + d.avgOutflow, 0) / historicalData.length;
      
      const projectedInflow = baseInflow * seasonalFactor;
      const projectedOutflow = baseOutflow * seasonalFactor;
      
      // Calculate confidence based on data consistency
      const inflowVariance = this.calculateVariance(historicalData.map(d => d.avgInflow));
      const outflowVariance = this.calculateVariance(historicalData.map(d => d.avgOutflow));
      const confidence = Math.max(0.1, 1 - (inflowVariance + outflowVariance) / (baseInflow + baseOutflow));
      
      projections.push({
        month: projectionDate,
        projectedInflow,
        projectedOutflow,
        projectedNetFlow: projectedInflow - projectedOutflow,
        confidence: Math.min(0.95, confidence), // Cap confidence at 95%
      });
    }

    return projections;
  }

  /**
   * Get historical monthly averages
   */
  private async getHistoricalAverages(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<Array<{ month: number; avgInflow: number; avgOutflow: number }>> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const historicalFilters = {
      ...filters,
      dateRange: {
        startDate: oneYearAgo,
        endDate: filters.dateRange.endDate,
      },
    };

    const whereClause = this.buildWhereClause(householdId, historicalFilters);

    const results = await this.prisma.$queryRaw<Array<{
      month: number;
      avg_inflow: number;
      avg_outflow: number;
    }>>`
      SELECT
        EXTRACT(MONTH FROM date_trunc('month', t.date)) as month,
        AVG(CASE WHEN t.amount_cents > 0 THEN t.amount_cents ELSE 0 END) as avg_inflow,
        AVG(CASE WHEN t.amount_cents < 0 THEN ABS(t.amount_cents) ELSE 0 END) as avg_outflow
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
      GROUP BY EXTRACT(MONTH FROM date_trunc('month', t.date))
      ORDER BY month
    `;

    return results.map(row => ({
      month: Number(row.month),
      avgInflow: row.avg_inflow / 100,
      avgOutflow: row.avg_outflow / 100,
    }));
  }

  /**
   * Calculate seasonal factors for each month
   */
  private calculateSeasonalFactors(
    historicalData: Array<{ month: number; avgInflow: number; avgOutflow: number }>
  ): Record<number, number> {
    const factors: Record<number, number> = {};
    const overallAvg = historicalData.reduce((sum, d) => sum + d.avgInflow + d.avgOutflow, 0) / 
                      (historicalData.length * 2);

    for (const data of historicalData) {
      const monthlyAvg = (data.avgInflow + data.avgOutflow) / 2;
      factors[data.month - 1] = overallAvg > 0 ? monthlyAvg / overallAvg : 1;
    }

    // Fill missing months with average factor
    const avgFactor = Object.values(factors).reduce((sum, f) => sum + f, 0) / Object.keys(factors).length || 1;
    for (let i = 0; i < 12; i++) {
      if (!(i in factors)) {
        factors[i] = avgFactor;
      }
    }

    return factors;
  }

  /**
   * Calculate variance for confidence scoring
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
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
