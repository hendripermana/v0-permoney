import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MonthlyReport,
  FinancialHighlight,
  SpendingStory,
  CategorySpending,
  UnusualSpending,
  SavingsOpportunity,
  Achievement,
  VisualData,
  ChartData,
  BudgetProgressData,
} from '../types/ai-insights.types';

@Injectable()
export class NarrativeGenerationService {
  private readonly logger = new Logger(NarrativeGenerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate comprehensive monthly report with storytelling
   */
  async generateMonthlyReport(
    householdId: string,
    year: number,
    month: number,
  ): Promise<MonthlyReport> {
    this.logger.log(`Generating monthly report for household ${householdId}, ${year}-${month}`);

    try {
      // Get date ranges
      const currentMonth = new Date(year, month - 1, 1);
      const nextMonth = new Date(year, month, 1);
      const previousMonth = new Date(year, month - 2, 1);
      const currentMonthEnd = new Date(nextMonth.getTime() - 1);

      // Gather all financial data
      const [
        currentTransactions,
        previousTransactions,
        budgets,
        debts,
        accounts,
      ] = await Promise.all([
        this.getTransactionsForPeriod(householdId, currentMonth, nextMonth),
        this.getTransactionsForPeriod(householdId, previousMonth, currentMonth),
        this.getBudgetsForPeriod(householdId, currentMonth, nextMonth),
        this.getActiveDebts(householdId),
        this.getAccounts(householdId),
      ]);

      // Generate report components
      const financialHighlights = this.generateFinancialHighlights(
        currentTransactions,
        previousTransactions,
        accounts,
        debts,
      );

      const spendingStory = this.generateSpendingStory(
        currentTransactions,
        previousTransactions,
      );

      const achievements = this.generateAchievements(
        currentTransactions,
        budgets,
        debts,
        financialHighlights,
      );

      const visualData = this.generateVisualData(
        currentTransactions,
        budgets,
        accounts,
      );

      // Generate narrative
      const narrative = this.generateNarrative(
        financialHighlights,
        spendingStory,
        achievements,
        month,
        year,
      );

      const keyInsights = this.generateKeyInsights(
        financialHighlights,
        spendingStory,
        achievements,
      );

      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      const title = `${monthName} ${year} Financial Report`;
      const summary = this.generateSummary(financialHighlights, spendingStory);

      return {
        householdId,
        year,
        month,
        title,
        summary,
        narrative,
        keyInsights,
        financialHighlights,
        spendingStory,
        achievements,
        recommendations: [], // Will be populated by recommendation service
        visualData,
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to generate monthly report for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Generate financial highlights
   */
  private generateFinancialHighlights(
    currentTransactions: any[],
    previousTransactions: any[],
    accounts: any[],
    debts: any[],
  ): FinancialHighlight[] {
    const highlights: FinancialHighlight[] = [];

    // Calculate current month metrics
    const currentIncome = this.calculateIncome(currentTransactions);
    const currentExpenses = this.calculateExpenses(currentTransactions);
    const currentSavings = currentIncome - currentExpenses;

    // Calculate previous month metrics
    const previousIncome = this.calculateIncome(previousTransactions);
    const previousExpenses = this.calculateExpenses(previousTransactions);
    const previousSavings = previousIncome - previousExpenses;

    // Income highlight
    const incomeChange = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
    highlights.push({
      type: 'INCOME',
      title: 'Total Income',
      value: currentIncome,
      change: incomeChange,
      trend: incomeChange > 5 ? 'UP' : incomeChange < -5 ? 'DOWN' : 'STABLE',
      isPositive: incomeChange >= 0,
    });

    // Expenses highlight
    const expensesChange = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;
    highlights.push({
      type: 'EXPENSES',
      title: 'Total Expenses',
      value: currentExpenses,
      change: expensesChange,
      trend: expensesChange > 5 ? 'UP' : expensesChange < -5 ? 'DOWN' : 'STABLE',
      isPositive: expensesChange <= 0,
    });

    // Savings highlight
    const savingsChange = previousSavings !== 0 ? ((currentSavings - previousSavings) / Math.abs(previousSavings)) * 100 : 0;
    highlights.push({
      type: 'SAVINGS',
      title: 'Net Savings',
      value: currentSavings,
      change: savingsChange,
      trend: savingsChange > 5 ? 'UP' : savingsChange < -5 ? 'DOWN' : 'STABLE',
      isPositive: currentSavings > 0,
    });

    // Net worth highlight
    const totalAssets = accounts
      .filter(a => a.type === 'ASSET')
      .reduce((sum, a) => sum + Number(a.balanceCents), 0);
    const totalLiabilities = accounts
      .filter(a => a.type === 'LIABILITY')
      .reduce((sum, a) => sum + Number(a.balanceCents), 0);
    const netWorth = totalAssets - totalLiabilities;

    highlights.push({
      type: 'NET_WORTH',
      title: 'Net Worth',
      value: netWorth,
      change: 0, // Would need historical data
      trend: 'STABLE',
      isPositive: netWorth > 0,
    });

    // Debt highlight
    const totalDebt = debts.reduce((sum, d) => sum + Number(d.currentBalanceCents), 0);
    highlights.push({
      type: 'DEBT',
      title: 'Total Debt',
      value: totalDebt,
      change: 0, // Would need historical data
      trend: 'STABLE',
      isPositive: false,
    });

    return highlights;
  }

  /**
   * Generate spending story
   */
  private generateSpendingStory(
    currentTransactions: any[],
    previousTransactions: any[],
  ): SpendingStory {
    const totalSpent = this.calculateExpenses(currentTransactions);
    
    // Calculate category spending
    const categorySpending = this.calculateCategorySpending(currentTransactions);
    const previousCategorySpending = this.calculateCategorySpending(previousTransactions);

    const topCategories: CategorySpending[] = Array.from(categorySpending.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([categoryId, amount]) => {
        const transaction = currentTransactions.find(t => t.categoryId === categoryId);
        const categoryName = transaction?.category?.name || 'Uncategorized';
        const previousAmount = previousCategorySpending.get(categoryId) || 0;
        const change = previousAmount > 0 ? ((amount - previousAmount) / previousAmount) * 100 : 0;

        return {
          categoryId,
          categoryName,
          amount,
          percentage: (amount / totalSpent) * 100,
          change,
          trend: change > 5 ? 'UP' : change < -5 ? 'DOWN' : 'STABLE',
        };
      });

    // Find unusual spending
    const unusualSpending = this.findUnusualSpending(currentTransactions);

    // Find savings opportunities
    const savingsOpportunities = this.findSavingsOpportunities(topCategories);

    // Generate narrative
    const narrative = this.generateSpendingNarrative(totalSpent, topCategories, unusualSpending);

    return {
      totalSpent,
      topCategories,
      unusualSpending,
      savingsOpportunities,
      narrative,
    };
  }

  /**
   * Generate achievements
   */
  private generateAchievements(
    currentTransactions: any[],
    budgets: any[],
    debts: any[],
    highlights: FinancialHighlight[],
  ): Achievement[] {
    const achievements: Achievement[] = [];

    // Budget adherence achievements
    for (const budget of budgets) {
      const adherenceRate = this.calculateBudgetAdherence(budget);
      if (adherenceRate >= 90) {
        achievements.push({
          type: 'BUDGET_ADHERENCE',
          title: 'Budget Master',
          description: `Stayed within ${adherenceRate.toFixed(0)}% of your budget this month!`,
          emoji: '🎯',
        });
      }
    }

    // Savings achievements
    const savingsHighlight = highlights.find(h => h.type === 'SAVINGS');
    if (savingsHighlight && savingsHighlight.value > 0) {
      const savingsRate = this.calculateSavingsRate(highlights);
      if (savingsRate >= 20) {
        achievements.push({
          type: 'SAVINGS_GOAL',
          title: 'Savings Champion',
          description: `Achieved ${savingsRate.toFixed(0)}% savings rate this month!`,
          value: savingsHighlight.value,
          emoji: '💰',
        });
      }
    }

    // Spending control achievements
    const expensesHighlight = highlights.find(h => h.type === 'EXPENSES');
    if (expensesHighlight && expensesHighlight.change < -5) {
      achievements.push({
        type: 'SPENDING_CONTROL',
        title: 'Spending Saver',
        description: `Reduced expenses by ${Math.abs(expensesHighlight.change).toFixed(0)}% this month!`,
        emoji: '📉',
      });
    }

    // Debt reduction achievements
    // This would require historical debt data to calculate properly

    // Financial milestone achievements
    const netWorthHighlight = highlights.find(h => h.type === 'NET_WORTH');
    if (netWorthHighlight && netWorthHighlight.value > 0) {
      const milestones = [1000000, 5000000, 10000000, 50000000, 100000000]; // IDR milestones
      const achievedMilestone = milestones.find(m => netWorthHighlight.value >= m);
      
      if (achievedMilestone) {
        achievements.push({
          type: 'FINANCIAL_MILESTONE',
          title: 'Net Worth Milestone',
          description: `Reached ${this.formatCurrency(achievedMilestone)} net worth!`,
          value: netWorthHighlight.value,
          emoji: '🏆',
        });
      }
    }

    return achievements;
  }

  /**
   * Generate visual data for charts
   */
  private generateVisualData(
    transactions: any[],
    budgets: any[],
    accounts: any[],
  ): VisualData {
    // Spending by category
    const categorySpending = this.calculateCategorySpending(transactions);
    const spendingByCategory: ChartData[] = Array.from(categorySpending.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([categoryId, amount]) => {
        const transaction = transactions.find(t => t.categoryId === categoryId);
        return {
          label: transaction?.category?.name || 'Uncategorized',
          value: amount,
          color: this.getCategoryColor(categoryId),
        };
      });

    // Income vs expenses over time
    const dailyData = this.aggregateTransactionsByDay(transactions);
    const incomeVsExpenses: ChartData[] = dailyData.map(day => ({
      label: day.date,
      value: day.income - day.expenses,
      date: new Date(day.date),
    }));

    // Net worth trend (simplified - would need historical data)
    const netWorth = accounts
      .filter(a => a.type === 'ASSET')
      .reduce((sum, a) => sum + Number(a.balanceCents), 0) -
      accounts
        .filter(a => a.type === 'LIABILITY')
        .reduce((sum, a) => sum + Number(a.balanceCents), 0);

    const netWorthTrend: ChartData[] = [
      { label: 'Current', value: netWorth, date: new Date() },
    ];

    // Budget progress
    const budgetProgress: BudgetProgressData[] = budgets.flatMap(budget =>
      budget.categories.map((bc: any) => ({
        categoryName: bc.category.name,
        allocated: Number(bc.allocatedAmountCents),
        spent: Number(bc.spentAmountCents),
        remaining: Number(bc.allocatedAmountCents) - Number(bc.spentAmountCents),
        percentage: (Number(bc.spentAmountCents) / Number(bc.allocatedAmountCents)) * 100,
      }))
    );

    return {
      spendingByCategory,
      incomeVsExpenses,
      netWorthTrend,
      budgetProgress,
    };
  }

  /**
   * Generate main narrative
   */
  private generateNarrative(
    highlights: FinancialHighlight[],
    spendingStory: SpendingStory,
    achievements: Achievement[],
    month: number,
    year: number,
  ): string {
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    
    let narrative = `## Your ${monthName} Financial Journey\n\n`;

    // Opening based on overall performance
    const savingsHighlight = highlights.find(h => h.type === 'SAVINGS');
    const expensesHighlight = highlights.find(h => h.type === 'EXPENSES');

    if (savingsHighlight && savingsHighlight.value > 0) {
      narrative += `🌟 Great news! You managed to save ${this.formatCurrency(savingsHighlight.value)} this month. `;
    } else if (savingsHighlight && savingsHighlight.value < 0) {
      narrative += `📊 This month you spent ${this.formatCurrency(Math.abs(savingsHighlight.value))} more than you earned. `;
    }

    // Spending story
    narrative += `\n\n### Your Spending Story\n\n`;
    narrative += spendingStory.narrative;

    // Achievements
    if (achievements.length > 0) {
      narrative += `\n\n### Achievements This Month\n\n`;
      achievements.forEach(achievement => {
        narrative += `${achievement.emoji} **${achievement.title}**: ${achievement.description}\n\n`;
      });
    }

    // Trends and insights
    narrative += `\n\n### Key Trends\n\n`;
    
    if (expensesHighlight) {
      if (expensesHighlight.trend === 'UP') {
        narrative += `📈 Your expenses increased by ${expensesHighlight.change.toFixed(1)}% compared to last month. `;
      } else if (expensesHighlight.trend === 'DOWN') {
        narrative += `📉 You successfully reduced your expenses by ${Math.abs(expensesHighlight.change).toFixed(1)}% this month. `;
      }
    }

    // Top spending categories
    const topCategory = spendingStory.topCategories[0];
    if (topCategory) {
      narrative += `Your biggest expense category was ${topCategory.categoryName}, accounting for ${topCategory.percentage.toFixed(1)}% of your spending. `;
    }

    // Closing with forward-looking statement
    narrative += `\n\n### Looking Ahead\n\n`;
    narrative += `Based on your spending patterns, here are some insights to help you optimize your finances for next month.`;

    return narrative;
  }

  /**
   * Generate key insights
   */
  private generateKeyInsights(
    highlights: FinancialHighlight[],
    spendingStory: SpendingStory,
    achievements: Achievement[],
  ): string[] {
    const insights: string[] = [];

    // Savings rate insight
    const savingsRate = this.calculateSavingsRate(highlights);
    if (savingsRate > 0) {
      insights.push(`You saved ${savingsRate.toFixed(1)}% of your income this month`);
    }

    // Top spending category
    const topCategory = spendingStory.topCategories[0];
    if (topCategory) {
      insights.push(`${topCategory.categoryName} was your largest expense at ${this.formatCurrency(topCategory.amount)}`);
    }

    // Expense trend
    const expensesHighlight = highlights.find(h => h.type === 'EXPENSES');
    if (expensesHighlight && Math.abs(expensesHighlight.change) > 5) {
      const direction = expensesHighlight.change > 0 ? 'increased' : 'decreased';
      insights.push(`Your expenses ${direction} by ${Math.abs(expensesHighlight.change).toFixed(1)}% from last month`);
    }

    // Achievements
    if (achievements.length > 0) {
      insights.push(`You achieved ${achievements.length} financial milestone${achievements.length > 1 ? 's' : ''} this month`);
    }

    // Savings opportunities
    if (spendingStory.savingsOpportunities.length > 0) {
      const totalSavings = spendingStory.savingsOpportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);
      insights.push(`Potential savings of ${this.formatCurrency(totalSavings)} identified`);
    }

    return insights;
  }

  /**
   * Generate summary
   */
  private generateSummary(highlights: FinancialHighlight[], spendingStory: SpendingStory): string {
    const incomeHighlight = highlights.find(h => h.type === 'INCOME');
    const expensesHighlight = highlights.find(h => h.type === 'EXPENSES');
    const savingsHighlight = highlights.find(h => h.type === 'SAVINGS');

    let summary = '';

    if (incomeHighlight && expensesHighlight) {
      summary += `You earned ${this.formatCurrency(incomeHighlight.value)} and spent ${this.formatCurrency(expensesHighlight.value)} this month. `;
    }

    if (savingsHighlight) {
      if (savingsHighlight.value > 0) {
        summary += `You saved ${this.formatCurrency(savingsHighlight.value)}, `;
      } else {
        summary += `You overspent by ${this.formatCurrency(Math.abs(savingsHighlight.value))}, `;
      }
    }

    const topCategory = spendingStory.topCategories[0];
    if (topCategory) {
      summary += `with ${topCategory.categoryName} being your largest expense category.`;
    }

    return summary;
  }

  // Helper methods

  private async getTransactionsForPeriod(householdId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: startDate, lt: endDate },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  private async getBudgetsForPeriod(householdId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.prisma.budget.findMany({
      where: {
        householdId,
        isActive: true,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });
  }

  private async getActiveDebts(householdId: string): Promise<any[]> {
    return this.prisma.debt.findMany({
      where: {
        householdId,
        isActive: true,
      },
    });
  }

  private async getAccounts(householdId: string): Promise<any[]> {
    return this.prisma.account.findMany({
      where: {
        householdId,
        isActive: true,
      },
    });
  }

  private calculateIncome(transactions: any[]): number {
    return transactions
      .filter(t => Number(t.amountCents) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amountCents)), 0);
  }

  private calculateExpenses(transactions: any[]): number {
    return transactions
      .filter(t => Number(t.amountCents) > 0)
      .reduce((sum, t) => sum + Number(t.amountCents), 0);
  }

  private calculateCategorySpending(transactions: any[]): Map<string, number> {
    const spending = new Map<string, number>();

    for (const transaction of transactions) {
      if (Number(transaction.amountCents) <= 0) continue; // Skip income

      const categoryId = transaction.categoryId || 'uncategorized';
      const amount = Number(transaction.amountCents);

      spending.set(categoryId, (spending.get(categoryId) || 0) + amount);
    }

    return spending;
  }

  private findUnusualSpending(transactions: any[]): UnusualSpending[] {
    // Simple implementation - find transactions above 2 standard deviations
    const amounts = transactions
      .filter(t => Number(t.amountCents) > 0)
      .map(t => Number(t.amountCents));

    if (amounts.length < 3) return [];

    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 2 * stdDev;

    return transactions
      .filter(t => Number(t.amountCents) > threshold)
      .map(t => ({
        description: `Large ${t.category?.name || 'Uncategorized'} expense`,
        amount: Number(t.amountCents),
        date: new Date(t.date),
        category: t.category?.name || 'Uncategorized',
        reason: 'Amount significantly higher than usual',
      }));
  }

  private findSavingsOpportunities(topCategories: CategorySpending[]): SavingsOpportunity[] {
    const opportunities: SavingsOpportunity[] = [];

    for (const category of topCategories.slice(0, 3)) {
      if (category.change > 20) { // 20% increase
        opportunities.push({
          description: `Reduce ${category.categoryName} spending`,
          potentialSavings: category.amount * 0.1, // 10% reduction
          effort: 'MEDIUM',
          category: category.categoryName,
        });
      }
    }

    return opportunities;
  }

  private generateSpendingNarrative(
    totalSpent: number,
    topCategories: CategorySpending[],
    unusualSpending: UnusualSpending[],
  ): string {
    let narrative = `You spent a total of ${this.formatCurrency(totalSpent)} this month. `;

    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      narrative += `Your biggest expense was ${topCategory.categoryName} at ${this.formatCurrency(topCategory.amount)}, `;
      narrative += `which represents ${topCategory.percentage.toFixed(1)}% of your total spending. `;

      if (topCategory.change > 10) {
        narrative += `This category increased by ${topCategory.change.toFixed(1)}% from last month. `;
      } else if (topCategory.change < -10) {
        narrative += `You successfully reduced spending in this category by ${Math.abs(topCategory.change).toFixed(1)}%. `;
      }
    }

    if (unusualSpending.length > 0) {
      narrative += `We noticed ${unusualSpending.length} unusually large transaction${unusualSpending.length > 1 ? 's' : ''} this month. `;
    }

    return narrative;
  }

  private calculateBudgetAdherence(budget: any): number {
    const totalAllocated = Number(budget.totalAllocatedCents);
    const totalSpent = budget.categories.reduce((sum: number, bc: any) => sum + Number(bc.spentAmountCents), 0);
    
    if (totalAllocated === 0) return 0;
    return Math.min(100, (1 - Math.max(0, totalSpent - totalAllocated) / totalAllocated) * 100);
  }

  private calculateSavingsRate(highlights: FinancialHighlight[]): number {
    const income = highlights.find(h => h.type === 'INCOME')?.value || 0;
    const savings = highlights.find(h => h.type === 'SAVINGS')?.value || 0;
    
    if (income === 0) return 0;
    return (savings / income) * 100;
  }

  private aggregateTransactionsByDay(transactions: any[]): { date: string; income: number; expenses: number }[] {
    const dailyData = new Map<string, { income: number; expenses: number }>();

    for (const transaction of transactions) {
      const date = transaction.date.toISOString().split('T')[0];
      const amount = Number(transaction.amountCents);

      if (!dailyData.has(date)) {
        dailyData.set(date, { income: 0, expenses: 0 });
      }

      const dayData = dailyData.get(date)!;
      if (amount < 0) {
        dayData.income += Math.abs(amount);
      } else {
        dayData.expenses += amount;
      }
    }

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getCategoryColor(categoryId: string): string {
    // Simple color assignment based on category ID hash
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const hash = categoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  private formatCurrency(amountCents: number): string {
    const amount = amountCents / 100;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}
