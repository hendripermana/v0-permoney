export interface Budget {
  id: string;
  householdId: string;
  name: string;
  period: BudgetPeriod;
  totalAllocatedCents: number;
  currency: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  categoryId: string;
  allocatedAmountCents: number;
  spentAmountCents: number;
  carryOverCents: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  parentId?: string;
}

export enum BudgetPeriod {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export interface CreateBudgetDto {
  name: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  currency?: string;
  categories: BudgetCategoryAllocationDto[];
}

export interface BudgetCategoryAllocationDto {
  categoryId: string;
  allocatedAmountCents: number;
  carryOverCents?: number;
}

export interface UpdateBudgetDto extends Partial<CreateBudgetDto> {
  isActive?: boolean;
}

export interface BudgetProgress {
  budgetId: string;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationPercentage: number;
  categories: BudgetCategoryProgress[];
  isOverBudget: boolean;
  daysRemaining: number;
  projectedSpending?: number;
}

export interface BudgetCategoryProgress {
  categoryId: string;
  categoryName: string;
  allocated: number;
  spent: number;
  remaining: number;
  utilizationPercentage: number;
  isOverBudget: boolean;
  color?: string;
  icon?: string;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  categoryId?: string;
  type: BudgetAlertType;
  severity: BudgetAlertSeverity;
  title: string;
  message: string;
  threshold: number;
  currentValue: number;
  createdAt: string;
  isRead: boolean;
}

export enum BudgetAlertType {
  OVERSPEND = 'OVERSPEND',
  APPROACHING_LIMIT = 'APPROACHING_LIMIT',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  UNUSUAL_SPENDING = 'UNUSUAL_SPENDING'
}

export enum BudgetAlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface BudgetRecommendation {
  categoryId: string;
  categoryName: string;
  currentAllocation: number;
  recommendedAllocation: number;
  reason: string;
  confidence: number;
  potentialSavings?: number;
}

export interface BudgetAnalytics {
  totalBudgets: number;
  activeBudgets: number;
  averageUtilization: number;
  topSpendingCategories: CategorySpending[];
  monthlyTrends: BudgetTrend[];
  recommendations: BudgetRecommendation[];
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  totalSpent: number;
  budgetedAmount: number;
  utilizationPercentage: number;
  color?: string;
}

export interface BudgetTrend {
  month: string;
  totalBudgeted: number;
  totalSpent: number;
  utilizationPercentage: number;
}

export interface Goal {
  id: string;
  householdId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: string;
  category?: string;
  priority: GoalPriority;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}

export interface CreateGoalDto {
  name: string;
  description?: string;
  targetAmount: number;
  currency?: string;
  targetDate?: string;
  category?: string;
  priority: GoalPriority;
}

export interface UpdateGoalDto extends Partial<CreateGoalDto> {
  currentAmount?: number;
  status?: GoalStatus;
}

export interface GoalProgress {
  goalId: string;
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining?: number;
  monthlyTargetSaving?: number;
  isOnTrack: boolean;
  projectedCompletionDate?: string;
}
