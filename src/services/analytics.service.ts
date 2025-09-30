import { BaseService } from './base.service';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/redis';
import { transactionsService } from './transactions.service';
import { accountsService } from './accounts.service';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  categoryId?: string;
  currency?: string;
}

export interface CashflowData {
  period: string;
  date: Date;
  income: number;
  expenses: number;
  netCashflow: number;
  cumulativeCashflow: number;
}

export interface SpendingData {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface NetWorthTrend {
  date: Date;
  assets: number;
  liabilities: number;
  netWorth: number;
  change: number;
  changePercentage: number;
}

export interface TrendAnalysis {
  period: string;
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export class AnalyticsService extends BaseService {
  /**
   * Get cashflow analytics
   */
  async getCashflowAnalytics(
    householdId: string,
    filters: AnalyticsFilters = {}
  ): Promise<CashflowData[]> {
    try {
      const cacheKey = `${CACHE_KEYS.analytics(householdId, 'cashflow')}:${JSON.stringify(filters)}`;

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const { data: transactions } = await transactionsService.getTransactions(householdId, {
            startDate: filters.startDate,
            endDate: filters.endDate,
            accountId: filters.accountId,
            limit: 10000,
          });

          // Group by date
          const dailyData = new Map<string, { income: number; expenses: number }>();

          transactions.forEach(transaction => {
            const dateKey = transaction.date.toISOString().split('T')[0];
            const amount = Number(transaction.amountCents);
            
            const existing = dailyData.get(dateKey) || { income: 0, expenses: 0 };
            
            if (amount > 0) {
              existing.income += amount;
            } else {
              existing.expenses += Math.abs(amount);
            }
            
            dailyData.set(dateKey, existing);
          });

          // Convert to array and calculate cumulative
          let cumulative = 0;
          const result: CashflowData[] = [];

          Array.from(dailyData.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([dateStr, data]) => {
              const netCashflow = data.income - data.expenses;
              cumulative += netCashflow;

              result.push({
                period: dateStr,
                date: new Date(dateStr),
                income: data.income,
                expenses: data.expenses,
                netCashflow,
                cumulativeCashflow: cumulative,
              });
            });

          return result;
        },
        CACHE_TTL.MEDIUM
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch cashflow analytics');
    }
  }

  /**
   * Get spending analytics
   */
  async getSpendingAnalytics(
    householdId: string,
    filters: AnalyticsFilters = {}
  ): Promise<SpendingData[]> {
    try {
      const cacheKey = `${CACHE_KEYS.analytics(householdId, 'spending')}:${JSON.stringify(filters)}`;

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const breakdown = await transactionsService.getCategoryBreakdown(householdId, {
            startDate: filters.startDate,
            endDate: filters.endDate,
            accountId: filters.accountId,
          });

          // Map to spending data with trend analysis
          return breakdown.map(item => ({
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            amount: item.totalAmount,
            count: item.transactionCount,
            percentage: item.percentage,
            trend: 'stable' as const, // Would need historical comparison
          }));
        },
        CACHE_TTL.MEDIUM
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch spending analytics');
    }
  }

