import { ObjectType, Field, ID, Float, Int, InputType } from '@nestjs/graphql';
import { Money, GraphQLDateTime, DateRange, GroupBy, TimeInterval, TransactionType, InsightType, InsightPriority } from './common.types';
import { Account } from './account.types';
import { Category, Transaction } from './transaction.types';

// Spending analytics
@ObjectType()
export class SpendingAnalytics {
  @Field(() => Money)
  totalSpent: Money;

  @Field(() => Money)
  averageDaily: Money;

  @Field(() => [CategorySpending])
  topCategories: CategorySpending[];

  @Field(() => [SpendingTrend])
  trends: SpendingTrend[];

  @Field(() => SpendingComparison)
  comparisons: SpendingComparison;
}

@ObjectType()
export class CategorySpending {
  @Field(() => Category)
  category: Category;

  @Field(() => Money)
  amount: Money;

  @Field(() => Int)
  transactionCount: number;

  @Field(() => Float)
  percentage: number;

  @Field(() => Float)
  changeFromPrevious: number;
}

@ObjectType()
export class SpendingTrend {
  @Field(() => GraphQLDateTime)
  date: Date;

  @Field(() => Money)
  amount: Money;

  @Field(() => Int)
  transactionCount: number;

  @Field(() => Float, { nullable: true })
  changeFromPrevious?: number;
}

@ObjectType()
export class SpendingComparison {
  @Field(() => Money)
  currentPeriod: Money;

  @Field(() => Money)
  previousPeriod: Money;

  @Field(() => Float)
  percentageChange: number;

  @Field()
  trend: string; // UP, DOWN, STABLE
}

// Cashflow analysis
@ObjectType()
export class CashflowAnalysis {
  @Field(() => Money)
  totalIncome: Money;

  @Field(() => Money)
  totalExpenses: Money;

  @Field(() => Money)
  netCashflow: Money;

  @Field(() => [CashflowPoint])
  monthlyFlow: CashflowPoint[];

  @Field(() => [CategoryCashflow])
  categoryBreakdown: CategoryCashflow[];
}

@ObjectType()
export class CashflowPoint {
  @Field(() => GraphQLDateTime)
  date: Date;

  @Field(() => Money)
  income: Money;

  @Field(() => Money)
  expenses: Money;

  @Field(() => Money)
  netFlow: Money;
}

@ObjectType()
export class CategoryCashflow {
  @Field(() => Category)
  category: Category;

  @Field(() => Money)
  income: Money;

  @Field(() => Money)
  expenses: Money;

  @Field(() => Money)
  netFlow: Money;
}

// User behavior analytics
@ObjectType()
export class UserBehavior {
  @Field(() => [SpendingPattern])
  spendingPatterns: SpendingPattern[];

  @Field(() => [MerchantFrequency])
  frequentMerchants: MerchantFrequency[];

  @Field(() => [TimeBasedTrend])
  timeBasedTrends: TimeBasedTrend[];

  @Field(() => [CategoryPreference])
  categoryPreferences: CategoryPreference[];
}

@ObjectType()
export class SpendingPattern {
  @Field()
  patternType: string; // DAILY, WEEKLY, MONTHLY, SEASONAL

  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field({ nullable: true })
  merchant?: string;

  @Field(() => Int, { nullable: true })
  dayOfWeek?: number;

  @Field(() => Int, { nullable: true })
  hourOfDay?: number;

  @Field(() => Int, { nullable: true })
  month?: number;

  @Field(() => Money)
  averageAmount: Money;

  @Field(() => Int)
  frequency: number;

  @Field(() => Float)
  confidenceScore: number;
}

@ObjectType()
export class MerchantFrequency {
  @Field()
  merchant: string;

  @Field(() => Int)
  visitCount: number;

  @Field(() => Money)
  totalSpent: Money;

  @Field(() => Money)
  averageSpent: Money;

  @Field(() => GraphQLDateTime)
  firstVisit: Date;

  @Field(() => GraphQLDateTime)
  lastVisit: Date;

  @Field(() => Int)
  monthsActive: number;
}

@ObjectType()
export class TimeBasedTrend {
  @Field()
  timeframe: string; // HOURLY, DAILY, WEEKLY, MONTHLY

  @Field(() => Int)
  period: number; // Hour of day, day of week, etc.

  @Field(() => Money)
  averageAmount: Money;

  @Field(() => Int)
  transactionCount: number;

  @Field(() => Float)
  percentage: number;
}

@ObjectType()
export class CategoryPreference {
  @Field(() => Category)
  category: Category;

  @Field(() => Money)
  totalSpent: Money;

