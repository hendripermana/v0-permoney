/**
 * AI-generated financial insight with actionable recommendations
 */
export interface AIInsight {
  /** Unique identifier for the insight */
  id?: string;
  /** Type of insight (e.g., SPENDING_PATTERN, ANOMALY_DETECTED, RECOMMENDATION) */
  type: InsightType;
  /** Human-readable title for the insight */
  title: string;
  /** Detailed description of the insight */
  description: string;
  /** Additional structured data related to the insight */
  data: Record<string, any>;
  /** Priority level for displaying the insight */
  priority: Priority;
  /** Whether the insight requires user action */
  isActionable: boolean;
  /** Optional expiration date for the insight */
  validUntil?: Date;
  /** When the insight was created */
  createdAt?: Date;
}

export type InsightType = 
  | 'SPENDING_PATTERN' 
  | 'ANOMALY_DETECTED' 
  | 'RECOMMENDATION' 
  | 'MONTHLY_REPORT'
  | 'BUDGET_ALERT'
  | 'SAVINGS_OPPORTUNITY';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Detected spending pattern with statistical confidence
 */
export interface SpendingPattern {
  /** Unique identifier for the pattern */
  id?: string;
  /** Household this pattern belongs to */
  householdId: string;
  /** Optional user-specific pattern */
  userId?: string;
  /** Type of temporal pattern detected */
  type: PatternType;
  /** Category ID if pattern is category-specific */
  categoryId?: string;
  /** Human-readable category name */
  categoryName?: string;
  /** Merchant name if pattern is merchant-specific */
  merchant?: string;
  /** Day of week (0=Sunday, 6=Saturday) for weekly patterns */
  dayOfWeek?: number;
  /** Hour of day (0-23) for daily patterns */
  hourOfDay?: number;
  /** Month (1-12) for seasonal patterns */
  month?: number;
  /** Average spending amount in cents */
  averageAmount: number;
  /** Number of occurrences that support this pattern */
  frequency: number;
  /** Statistical confidence score (0-1) */
  confidence: number;
  /** Trend direction over time */
  trend: Trend;
  /** When the pattern was last updated */
  lastUpdated?: Date;
}

export type PatternType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASONAL';
export type Trend = 'INCREASING' | 'DECREASING' | 'STABLE';

export interface FinancialAnomaly {
  id?: string;
  type: 'UNUSUAL_SPENDING' | 'UNUSUAL_INCOME' | 'UNUSUAL_MERCHANT' | 'UNUSUAL_CATEGORY' | 'UNUSUAL_TIME';
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  transactionId?: string;
  amount: number; // in cents
  expectedAmount?: number; // in cents
  deviation: number; // percentage
  confidence: number; // 0-1
  detectedAt: Date;
  data: Record<string, any>;
}

export interface PersonalizedRecommendation {
  id?: string;
  type: 'BUDGET_OPTIMIZATION' | 'SAVINGS_OPPORTUNITY' | 'DEBT_REDUCTION' | 'INVESTMENT_SUGGESTION' | 'SPENDING_REDUCTION';
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  potentialSavings?: number; // in cents
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  actionSteps: string[];
  data: Record<string, any>;
  createdAt?: Date;
}

export interface MonthlyReport {
  id?: string;
  householdId: string;
  year: number;
  month: number;
  title: string;
  summary: string;
  narrative: string;
  keyInsights: string[];
  financialHighlights: FinancialHighlight[];
  spendingStory: SpendingStory;
  achievements: Achievement[];
  recommendations: PersonalizedRecommendation[];
  visualData: VisualData;
  createdAt?: Date;
}

export interface FinancialHighlight {
  type: 'INCOME' | 'EXPENSES' | 'SAVINGS' | 'NET_WORTH' | 'DEBT';
  title: string;
  value: number; // in cents
  change: number; // percentage change from previous month
  trend: 'UP' | 'DOWN' | 'STABLE';
  isPositive: boolean;
}

export interface SpendingStory {
  totalSpent: number; // in cents
  topCategories: CategorySpending[];
  unusualSpending: UnusualSpending[];
  savingsOpportunities: SavingsOpportunity[];
  narrative: string;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  amount: number; // in cents
  percentage: number;
  change: number; // percentage change from previous month
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface UnusualSpending {
  description: string;
  amount: number; // in cents
  date: Date;
  category: string;
  reason: string;
}

export interface SavingsOpportunity {
  description: string;
  potentialSavings: number; // in cents
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
}

export interface Achievement {
  type: 'SAVINGS_GOAL' | 'BUDGET_ADHERENCE' | 'DEBT_REDUCTION' | 'SPENDING_CONTROL' | 'FINANCIAL_MILESTONE';
  title: string;
  description: string;
  value?: number; // in cents
  emoji: string;
}

export interface VisualData {
  spendingByCategory: ChartData[];
  incomeVsExpenses: ChartData[];
  netWorthTrend: ChartData[];
  budgetProgress: BudgetProgressData[];
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
  date?: Date;
}

export interface BudgetProgressData {
  categoryName: string;
  allocated: number; // in cents
  spent: number; // in cents
  remaining: number; // in cents
  percentage: number;
}

export interface InsightGenerationOptions {
  includePatterns?: boolean;
  includeAnomalies?: boolean;
  includeRecommendations?: boolean;
  timeframe?: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  minConfidence?: number;
}

export interface PatternAnalysisOptions {
  minFrequency?: number;
  minConfidence?: number;
  includeSeasonality?: boolean;
  includeTrends?: boolean;
}

export interface AnomalyDetectionOptions {
  sensitivity?: 'LOW' | 'MEDIUM' | 'HIGH';
  minDeviation?: number;
  includeTimeBasedAnomalies?: boolean;
  includeAmountBasedAnomalies?: boolean;
}