  /**
   * Get net worth trend
   */
  async getNetWorthTrend(
    householdId: string,
    filters: AnalyticsFilters = {}
  ): Promise<NetWorthTrend[]> {
    try {
      const cacheKey = `${CACHE_KEYS.analytics(householdId, 'net-worth-trend')}:${JSON.stringify(filters)}`;

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const currency = filters.currency || 'IDR';
          const currentNetWorth = await accountsService.getNetWorth(householdId, currency);

          // Get transactions to calculate historical net worth
          const { data: transactions } = await transactionsService.getTransactions(householdId, {
            startDate: filters.startDate,
            endDate: filters.endDate,
            limit: 10000,
          });

          // Calculate daily net worth
          const dailyChanges = new Map<string, number>();
          
          transactions.forEach(transaction => {
            const dateKey = transaction.date.toISOString().split('T')[0];
            const existing = dailyChanges.get(dateKey) || 0;
            dailyChanges.set(dateKey, existing + Number(transaction.amountCents));
          });

          // Build trend data
          const sortedDates = Array.from(dailyChanges.keys()).sort();
          let runningNetWorth = currentNetWorth.netWorth;
          let previousNetWorth = runningNetWorth;

          const result: NetWorthTrend[] = sortedDates.reverse().map(dateStr => {
            const change = dailyChanges.get(dateStr) || 0;
            runningNetWorth -= change; // Go backwards

            const netWorth = runningNetWorth;
            const changeValue = netWorth - previousNetWorth;
            const changePercentage = previousNetWorth !== 0 
              ? (changeValue / previousNetWorth) * 100 
              : 0;

            previousNetWorth = netWorth;

            return {
              date: new Date(dateStr),
              assets: netWorth + currentNetWorth.totalLiabilities,
              liabilities: currentNetWorth.totalLiabilities,
              netWorth,
              change: changeValue,
              changePercentage,
            };
          });

          return result.reverse();
        },
        CACHE_TTL.MEDIUM
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch net worth trend');
    }
  }

  /**
   * Get trend analysis comparing periods
   */
  async getTrendAnalysis(
    householdId: string,
    filters: AnalyticsFilters = {}
  ): Promise<TrendAnalysis[]> {
    try {
      const cacheKey = `${CACHE_KEYS.analytics(householdId, 'trends')}:${JSON.stringify(filters)}`;

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const currentStats = await transactionsService.getTransactionStats(householdId, filters);
          
          // Calculate previous period
          const daysDiff = filters.endDate && filters.startDate
            ? Math.ceil((filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 60 * 60 * 24))
            : 30;

          const previousStart = new Date(filters.startDate || new Date());
          previousStart.setDate(previousStart.getDate() - daysDiff);
          
          const previousEnd = new Date(filters.startDate || new Date());

          const previousStats = await transactionsService.getTransactionStats(householdId, {
            startDate: previousStart,
            endDate: previousEnd,
          });

          // Build trend analysis
          const trends: TrendAnalysis[] = [
            {
              period: 'current',
              metric: 'Total Transactions',
              current: currentStats.totalTransactions,
              previous: previousStats.totalTransactions,
              change: currentStats.totalTransactions - previousStats.totalTransactions,
              changePercentage: previousStats.totalTransactions !== 0
                ? ((currentStats.totalTransactions - previousStats.totalTransactions) / previousStats.totalTransactions) * 100
                : 0,
              trend: currentStats.totalTransactions > previousStats.totalTransactions ? 'increasing' : 
                     currentStats.totalTransactions < previousStats.totalTransactions ? 'decreasing' : 'stable',
            },
            {
              period: 'current',
              metric: 'Total Income',
              current: currentStats.totalIncome,
              previous: previousStats.totalIncome,
              change: currentStats.totalIncome - previousStats.totalIncome,
              changePercentage: previousStats.totalIncome !== 0
                ? ((currentStats.totalIncome - previousStats.totalIncome) / previousStats.totalIncome) * 100
                : 0,
              trend: currentStats.totalIncome > previousStats.totalIncome ? 'increasing' : 
                     currentStats.totalIncome < previousStats.totalIncome ? 'decreasing' : 'stable',
            },
            {
              period: 'current',
              metric: 'Total Expenses',
              current: currentStats.totalExpenses,
              previous: previousStats.totalExpenses,
              change: currentStats.totalExpenses - previousStats.totalExpenses,
              changePercentage: previousStats.totalExpenses !== 0
                ? ((currentStats.totalExpenses - previousStats.totalExpenses) / previousStats.totalExpenses) * 100
                : 0,
              trend: currentStats.totalExpenses > previousStats.totalExpenses ? 'increasing' : 
                     currentStats.totalExpenses < previousStats.totalExpenses ? 'decreasing' : 'stable',
            },
          ];

          return trends;
        },
        CACHE_TTL.MEDIUM
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch trend analysis');
    }
  }

  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics(
    householdId: string,
    filters: AnalyticsFilters = {}
  ): Promise<{
    cashflow: CashflowData[];
    spending: SpendingData[];
    netWorthTrend: NetWorthTrend[];
    trends: TrendAnalysis[];
  }> {
    try {
      const cacheKey = `${CACHE_KEYS.dashboard(householdId)}:analytics:${JSON.stringify(filters)}`;

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const [cashflow, spending, netWorthTrend, trends] = await Promise.all([
            this.getCashflowAnalytics(householdId, filters),
            this.getSpendingAnalytics(householdId, filters),
            this.getNetWorthTrend(householdId, filters),
            this.getTrendAnalysis(householdId, filters),
          ]);

          return {
            cashflow,
            spending,
            netWorthTrend,
            trends,
          };
        },
        CACHE_TTL.SHORT
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch dashboard analytics');
    }
  }
}

export const analyticsService = new AnalyticsService();
