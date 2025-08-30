export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SpendingAnalytics {
  totalSpent: number;
  totalIncome: number;
  netCashflow: number;
  averageDaily: number;
  averageTransaction: number;
  transactionCount: number;
  topCategories: CategorySpending[];
  trends: SpendingTrend[];
  comparisons: SpendingComparison;
  currency: string;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  averageAmount: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendPercentage: number;
}

export interface SpendingTrend {
  date: Date;
  amount: number;
  category?: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface SpendingComparison {
  previousPeriod: {
    totalSpent: number;
    totalIncome: number;
    netCashflow: number;
  };
  changePercentage: {
    spending: number;
    income: number;
    netCashflow: number;
  };
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

export interface CashflowAnalysis {
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
  inflowByCategory: CategoryFlow[];
  outflowByCategory: CategoryFlow[];
  monthlyFlow: MonthlyFlow[];
  projectedFlow: ProjectedFlow[];
  currency: string;
}

export interface CategoryFlow {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyFlow {
  month: Date;
  inflow: number;
  outflow: number;
  netFlow: number;
}

export interface ProjectedFlow {
  month: Date;
  projectedInflow: number;
  projectedOutflow: number;
  projectedNetFlow: number;
  confidence: number;
}

export interface NetWorthAnalysis {
  currentNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  history: NetWorthPoint[];
  assetBreakdown: AssetBreakdown[];
  liabilityBreakdown: LiabilityBreakdown[];
  projectedNetWorth: ProjectedNetWorth[];
  currency: string;
}

export interface NetWorthPoint {
  date: Date;
  netWorth: number;
  assets: number;
  liabilities: number;
}

export interface AssetBreakdown {
  accountType: string;
  accountSubtype: string;
  amount: number;
  percentage: number;
  accounts: AccountSummary[];
}

export interface LiabilityBreakdown {
  accountType: string;
  accountSubtype: string;
  amount: number;
  percentage: number;
  accounts: AccountSummary[];
}

export interface AccountSummary {
  accountId: string;
  accountName: string;
  amount: number;
  currency: string;
}

export interface ProjectedNetWorth {
  date: Date;
  projectedNetWorth: number;
  confidence: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  averageAmount: number;
  subcategories?: CategoryBreakdown[];
  trend: TrendData;
}

export interface TrendData {
  direction: 'UP' | 'DOWN' | 'STABLE';
  percentage: number;
  previousPeriodAmount: number;
}

export interface TrendAnalysis {
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  trends: TrendPoint[];
  seasonality: SeasonalityData;
  forecast: ForecastPoint[];
}

export interface TrendPoint {
  date: Date;
  value: number;
  category?: string;
  type: 'SPENDING' | 'INCOME' | 'NET_WORTH' | 'CATEGORY';
}

export interface SeasonalityData {
  hasSeasonality: boolean;
  seasonalFactors: SeasonalFactor[];
  peakPeriods: PeakPeriod[];
}

export interface SeasonalFactor {
  period: string; // e.g., "January", "Q1", "Week 1"
  factor: number; // multiplier relative to average
}

export interface PeakPeriod {
  period: string;
  amount: number;
  description: string;
}

export interface ForecastPoint {
  date: Date;
  predictedValue: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

export interface FinancialReport {
  id: string;
  householdId: string;
  reportType: ReportType;
  title: string;
  description: string;
  period: DateRange;
  data: Record<string, unknown>;
  format: ExportFormat;
  fileUrl?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export enum ReportType {
  SPENDING_SUMMARY = 'SPENDING_SUMMARY',
  CASHFLOW_ANALYSIS = 'CASHFLOW_ANALYSIS',
  NET_WORTH_REPORT = 'NET_WORTH_REPORT',
  CATEGORY_BREAKDOWN = 'CATEGORY_BREAKDOWN',
  MONTHLY_SUMMARY = 'MONTHLY_SUMMARY',
  ANNUAL_SUMMARY = 'ANNUAL_SUMMARY',
  CUSTOM_REPORT = 'CUSTOM_REPORT',
}

export enum ExportFormat {
  PDF = 'PDF',
  CSV = 'CSV',
  JSON = 'JSON',
  EXCEL = 'EXCEL',
}

export interface ExportOptions {
  format: ExportFormat;
  includeCharts?: boolean;
  includeDetails?: boolean;
  currency?: string;
  locale?: string;
}

export interface AnalyticsFilters {
  dateRange: DateRange;
  categoryIds?: string[];
  accountIds?: string[];
  merchantIds?: string[];
  tags?: string[];
  amountRange?: {
    min: number;
    max: number;
  };
  currency?: string;
  includeTransfers?: boolean;
}

export interface MaterializedViewRefreshStatus {
  viewName: string;
  lastRefreshed: Date;
  nextRefresh: Date;
  status: 'REFRESHING' | 'COMPLETED' | 'FAILED';
  duration?: number;
  error?: string;
}

export interface PerformanceMetrics {
  queryExecutionTime: number;
  cacheHitRate: number;
  dataFreshness: Date;
  recordsProcessed: number;
}
