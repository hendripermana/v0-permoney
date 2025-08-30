import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  NetWorthAnalysis,
  NetWorthPoint,
  AssetBreakdown,
  LiabilityBreakdown,
  ProjectedNetWorth,
  AccountSummary,
  AnalyticsFilters,
} from '../types/analytics.types';

@Injectable()
export class NetWorthAnalyticsService {
  private readonly logger = new Logger(NetWorthAnalyticsService.name);
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Get comprehensive net worth analysis for a household
   */
  async getNetWorthAnalysis(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      includeProjections?: boolean;
      includeBreakdown?: boolean;
      interval?: 'daily' | 'weekly' | 'monthly';
    } = {}
  ): Promise<NetWorthAnalysis> {
    const cacheKey = `net_worth_analytics:${householdId}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
    
    try {
      // Try to get from cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      this.logger.log(`Generating net worth analysis for household ${householdId}`);

      const [
        currentNetWorth,
        history,
        assetBreakdown,
        liabilityBreakdown,
        projectedNetWorth,
      ] = await Promise.all([
        this.getCurrentNetWorth(householdId, filters),
        this.getNetWorthHistory(householdId, filters, options.interval),
        options.includeBreakdown ? this.getAssetBreakdown(householdId, filters) : [],
        options.includeBreakdown ? this.getLiabilityBreakdown(householdId, filters) : [],
        options.includeProjections ? this.getProjectedNetWorth(householdId, filters) : [],
      ]);

      const analysis: NetWorthAnalysis = {
        currentNetWorth: currentNetWorth.netWorth,
        totalAssets: currentNetWorth.totalAssets,
        totalLiabilities: currentNetWorth.totalLiabilities,
        history,
        assetBreakdown,
        liabilityBreakdown,
        projectedNetWorth,
        currency: filters.currency || 'IDR',
      };

      // Cache the result
      await this.cacheService.set(cacheKey, analysis, this.CACHE_TTL);

      return analysis;
    } catch (error) {
      this.logger.error(`Failed to get net worth analysis for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Get current net worth snapshot
   */
  private async getCurrentNetWorth(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<{ netWorth: number; totalAssets: number; totalLiabilities: number }> {
    const result = await this.prisma.$queryRaw<Array<{
      total_assets: bigint;
      total_liabilities: bigint;
    }>>`
      SELECT
        SUM(CASE WHEN a.type = 'ASSET' THEN a.balance_cents ELSE 0 END) as total_assets,
        SUM(CASE WHEN a.type = 'LIABILITY' THEN a.balance_cents ELSE 0 END) as total_liabilities
      FROM accounts a
      WHERE a.household_id = ${householdId}
        AND a.is_active = true
        ${filters.currency ? `AND a.currency = '${filters.currency}'` : ''}
        ${filters.accountIds && filters.accountIds.length > 0 
          ? `AND a.id IN (${filters.accountIds.map(id => `'${id}'`).join(',')})` 
          : ''}
    `;

    const data = result[0];
    const totalAssets = Number(data.total_assets) / 100;
    const totalLiabilities = Number(data.total_liabilities) / 100;

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    };
  }

  /**
   * Get net worth history over time
   */
  private async getNetWorthHistory(
    householdId: string,
    filters: AnalyticsFilters,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<NetWorthPoint[]> {
    const dateGrouping = this.getDateGrouping(interval);

    // Use materialized view if available, otherwise calculate from transactions
    const useView = await this.checkMaterializedViewExists('net_worth_tracking');

    if (useView) {
      return this.getNetWorthHistoryFromView(householdId, filters, dateGrouping);
    } else {
      return this.calculateNetWorthHistory(householdId, filters, dateGrouping);
    }
  }

  /**
   * Get net worth history from materialized view
   */
  private async getNetWorthHistoryFromView(
    householdId: string,
    filters: AnalyticsFilters,
    dateGrouping: string
  ): Promise<NetWorthPoint[]> {
    const results = await this.prisma.$queryRaw<Array<{
      date: Date;
      net_worth_cents: bigint;
      total_assets_cents: bigint;
      total_liabilities_cents: bigint;
    }>>`
      SELECT
        ${dateGrouping} as date,
        AVG(net_worth_cents) as net_worth_cents,
        AVG(total_assets_cents) as total_assets_cents,
        AVG(total_liabilities_cents) as total_liabilities_cents
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
      netWorth: Number(row.net_worth_cents) / 100,
      assets: Number(row.total_assets_cents) / 100,
      liabilities: Number(row.total_liabilities_cents) / 100,
    }));
  }

  /**
   * Calculate net worth history from transactions
   */
  private async calculateNetWorthHistory(
    householdId: string,
    filters: AnalyticsFilters,
    dateGrouping: string
  ): Promise<NetWorthPoint[]> {
    const results = await this.prisma.$queryRaw<Array<{
      date: Date;
      net_worth_cents: bigint;
      total_assets_cents: bigint;
      total_liabilities_cents: bigint;
    }>>`
      WITH daily_balances AS (
        SELECT
          a.id as account_id,
          a.type as account_type,
          ${dateGrouping} as date,
          SUM(
            CASE
              WHEN le.type = 'DEBIT' AND a.type = 'ASSET' THEN le.amount_cents
              WHEN le.type = 'CREDIT' AND a.type = 'ASSET' THEN -le.amount_cents
              WHEN le.type = 'DEBIT' AND a.type = 'LIABILITY' THEN -le.amount_cents
              WHEN le.type = 'CREDIT' AND a.type = 'LIABILITY' THEN le.amount_cents
              ELSE 0
            END
          ) OVER (
            PARTITION BY a.id 
            ORDER BY ${dateGrouping}
            ROWS UNBOUNDED PRECEDING
          ) as running_balance_cents
        FROM accounts a
        JOIN ledger_entries le ON a.id = le.account_id
        JOIN transactions t ON le.transaction_id = t.id
        WHERE a.household_id = ${householdId}
          AND a.is_active = true
          AND t.date >= ${filters.dateRange.startDate}
          AND t.date <= ${filters.dateRange.endDate}
          ${filters.currency ? `AND a.currency = '${filters.currency}'` : ''}
          ${filters.accountIds && filters.accountIds.length > 0 
            ? `AND a.id IN (${filters.accountIds.map(id => `'${id}'`).join(',')})` 
            : ''}
      ),
      net_worth_by_date AS (
        SELECT
          date,
          SUM(CASE WHEN account_type = 'ASSET' THEN running_balance_cents ELSE 0 END) as total_assets_cents,
          SUM(CASE WHEN account_type = 'LIABILITY' THEN running_balance_cents ELSE 0 END) as total_liabilities_cents
        FROM daily_balances
        GROUP BY date
      )
      SELECT
        date,
        (total_assets_cents - total_liabilities_cents) as net_worth_cents,
        total_assets_cents,
        total_liabilities_cents
      FROM net_worth_by_date
      ORDER BY date
    `;

    return results.map(row => ({
      date: row.date,
      netWorth: Number(row.net_worth_cents) / 100,
      assets: Number(row.total_assets_cents) / 100,
      liabilities: Number(row.total_liabilities_cents) / 100,
    }));
  }

  /**
   * Get asset breakdown by type and subtype
   */
  private async getAssetBreakdown(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<AssetBreakdown[]> {
    const results = await this.prisma.$queryRaw<Array<{
      account_type: string;
      account_subtype: string;
      total_amount: bigint;
      account_count: bigint;
    }>>`
      SELECT
        a.type as account_type,
        a.subtype as account_subtype,
        SUM(a.balance_cents) as total_amount,
        COUNT(*) as account_count
      FROM accounts a
      WHERE a.household_id = ${householdId}
        AND a.type = 'ASSET'
        AND a.is_active = true
        ${filters.currency ? `AND a.currency = '${filters.currency}'` : ''}
        ${filters.accountIds && filters.accountIds.length > 0 
          ? `AND a.id IN (${filters.accountIds.map(id => `'${id}'`).join(',')})` 
          : ''}
      GROUP BY a.type, a.subtype
      ORDER BY total_amount DESC
    `;

    const totalAssets = results.reduce((sum, item) => sum + Number(item.total_amount), 0);

    const breakdown: AssetBreakdown[] = [];

    for (const result of results) {
      const accounts = await this.getAccountsForBreakdown(
        householdId, 
        'ASSET', 
        result.account_subtype, 
        filters
      );

      breakdown.push({
        accountType: result.account_type,
        accountSubtype: result.account_subtype,
        amount: Number(result.total_amount) / 100,
        percentage: totalAssets > 0 ? (Number(result.total_amount) / totalAssets) * 100 : 0,
        accounts,
      });
    }

    return breakdown;
  }

  /**
   * Get liability breakdown by type and subtype
   */
  private async getLiabilityBreakdown(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<LiabilityBreakdown[]> {
    const results = await this.prisma.$queryRaw<Array<{
      account_type: string;
      account_subtype: string;
      total_amount: bigint;
      account_count: bigint;
    }>>`
      SELECT
        a.type as account_type,
        a.subtype as account_subtype,
        SUM(a.balance_cents) as total_amount,
        COUNT(*) as account_count
      FROM accounts a
      WHERE a.household_id = ${householdId}
        AND a.type = 'LIABILITY'
        AND a.is_active = true
        ${filters.currency ? `AND a.currency = '${filters.currency}'` : ''}
        ${filters.accountIds && filters.accountIds.length > 0 
          ? `AND a.id IN (${filters.accountIds.map(id => `'${id}'`).join(',')})` 
          : ''}
      GROUP BY a.type, a.subtype
      ORDER BY total_amount DESC
    `;

    const totalLiabilities = results.reduce((sum, item) => sum + Number(item.total_amount), 0);

    const breakdown: LiabilityBreakdown[] = [];

    for (const result of results) {
      const accounts = await this.getAccountsForBreakdown(
        householdId, 
        'LIABILITY', 
        result.account_subtype, 
        filters
      );

      breakdown.push({
        accountType: result.account_type,
        accountSubtype: result.account_subtype,
        amount: Number(result.total_amount) / 100,
        percentage: totalLiabilities > 0 ? (Number(result.total_amount) / totalLiabilities) * 100 : 0,
        accounts,
      });
    }

    return breakdown;
  }

  /**
   * Get accounts for breakdown detail
   */
  private async getAccountsForBreakdown(
    householdId: string,
    accountType: string,
    accountSubtype: string,
    filters: AnalyticsFilters
  ): Promise<AccountSummary[]> {
    const results = await this.prisma.$queryRaw<Array<{
      account_id: string;
      account_name: string;
      balance_cents: bigint;
      currency: string;
    }>>`
      SELECT
        a.id as account_id,
        a.name as account_name,
        a.balance_cents,
        a.currency
      FROM accounts a
      WHERE a.household_id = ${householdId}
        AND a.type = ${accountType}
        AND a.subtype = ${accountSubtype}
        AND a.is_active = true
        ${filters.currency ? `AND a.currency = '${filters.currency}'` : ''}
        ${filters.accountIds && filters.accountIds.length > 0 
          ? `AND a.id IN (${filters.accountIds.map(id => `'${id}'`).join(',')})` 
          : ''}
      ORDER BY a.balance_cents DESC
    `;

    return results.map(row => ({
      accountId: row.account_id,
      accountName: row.account_name,
      amount: Number(row.balance_cents) / 100,
      currency: row.currency,
    }));
  }

  /**
   * Get projected net worth based on trends
   */
  private async getProjectedNetWorth(
    householdId: string,
    filters: AnalyticsFilters,
    projectionMonths = 12
  ): Promise<ProjectedNetWorth[]> {
    // Get historical net worth data for trend analysis
    const historicalData = await this.getNetWorthHistory(householdId, filters, 'monthly');
    
    if (historicalData.length < 3) {
      return []; // Need at least 3 months of data for projection
    }

    // Calculate trend using linear regression
    const trend = this.calculateLinearTrend(historicalData);
    
    const projections: ProjectedNetWorth[] = [];
    const lastDate = historicalData[historicalData.length - 1].date;
    
    for (let i = 1; i <= projectionMonths; i++) {
      const projectionDate = new Date(lastDate);
      projectionDate.setMonth(projectionDate.getMonth() + i);
      
      const projectedValue = trend.slope * i + historicalData[historicalData.length - 1].netWorth;
      
      // Calculate confidence based on R-squared
      const confidence = Math.max(0.1, Math.min(0.9, trend.rSquared));
      
      projections.push({
        date: projectionDate,
        projectedNetWorth: projectedValue,
        confidence,
      });
    }

    return projections;
  }

  /**
   * Calculate linear trend from historical data
   */
  private calculateLinearTrend(data: NetWorthPoint[]): { slope: number; rSquared: number } {
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map(d => d.netWorth);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    // const sumYY = y.reduce((sum, val) => sum + val * val, 0); // Not needed for current calculation
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    
    return { slope, rSquared };
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
  private getDateGrouping(interval: 'daily' | 'weekly' | 'monthly'): string {
    switch (interval) {
      case 'daily':
        return "date_trunc('day', t.date)";
      case 'weekly':
        return "date_trunc('week', t.date)";
      case 'monthly':
        return "date_trunc('month', t.date)";
      default:
        return "date_trunc('day', t.date)";
    }
  }
}
