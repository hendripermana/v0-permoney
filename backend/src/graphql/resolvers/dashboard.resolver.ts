import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AccountsService } from '../../accounts/accounts.service';
import { TransactionsService } from '../../transactions/transactions.service';
import { AIInsightsService } from '../../ai-insights/ai-insights.service';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  Dashboard,
  DashboardSummary,
  CashflowChart,
  GratitudeSummary
} from '../types/analytics.types';
import { ViewType, DateRange } from '../types/common.types';
import { Account, NetWorthPoint } from '../types/account.types';
import { Transaction } from '../types/transaction.types';
import { Insight } from '../types/analytics.types';
import { Money } from '../types/common.types';

@Resolver(() => Dashboard)
export class DashboardResolver {
  constructor(
    private accountsService: AccountsService,
    private transactionsService: TransactionsService,
    private aiInsightsService: AIInsightsService,
    private prisma: PrismaService,
  ) {}

  @Query(() => Dashboard)
  async dashboard(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('viewType', { type: () => ViewType, defaultValue: ViewType.COMBINED }) viewType: ViewType,
    @Args('period', { type: () => DateRange, nullable: true }) period?: DateRange,
  ): Promise<Dashboard> {
    const dateRange = period || this.getDefaultDateRange();

    // Get accounts
    const accountsData = await this.accountsService.getAccountsByHousehold(householdId, {});
    const accounts = accountsData.map(account => this.mapAccount(account));

    // Get recent transactions
    const transactionsResult = await this.transactionsService.getTransactions(householdId, {
      page: 1,
      limit: 10,
    });
    const recentTransactions = transactionsResult.transactions.map(t => this.mapTransaction(t));

    // Get net worth summary
    const netWorthSummary = await this.accountsService.getNetWorthSummary(householdId);
    
    // Get dashboard summary
    const summary = await this.getDashboardSummary(householdId, dateRange);

    // Get net worth chart data
    const netWorthChart = await this.getNetWorthChart(householdId, dateRange);

    // Get cashflow chart
    const cashflowChart = await this.getCashflowChart(householdId, dateRange);

    // Get AI insights
    const insights = await this.getInsights(householdId);

    // Get gratitude summary
    const gratitudeSummary = await this.getGratitudeSummary(householdId, dateRange);

    return {
      summary,
      accounts,
      recentTransactions,
      netWorthChart,
      cashflowChart,
      insights,
      gratitudeSummary,
    };
  }

  private async getDashboardSummary(householdId: string, dateRange: DateRange): Promise<DashboardSummary> {
    // Get net worth
    const netWorthSummary = await this.accountsService.getNetWorthSummary(householdId);

    // Get monthly income and expenses
    const monthlyData = await this.prisma.$queryRaw<Array<{
      income: bigint;
      expenses: bigint;
    }>>`
      SELECT 
        COALESCE(SUM(CASE WHEN amount_cents > 0 THEN amount_cents ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN amount_cents < 0 THEN ABS(amount_cents) ELSE 0 END), 0) as expenses
      FROM transactions
      WHERE household_id = ${householdId}
        AND date >= ${dateRange.startDate}
        AND date <= ${dateRange.endDate}
        AND transfer_account_id IS NULL
    `;

    const monthlyIncome = monthlyData[0]?.income || BigInt(0);
    const monthlyExpenses = monthlyData[0]?.expenses || BigInt(0);
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? Number(monthlySavings * BigInt(100) / monthlyIncome) : 0;

    return {
      netWorth: this.createMoney(netWorthSummary.netWorth, 'IDR'),
      totalAssets: this.createMoney(netWorthSummary.totalAssets, 'IDR'),
      totalLiabilities: this.createMoney(netWorthSummary.totalLiabilities, 'IDR'),
      monthlyIncome: this.createMoney(monthlyIncome, 'IDR'),
      monthlyExpenses: this.createMoney(monthlyExpenses, 'IDR'),
      monthlySavings: this.createMoney(monthlySavings, 'IDR'),
      savingsRate,
    };
  }

  private async getNetWorthChart(householdId: string, dateRange: DateRange): Promise<NetWorthPoint[]> {
    // Simplified net worth calculation over time
    const netWorthData = await this.prisma.$queryRaw<Array<{
      date: Date;
      totalAssets: bigint;
      totalLiabilities: bigint;
    }>>`
      WITH RECURSIVE date_series AS (
        SELECT ${dateRange.startDate}::date as date
        UNION ALL
        SELECT date + interval '1 day'
        FROM date_series
        WHERE date < ${dateRange.endDate}::date
      )
      SELECT 
        ds.date,
        COALESCE(SUM(CASE WHEN a.type = 'ASSET' THEN a.balance_cents ELSE 0 END), 0) as "totalAssets",
        COALESCE(SUM(CASE WHEN a.type = 'LIABILITY' THEN a.balance_cents ELSE 0 END), 0) as "totalLiabilities"
      FROM date_series ds
      CROSS JOIN accounts a
      WHERE a.household_id = ${householdId}
        AND a.is_active = true
      GROUP BY ds.date
      ORDER BY ds.date
      LIMIT 30
    `;

    return netWorthData.map(item => ({
      date: item.date,
      totalAssets: this.createMoney(item.totalAssets, 'IDR'),
      totalLiabilities: this.createMoney(item.totalLiabilities, 'IDR'),
      netWorth: this.createMoney(item.totalAssets - item.totalLiabilities, 'IDR'),
    }));
  }