  @Field(() => Int)
  transactionCount: number;

  @Field(() => Float)
  percentage: number;

  @Field(() => Float)
  frequency: number; // Transactions per month
}

// Trend analysis
@ObjectType()
export class TrendPoint {
  @Field(() => GraphQLDateTime)
  date: Date;

  @Field(() => Money)
  value: Money;

  @Field(() => Float, { nullable: true })
  changeFromPrevious?: number;

  @Field(() => Float, { nullable: true })
  movingAverage?: number;
}

// AI Insights
@ObjectType()
export class Insight {
  @Field(() => ID)
  id: string;

  @Field(() => InsightType)
  type: InsightType;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  data: string; // JSON string

  @Field()
  actionable: boolean;

  @Field(() => InsightPriority)
  priority: InsightPriority;

  @Field(() => GraphQLDateTime)
  createdAt: Date;

  @Field(() => GraphQLDateTime, { nullable: true })
  validUntil?: Date;

  @Field()
  isDismissed: boolean;
}

// Monthly report
@ObjectType()
export class MonthlyReport {
  @Field(() => Int)
  year: number;

  @Field(() => Int)
  month: number;

  @Field()
  narrative: string;

  @Field(() => SpendingAnalytics)
  spendingAnalytics: SpendingAnalytics;

  @Field(() => CashflowAnalysis)
  cashflowAnalysis: CashflowAnalysis;

  @Field(() => [Insight])
  insights: Insight[];

  @Field(() => [CategoryBreakdown])
  categoryBreakdown: CategoryBreakdown[];

  @Field(() => GraphQLDateTime)
  generatedAt: Date;
}

@ObjectType()
export class CategoryBreakdown {
  @Field(() => Category)
  category: Category;

  @Field(() => Money)
  amount: Money;

  @Field(() => Int)
  transactionCount: number;

  @Field(() => Float)
  percentage: number;

  @Field(() => Float)
  changeFromPrevious: number;
}

// Dashboard types
@ObjectType()
export class Dashboard {
  @Field(() => DashboardSummary)
  summary: DashboardSummary;

  @Field(() => [Account])
  accounts: Account[];

  @Field(() => [Transaction])
  recentTransactions: Transaction[];

  @Field(() => [NetWorthPoint])
  netWorthChart: NetWorthPoint[];

  @Field(() => CashflowChart)
  cashflowChart: CashflowChart;

  @Field(() => [Insight])
  insights: Insight[];

  @Field(() => GratitudeSummary, { nullable: true })
  gratitudeSummary?: GratitudeSummary;
}

@ObjectType()
export class DashboardSummary {
  @Field(() => Money)
  netWorth: Money;

  @Field(() => Money)
  totalAssets: Money;

  @Field(() => Money)
  totalLiabilities: Money;

  @Field(() => Money)
  monthlyIncome: Money;

  @Field(() => Money)
  monthlyExpenses: Money;

  @Field(() => Money)
  monthlySavings: Money;

  @Field(() => Float)
  savingsRate: number;
}

@ObjectType()
export class CashflowChart {
  @Field(() => [CashflowPoint])
  points: CashflowPoint[];

  @Field(() => Money)
  totalIncome: Money;

  @Field(() => Money)
  totalExpenses: Money;

  @Field(() => Money)
  netCashflow: Money;
}

@ObjectType()
export class GratitudeSummary {
  @Field(() => Int)
  totalEntries: number;

  @Field(() => Money)
  totalEstimatedValue: Money;

  @Field(() => [GratitudeByType])
  byType: GratitudeByType[];

  @Field(() => [String])
  topGivers: string[];
}

@ObjectType()
export class GratitudeByType {
  @Field()
  type: string;

  @Field(() => Int)
  count: number;

  @Field(() => Money)
  estimatedValue: Money;
}

// Input types
@InputType()
export class AnalyticsFilters {
  @Field(() => DateRange, { nullable: true })
  dateRange?: DateRange;

  @Field(() => [ID], { nullable: true })
  accountIds?: string[];

  @Field(() => [ID], { nullable: true })
  categoryIds?: string[];

  @Field(() => [String], { nullable: true })
  currencies?: string[];

  @Field(() => TransactionType, { nullable: true })
  transactionType?: TransactionType;

  @Field(() => GroupBy, { nullable: true })
  groupBy?: GroupBy;

  @Field(() => TimeInterval, { nullable: true })
  interval?: TimeInterval;
}

@InputType()
export class NetWorthHistoryInput {
  @Field(() => DateRange)
  period: DateRange;

  @Field(() => TimeInterval)
  interval: TimeInterval;

  @Field({ nullable: true })
  currency?: string;
}
