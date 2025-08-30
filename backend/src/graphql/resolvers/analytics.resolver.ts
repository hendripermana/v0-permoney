import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  SpendingAnalytics,
  CashflowAnalysis,
  UserBehavior,
  TrendPoint,
  NetWorthPoint,
  AnalyticsFilters,
  NetWorthHistoryInput
} from '../types/analytics.types';
import { Money, DateRange, GroupBy, TimeInterval } from '../types/common.types';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AnalyticsResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => SpendingAnalytics)
  async spendingAnalytics(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('filters', { type: () => AnalyticsFilters, nullable: true }) filters?: AnalyticsFilters,
  ): Promise<SpendingAnalytics> {
    const dateRange = filters?.dateRange || this.getDefaultDateRange();
    
    // Get spending data
    const spendingData = await this.prisma.$queryRaw<Array<{
      categoryId: string;
      categoryName: string;
      totalAmount: bigint;
      transactionCount: number;
    }>>`
      SELECT 
        c.id as "categoryId",
        c.name as "categoryName",
        SUM(ABS(t.amount_cents)) as "totalAmount",
        COUNT(t.id) as "transactionCount"
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.household_id = ${householdId}
        AND t.date >= ${dateRange.startDate}
        AND t.date <= ${dateRange.endDate}
        AND t.amount_cents < 0
        AND t.transfer_account_id IS NULL
      GROUP BY c.id, c.name
      ORDER BY "totalAmount" DESC
      LIMIT 10
    `;

    const totalSpent = spendingData.reduce((sum, item) => sum + item.totalAmount, BigInt(0));
    const totalTransactions = spendingData.reduce((sum, item) => sum + item.transactionCount, 0);
    const averageDaily = totalSpent / BigInt(this.getDaysBetween(dateRange.startDate, dateRange.endDate));

    // Get trends
    const trendData = await this.getTrendData(householdId, dateRange, filters?.groupBy || GroupBy.DAY);

    // Get comparison with previous period
    const previousPeriod = this.getPreviousPeriod(dateRange);
    const previousSpending = await this.getTotalSpending(householdId, previousPeriod);
    const currentSpending = totalSpent;
    const percentageChange = previousSpending > 0 
      ? Number((currentSpending - previousSpending) * BigInt(100) / previousSpending)
      : 0;

    return {
      totalSpent: this.createMoney(totalSpent, 'IDR'),
      averageDaily: this.createMoney(averageDaily, 'IDR'),
      topCategories: spendingData.map(item => ({
        category: {
          id: item.categoryId,
          name: item.categoryName,
        } as any,
        amount: this.createMoney(item.totalAmount, 'IDR'),
        transactionCount: item.transactionCount,
        percentage: totalSpent > 0 ? Number(item.totalAmount * BigInt(100) / totalSpent) : 0,
        changeFromPrevious: 0, // TODO: Calculate change from previous period
      })),
      trends: trendData,
      comparisons: {
        currentPeriod: this.createMoney(currentSpending, 'IDR'),
        previousPeriod: this.createMoney(previousSpending, 'IDR'),
        percentageChange,
        trend: percentageChange > 5 ? 'UP' : percentageChange < -5 ? 'DOWN' : 'STABLE',
      },
    };
  }

  @Query(() => CashflowAnalysis)
  async cashflowAnalysis(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('filters', { type: () => AnalyticsFilters, nullable: true }) filters?: AnalyticsFilters,
  ): Promise<CashflowAnalysis> {
    const dateRange = filters?.dateRange || this.getDefaultDateRange();

    // Get monthly cashflow data
    const cashflowData = await this.prisma.$queryRaw<Array<{
      month: Date;
      income: bigint;
      expenses: bigint;
    }>>`
      SELECT 
        DATE_TRUNC('month', t.date) as month,
        COALESCE(SUM(CASE WHEN t.amount_cents > 0 THEN t.amount_cents ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN t.amount_cents < 0 THEN ABS(t.amount_cents) ELSE 0 END), 0) as expenses
      FROM transactions t
      WHERE t.household_id = ${householdId}
        AND t.date >= ${dateRange.startDate}
        AND t.date <= ${dateRange.endDate}
        AND t.transfer_account_id IS NULL
      GROUP BY DATE_TRUNC('month', t.date)
      ORDER BY month
    `;

    const totalIncome = cashflowData.reduce((sum, item) => sum + item.income, BigInt(0));
    const totalExpenses = cashflowData.reduce((sum, item) => sum + item.expenses, BigInt(0));
    const netCashflow = totalIncome - totalExpenses;

    // Get category breakdown
    const categoryData = await this.prisma.$queryRaw<Array<{
      categoryId: string;
      categoryName: string;
      income: bigint;
      expenses: bigint;
    }>>`
      SELECT 
        c.id as "categoryId",
        c.name as "categoryName",
        COALESCE(SUM(CASE WHEN t.amount_cents > 0 THEN t.amount_cents ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN t.amount_cents < 0 THEN ABS(t.amount_cents) ELSE 0 END), 0) as expenses
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.household_id = ${householdId}
        AND t.date >= ${dateRange.startDate}
        AND t.date <= ${dateRange.endDate}
        AND t.transfer_account_id IS NULL
      GROUP BY c.id, c.name
      HAVING SUM(ABS(t.amount_cents)) > 0
      ORDER BY (income + expenses) DESC
    `;

    return {
      totalIncome: this.createMoney(totalIncome, 'IDR'),
      totalExpenses: this.createMoney(totalExpenses, 'IDR'),
      netCashflow: this.createMoney(netCashflow, 'IDR'),
      monthlyFlow: cashflowData.map(item => ({
        date: item.month,
        income: this.createMoney(item.income, 'IDR'),
        expenses: this.createMoney(item.expenses, 'IDR'),
        netFlow: this.createMoney(item.income - item.expenses, 'IDR'),
      })),
      categoryBreakdown: categoryData.map(item => ({
        category: {
          id: item.categoryId,
          name: item.categoryName,
        } as any,
        income: this.createMoney(item.income, 'IDR'),
        expenses: this.createMoney(item.expenses, 'IDR'),
        netFlow: this.createMoney(item.income - item.expenses, 'IDR'),
      })),
    };
  }

  @Query(() => [NetWorthPoint])
  async netWorthHistory(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('input') input: NetWorthHistoryInput,
  ): Promise<NetWorthPoint[]> {
    const { period, interval } = input;
    const currency = input.currency || 'IDR';

    // This is a simplified version - in reality, you'd need to calculate
    // net worth at each point in time based on account balances
    const netWorthData = await this.prisma.$queryRaw<Array<{
      date: Date;
      totalAssets: bigint;
      totalLiabilities: bigint;
    }>>`
      WITH date_series AS (
        SELECT generate_series(
          ${period.startDate}::date,
          ${period.endDate}::date,
          ${this.getIntervalString(interval)}::interval
        ) as date
      ),
      account_balances AS (
        SELECT 
          ds.date,
          a.type,
          COALESCE(SUM(
            CASE 
              WHEN a.type = 'ASSET' AND le.type = 'DEBIT' THEN le.amount_cents
              WHEN a.type = 'ASSET' AND le.type = 'CREDIT' THEN -le.amount_cents
              WHEN a.type = 'LIABILITY' AND le.type = 'DEBIT' THEN -le.amount_cents
              WHEN a.type = 'LIABILITY' AND le.type = 'CREDIT' THEN le.amount_cents
              ELSE 0
            END
          ), 0) as balance
        FROM date_series ds
        LEFT JOIN accounts a ON a.household_id = ${householdId} AND a.currency = ${currency}
        LEFT JOIN ledger_entries le ON le.account_id = a.id
        LEFT JOIN transactions t ON le.transaction_id = t.id AND t.date <= ds.date
        GROUP BY ds.date, a.type
      )
      SELECT 
        date,
        COALESCE(SUM(CASE WHEN type = 'ASSET' THEN balance ELSE 0 END), 0) as "totalAssets",
        COALESCE(SUM(CASE WHEN type = 'LIABILITY' THEN balance ELSE 0 END), 0) as "totalLiabilities"
      FROM account_balances
      GROUP BY date
      ORDER BY date
    `;

    return netWorthData.map(item => ({
      date: item.date,
      totalAssets: this.createMoney(item.totalAssets, currency),
      totalLiabilities: this.createMoney(item.totalLiabilities, currency),
      netWorth: this.createMoney(item.totalAssets - item.totalLiabilities, currency),
    }));
  }

  @Query(() => UserBehavior)
  async userBehavior(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
    @Args('filters', { type: () => AnalyticsFilters, nullable: true }) filters?: AnalyticsFilters,
  ): Promise<UserBehavior> {
    const dateRange = filters?.dateRange || this.getDefaultDateRange();

    // Get spending patterns
    const patterns = await this.prisma.spendingPattern.findMany({
      where: {
        householdId,
        userId: userId || undefined,
      },
    });

    // Get merchant frequency
    const merchantData = await this.prisma.$queryRaw<Array<{
      merchant: string;
      visitCount: number;
      totalSpent: bigint;
      firstVisit: Date;
      lastVisit: Date;
    }>>`
      SELECT 
        t.merchant,
        COUNT(*) as "visitCount",
        SUM(ABS(t.amount_cents)) as "totalSpent",
        MIN(t.date) as "firstVisit",
        MAX(t.date) as "lastVisit"
      FROM transactions t
      WHERE t.household_id = ${householdId}
        AND t.merchant IS NOT NULL
        AND t.date >= ${dateRange.startDate}
        AND t.date <= ${dateRange.endDate}
        ${userId ? `AND t.created_by = ${userId}` : ''}
      GROUP BY t.merchant
      ORDER BY "visitCount" DESC
      LIMIT 20
    `;

    return {
      spendingPatterns: patterns.map(pattern => ({
        patternType: pattern.patternType,
        category: pattern.categoryId ? { id: pattern.categoryId } as any : undefined,
        merchant: pattern.merchant,
        dayOfWeek: pattern.dayOfWeek,
        hourOfDay: pattern.hourOfDay,
        month: pattern.month,
        averageAmount: this.createMoney(pattern.averageAmountCents, 'IDR'),
        frequency: pattern.frequency,
        confidenceScore: Number(pattern.confidenceScore),
      })),
      frequentMerchants: merchantData.map(item => ({
        merchant: item.merchant,
        visitCount: item.visitCount,
        totalSpent: this.createMoney(item.totalSpent, 'IDR'),
        averageSpent: this.createMoney(item.totalSpent / BigInt(item.visitCount), 'IDR'),
        firstVisit: item.firstVisit,
        lastVisit: item.lastVisit,
        monthsActive: this.getMonthsBetween(item.firstVisit, item.lastVisit),
      })),
      timeBasedTrends: [], // TODO: Implement time-based trends
      categoryPreferences: [], // TODO: Implement category preferences
    };
  }

  // Helper methods
  private createMoney(cents: bigint, currency: string): Money {
    const amount = Number(cents) / 100;
    return {
      cents,
      currency,
      amount,
      formatted: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency,
      }).format(amount),
    };
  }

  private getDefaultDateRange(): DateRange {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3); // Last 3 months
    return { startDate, endDate };
  }

  private getPreviousPeriod(dateRange: DateRange): DateRange {
    const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const startDate = new Date(dateRange.startDate.getTime() - duration);
    const endDate = new Date(dateRange.endDate.getTime() - duration);
    return { startDate, endDate };
  }

  private getDaysBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getMonthsBetween(start: Date, end: Date): number {
    const months = (end.getFullYear() - start.getFullYear()) * 12;
    return months - start.getMonth() + end.getMonth();
  }

  private getIntervalString(interval: TimeInterval): string {
    switch (interval) {
      case TimeInterval.DAILY:
        return '1 day';
      case TimeInterval.WEEKLY:
        return '1 week';
      case TimeInterval.MONTHLY:
        return '1 month';
      case TimeInterval.QUARTERLY:
        return '3 months';
      case TimeInterval.YEARLY:
        return '1 year';
      default:
        return '1 day';
    }
  }

  private async getTrendData(
    householdId: string,
    dateRange: DateRange,
    groupBy: GroupBy,
  ): Promise<TrendPoint[]> {
    // Simplified trend calculation
    const trendData = await this.prisma.$queryRaw<Array<{
      date: Date;
      amount: bigint;
    }>>`
      SELECT 
        DATE_TRUNC(${this.getGroupByString(groupBy)}, t.date) as date,
        SUM(ABS(t.amount_cents)) as amount
      FROM transactions t
      WHERE t.household_id = ${householdId}
        AND t.date >= ${dateRange.startDate}
        AND t.date <= ${dateRange.endDate}
        AND t.amount_cents < 0
        AND t.transfer_account_id IS NULL
      GROUP BY DATE_TRUNC(${this.getGroupByString(groupBy)}, t.date)
      ORDER BY date
    `;

    return trendData.map((item, index) => ({
      date: item.date,
      value: this.createMoney(item.amount, 'IDR'),
      changeFromPrevious: index > 0 
        ? Number((item.amount - trendData[index - 1].amount) * BigInt(100) / trendData[index - 1].amount)
        : undefined,
      movingAverage: undefined, // TODO: Calculate moving average
    }));
  }

  private getGroupByString(groupBy: GroupBy): string {
    switch (groupBy) {
      case GroupBy.DAY:
        return 'day';
      case GroupBy.WEEK:
        return 'week';
      case GroupBy.MONTH:
        return 'month';
      case GroupBy.QUARTER:
        return 'quarter';
      case GroupBy.YEAR:
        return 'year';
      default:
        return 'day';
    }
  }

  private async getTotalSpending(householdId: string, dateRange: DateRange): Promise<bigint> {
    const result = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COALESCE(SUM(ABS(amount_cents)), 0) as total
      FROM transactions
      WHERE household_id = ${householdId}
        AND date >= ${dateRange.startDate}
        AND date <= ${dateRange.endDate}
        AND amount_cents < 0
        AND transfer_account_id IS NULL
    `;

    return result[0]?.total || BigInt(0);
  }
}