  private async getCashflowChart(householdId: string, dateRange: DateRange): Promise<CashflowChart> {
    const cashflowData = await this.prisma.$queryRaw<Array<{
      date: Date;
      income: bigint;
      expenses: bigint;
    }>>`
      SELECT 
        DATE_TRUNC('day', date) as date,
        COALESCE(SUM(CASE WHEN amount_cents > 0 THEN amount_cents ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN amount_cents < 0 THEN ABS(amount_cents) ELSE 0 END), 0) as expenses
      FROM transactions
      WHERE household_id = ${householdId}
        AND date >= ${dateRange.startDate}
        AND date <= ${dateRange.endDate}
        AND transfer_account_id IS NULL
      GROUP BY DATE_TRUNC('day', date)
      ORDER BY date
      LIMIT 30
    `;

    const totalIncome = cashflowData.reduce((sum, item) => sum + item.income, BigInt(0));
    const totalExpenses = cashflowData.reduce((sum, item) => sum + item.expenses, BigInt(0));
    const netCashflow = totalIncome - totalExpenses;

    return {
      points: cashflowData.map(item => ({
        date: item.date,
        income: this.createMoney(item.income, 'IDR'),
        expenses: this.createMoney(item.expenses, 'IDR'),
        netFlow: this.createMoney(item.income - item.expenses, 'IDR'),
      })),
      totalIncome: this.createMoney(totalIncome, 'IDR'),
      totalExpenses: this.createMoney(totalExpenses, 'IDR'),
      netCashflow: this.createMoney(netCashflow, 'IDR'),
    };
  }

  private async getInsights(householdId: string): Promise<Insight[]> {
    const insights = await this.prisma.financialInsight.findMany({
      where: {
        householdId,
        isDismissed: false,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 5,
    });

    return insights.map(insight => ({
      id: insight.id,
      type: insight.insightType as any,
      title: insight.title,
      description: insight.description,
      data: JSON.stringify(insight.data),
      actionable: insight.isActionable,
      priority: insight.priority as any,
      createdAt: insight.createdAt,
      validUntil: insight.validUntil,
      isDismissed: insight.isDismissed,
    }));
  }

  private async getGratitudeSummary(householdId: string, dateRange: DateRange): Promise<GratitudeSummary | null> {
    const gratitudeData = await this.prisma.gratitudeEntry.findMany({
      where: {
        householdId,
        date: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    });

    if (gratitudeData.length === 0) {
      return null;
    }

    const totalEstimatedValue = gratitudeData.reduce(
      (sum, entry) => sum + (entry.estimatedValueCents || BigInt(0)),
      BigInt(0),
    );

    const byType = gratitudeData.reduce((acc, entry) => {
      const existing = acc.find(item => item.type === entry.type);
      if (existing) {
        existing.count++;
        existing.estimatedValue = this.createMoney(
          existing.estimatedValue.cents + (entry.estimatedValueCents || BigInt(0)),
          'IDR',
        );
      } else {
        acc.push({
          type: entry.type,
          count: 1,
          estimatedValue: this.createMoney(entry.estimatedValueCents || BigInt(0), 'IDR'),
        });
      }
      return acc;
    }, [] as Array<{ type: string; count: number; estimatedValue: Money }>);

    const topGivers = [...new Set(gratitudeData.map(entry => entry.giver))]
      .slice(0, 5);

    return {
      totalEntries: gratitudeData.length,
      totalEstimatedValue: this.createMoney(totalEstimatedValue, 'IDR'),
      byType,
      topGivers,
    };
  }

  private getDefaultDateRange(): DateRange {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1); // Last month
    return { startDate, endDate };
  }

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

  private mapAccount(account: any): Account {
    return {
      id: account.id,
      householdId: account.householdId,
      name: account.name,
      type: account.type,
      subtype: account.subtype,
      currency: account.currency,
      accountNumber: account.accountNumber,
      balance: this.createMoney(account.balanceCents, account.currency),
      calculatedBalance: this.createMoney(account.calculatedBalance || account.balanceCents, account.currency),
      isActive: account.isActive,
      ownerId: account.ownerId,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  private mapTransaction(transaction: any): Transaction {
    return {
      id: transaction.id,
      householdId: transaction.householdId,
      amount: this.createMoney(transaction.amountCents, transaction.currency),
      originalAmount: transaction.originalAmountCents 
        ? this.createMoney(transaction.originalAmountCents, transaction.originalCurrency || transaction.currency)
        : undefined,
      exchangeRate: transaction.exchangeRate ? Number(transaction.exchangeRate) : undefined,
      description: transaction.description,
      category: transaction.category,
      merchant: transaction.merchant,
      merchantData: transaction.merchantData,
      merchantName: transaction.merchantName,
      merchantLogoUrl: transaction.merchantLogoUrl,
      merchantColor: transaction.merchantColor,
      date: transaction.date,
      account: transaction.account,
      transferAccount: transaction.transferAccount,
      receiptUrl: transaction.receiptUrl,
      tags: transaction.tags || [],
      splits: transaction.splits || [],
      ledgerEntries: transaction.ledgerEntries || [],
      createdBy: transaction.createdBy,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
