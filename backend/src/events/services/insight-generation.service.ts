import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BehaviorInsight } from '../types/event.types';

@Injectable()
export class InsightGenerationService {
  private readonly logger = new Logger(InsightGenerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate comprehensive financial insights for a household
   */
  async generateInsights(householdId: string): Promise<BehaviorInsight[]> {
    const insights: BehaviorInsight[] = [];

    try {
      // Generate different types of insights
      const spendingInsights = await this.generateSpendingInsights(householdId);
      const budgetInsights = await this.generateBudgetInsights(householdId);
      const savingsInsights = await this.generateSavingsInsights(householdId);
      const debtInsights = await this.generateDebtInsights(householdId);
      const behaviorInsights = await this.generateBehaviorInsights(householdId);

      insights.push(
        ...spendingInsights,
        ...budgetInsights,
        ...savingsInsights,
        ...debtInsights,
        ...behaviorInsights,
      );

      // Store insights in database
      await this.storeInsights(householdId, insights);

      return insights;
    } catch (error) {
      this.logger.error(`Failed to generate insights for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Generate spending-related insights
   */
  private async generateSpendingInsights(householdId: string): Promise<BehaviorInsight[]> {
    const insights: BehaviorInsight[] = [];

    // Get spending data for analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSpending = await this.prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: thirtyDaysAgo },
        amountCents: { gt: 0 },
      },
      include: { category: true },
    });

    const totalSpent = recentSpending.reduce((sum, tx) => sum + Number(tx.amountCents), 0);
    const avgDailySpending = totalSpent / 30;

    // High spending alert
    if (avgDailySpending > 500000) { // More than 500k IDR per day
      insights.push({
        type: 'HIGH_SPENDING_ALERT',
        title: 'High Daily Spending Detected',
        description: `Your average daily spending is ${this.formatCurrency(avgDailySpending)}. Consider reviewing your expenses.`,
        data: {
          avgDailySpending,
          totalSpent,
          period: '30 days',
        },
        priority: 'HIGH',
        isActionable: true,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    }

    // Category concentration insight
    const categorySpending = recentSpending.reduce((acc, tx) => {
      const categoryName = tx.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + Number(tx.amountCents);
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)[0];

    if (topCategory && topCategory[1] > totalSpent * 0.4) { // More than 40% in one category
      insights.push({
        type: 'CATEGORY_CONCENTRATION',
        title: 'Spending Concentrated in One Category',
        description: `${((topCategory[1] / totalSpent) * 100).toFixed(1)}% of your spending is in ${topCategory[0]}. Consider diversifying your expenses.`,
        data: {
          category: topCategory[0],
          amount: topCategory[1],
          percentage: (topCategory[1] / totalSpent) * 100,
        },
        priority: 'MEDIUM',
        isActionable: true,
      });
    }

    // Weekend vs weekday spending
    const weekendSpending = recentSpending
      .filter(tx => {
        const day = new Date(tx.date).getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      })
      .reduce((sum, tx) => sum + Number(tx.amountCents), 0);

    const weekdaySpending = totalSpent - weekendSpending;
    const weekendRatio = weekendSpending / totalSpent;

    if (weekendRatio > 0.5) { // More than 50% on weekends
      insights.push({
        type: 'WEEKEND_SPENDING_PATTERN',
        title: 'High Weekend Spending',
        description: `You spend ${(weekendRatio * 100).toFixed(1)}% of your money on weekends. Consider planning weekday activities to balance spending.`,
        data: {
          weekendSpending,
          weekdaySpending,
          weekendPercentage: weekendRatio * 100,
        },
        priority: 'LOW',
        isActionable: true,
      });
    }

    return insights;
  }

  /**
   * Generate budget-related insights
   */
  private async generateBudgetInsights(householdId: string): Promise<BehaviorInsight[]> {
    const insights: BehaviorInsight[] = [];

    // Get active budgets
    const activeBudgets = await this.prisma.budget.findMany({
      where: {
        householdId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    for (const budget of activeBudgets) {
      for (const budgetCategory of budget.categories) {
        const spentPercentage = (Number(budgetCategory.spentAmountCents) / Number(budgetCategory.allocatedAmountCents)) * 100;

        // Budget exceeded
        if (spentPercentage > 100) {
          insights.push({
            type: 'BUDGET_EXCEEDED',
            title: 'Budget Exceeded',
            description: `You've exceeded your ${budgetCategory.category.name} budget by ${(spentPercentage - 100).toFixed(1)}%.`,
            data: {
              categoryName: budgetCategory.category.name,
              allocated: budgetCategory.allocatedAmountCents,
              spent: budgetCategory.spentAmountCents,
              overagePercentage: spentPercentage - 100,
            },
            priority: 'HIGH',
            isActionable: true,
          });
        }
        // Budget warning (80-100%)
        else if (spentPercentage > 80) {
          insights.push({
            type: 'BUDGET_WARNING',
            title: 'Budget Warning',
            description: `You've used ${spentPercentage.toFixed(1)}% of your ${budgetCategory.category.name} budget. Consider slowing down spending in this category.`,
            data: {
              categoryName: budgetCategory.category.name,
              allocated: budgetCategory.allocatedAmountCents,
              spent: budgetCategory.spentAmountCents,
              usedPercentage: spentPercentage,
            },
            priority: 'MEDIUM',
            isActionable: true,
          });
        }
      }
    }

    return insights;
  }

  /**
   * Generate savings-related insights
   */
  private async generateSavingsInsights(householdId: string): Promise<BehaviorInsight[]> {
    const insights: BehaviorInsight[] = [];

    // Calculate savings rate
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [income, expenses] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          householdId,
          date: { gte: thirtyDaysAgo },
          amountCents: { lt: 0 }, // Income (negative amounts)
        },
        _sum: { amountCents: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          householdId,
          date: { gte: thirtyDaysAgo },
          amountCents: { gt: 0 }, // Expenses (positive amounts)
        },
        _sum: { amountCents: true },
      }),
    ]);

    const totalIncome = Math.abs(Number(income._sum.amountCents || 0));
    const totalExpenses = Number(expenses._sum.amountCents || 0);
    const savingsAmount = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0;

    // Low savings rate
    if (savingsRate < 10 && totalIncome > 0) {
      insights.push({
        type: 'LOW_SAVINGS_RATE',
        title: 'Low Savings Rate',
        description: `Your savings rate is only ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of income.`,
        data: {
          savingsRate,
          savingsAmount,
          totalIncome,
          totalExpenses,
        },
        priority: 'HIGH',
        isActionable: true,
      });
    }
    // Good savings rate
    else if (savingsRate >= 20) {
      insights.push({
        type: 'GOOD_SAVINGS_RATE',
        title: 'Excellent Savings Rate!',
        description: `Great job! You're saving ${savingsRate.toFixed(1)}% of your income. Keep up the good work!`,
        data: {
          savingsRate,
          savingsAmount,
          totalIncome,
          totalExpenses,
        },
        priority: 'LOW',
        isActionable: false,
      });
    }

    return insights;
  }

  /**
   * Generate debt-related insights
   */
  private async generateDebtInsights(householdId: string): Promise<BehaviorInsight[]> {
    const insights: BehaviorInsight[] = [];

    const activeDebts = await this.prisma.debt.findMany({
      where: {
        householdId,
        isActive: true,
      },
    });

    if (activeDebts.length > 0) {
      const totalDebt = activeDebts.reduce((sum, debt) => sum + Number(debt.currentBalanceCents), 0);
      const highInterestDebts = activeDebts.filter(debt => 
        debt.interestRate && Number(debt.interestRate) > 0.15 // More than 15% interest
      );

      // High interest debt warning
      if (highInterestDebts.length > 0) {
        const highInterestAmount = highInterestDebts.reduce((sum, debt) => sum + Number(debt.currentBalanceCents), 0);
        
        insights.push({
          type: 'HIGH_INTEREST_DEBT',
          title: 'High Interest Debt Alert',
          description: `You have ${this.formatCurrency(highInterestAmount)} in high-interest debt. Consider prioritizing these payments.`,
          data: {
            highInterestAmount,
            debtCount: highInterestDebts.length,
            debts: highInterestDebts.map(debt => ({
              name: debt.name,
              balance: debt.currentBalanceCents,
              interestRate: debt.interestRate,
            })),
          },
          priority: 'HIGH',
          isActionable: true,
        });
      }

      // Debt-to-income ratio (if we have income data)
      const monthlyIncome = await this.getMonthlyIncome(householdId);
      if (monthlyIncome > 0) {
        const debtToIncomeRatio = (totalDebt / (monthlyIncome * 12)) * 100;
        
        if (debtToIncomeRatio > 40) { // More than 40% debt-to-income
          insights.push({
            type: 'HIGH_DEBT_TO_INCOME',
            title: 'High Debt-to-Income Ratio',
            description: `Your debt-to-income ratio is ${debtToIncomeRatio.toFixed(1)}%. Consider debt consolidation or payment acceleration.`,
            data: {
              debtToIncomeRatio,
              totalDebt,
              annualIncome: monthlyIncome * 12,
            },
            priority: 'HIGH',
            isActionable: true,
          });
        }
      }
    }

    return insights;
  }

  /**
   * Generate behavior-related insights
   */
  private async generateBehaviorInsights(householdId: string): Promise<BehaviorInsight[]> {
    const insights: BehaviorInsight[] = [];

    // Get user events for behavior analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await this.prisma.userEvent.findMany({
      where: {
        householdId,
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    // App usage patterns
    const dailyUsage = events.reduce((acc, event) => {
      const date = event.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgDailyEvents = Object.values(dailyUsage).reduce((sum, count) => sum + count, 0) / 30;

    // Low engagement
    if (avgDailyEvents < 5) {
      insights.push({
        type: 'LOW_ENGAGEMENT',
        title: 'Increase App Usage for Better Insights',
        description: 'Using the app more frequently will help us provide better financial insights and recommendations.',
        data: {
          avgDailyEvents,
          totalEvents: events.length,
        },
        priority: 'LOW',
        isActionable: true,
      });
    }

    // Feature usage insights
    const featureEvents = events.filter(e => e.eventType === 'FEATURE_USED');
    const unusedFeatures = this.getUnusedFeatures(featureEvents);

    if (unusedFeatures.length > 0) {
      insights.push({
        type: 'UNUSED_FEATURES',
        title: 'Discover New Features',
        description: `You haven't used ${unusedFeatures.length} features that could help manage your finances better.`,
        data: {
          unusedFeatures,
          totalFeatures: this.getAllFeatures().length,
        },
        priority: 'LOW',
        isActionable: true,
      });
    }

    return insights;
  }

  /**
   * Store insights in database
   */
  private async storeInsights(householdId: string, insights: BehaviorInsight[]) {
    // Delete old insights that are no longer valid
    await this.prisma.financialInsight.deleteMany({
      where: {
        householdId,
        OR: [
          { validUntil: { lt: new Date() } },
          { validUntil: null, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // 7 days old
        ],
      },
    });

    // Insert new insights
    if (insights.length > 0) {
      await this.prisma.financialInsight.createMany({
        data: insights.map(insight => ({
          householdId,
          insightType: insight.type,
          title: insight.title,
          description: insight.description,
          data: insight.data,
          priority: insight.priority as any,
          isActionable: insight.isActionable,
          validUntil: insight.validUntil,
        })),
      });
    }
  }

  /**
   * Get monthly income estimate
   */
  private async getMonthlyIncome(householdId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const income = await this.prisma.transaction.aggregate({
      where: {
        householdId,
        date: { gte: thirtyDaysAgo },
        amountCents: { lt: 0 }, // Income (negative amounts)
      },
      _sum: { amountCents: true },
    });

    return Math.abs(Number(income._sum.amountCents || 0));
  }

  /**
   * Get unused features
   */
  private getUnusedFeatures(featureEvents: any[]): string[] {
    const usedFeatures = new Set(
      featureEvents.map(event => event.eventData?.feature).filter(Boolean)
    );

    const allFeatures = this.getAllFeatures();
    return allFeatures.filter(feature => !usedFeatures.has(feature));
  }

  /**
   * Get all available features
   */
  private getAllFeatures(): string[] {
    return [
      'BUDGET_CREATION',
      'DEBT_TRACKING',
      'WISHLIST_MANAGEMENT',
      'EXPENSE_CATEGORIZATION',
      'FINANCIAL_REPORTS',
      'GOAL_SETTING',
      'RECURRING_TRANSACTIONS',
      'MULTI_CURRENCY',
      'HOUSEHOLD_SHARING',
      'EXPORT_DATA',
    ];
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amountCents: number): string {
    const amount = amountCents / 100;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}
