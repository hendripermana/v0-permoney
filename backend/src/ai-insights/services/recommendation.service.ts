import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PersonalizedRecommendation } from '../types/ai-insights.types';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate personalized recommendations for a household
   */
  async generateRecommendations(householdId: string): Promise<PersonalizedRecommendation[]> {
    this.logger.log(`Generating recommendations for household ${householdId}`);

    try {
      const recommendations: PersonalizedRecommendation[] = [];

      // Get financial data for analysis
      const [
        recentTransactions,
        budgets,
        debts,
        accounts,
        spendingPatterns,
      ] = await Promise.all([
        this.getRecentTransactions(householdId),
        this.getActiveBudgets(householdId),
        this.getActiveDebts(householdId),
        this.getAccounts(householdId),
        this.getSpendingPatterns(householdId),
      ]);

      // Generate different types of recommendations
      const budgetRecommendations = await this.generateBudgetRecommendations(
        recentTransactions,
        budgets,
        spendingPatterns,
      );

      const savingsRecommendations = await this.generateSavingsRecommendations(
        recentTransactions,
        accounts,
      );

      const debtRecommendations = await this.generateDebtRecommendations(
        debts,
        recentTransactions,
      );

      const investmentRecommendations = await this.generateInvestmentRecommendations(
        accounts,
        recentTransactions,
      );

      const spendingRecommendations = await this.generateSpendingRecommendations(
        recentTransactions,
        spendingPatterns,
      );

      recommendations.push(
        ...budgetRecommendations,
        ...savingsRecommendations,
        ...debtRecommendations,
        ...investmentRecommendations,
        ...spendingRecommendations,
      );

      // Sort by priority and potential impact
      recommendations.sort((a, b) => {
        const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return (b.potentialSavings || 0) - (a.potentialSavings || 0);
      });

      this.logger.log(`Generated ${recommendations.length} recommendations for household ${householdId}`);
      return recommendations.slice(0, 10); // Return top 10 recommendations
    } catch (error) {
      this.logger.error(`Failed to generate recommendations for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Generate budget optimization recommendations
   */
  private async generateBudgetRecommendations(
    transactions: any[],
    budgets: any[],
    spendingPatterns: any[],
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    for (const budget of budgets) {
      for (const budgetCategory of budget.categories) {
        const spentPercentage = (Number(budgetCategory.spentAmountCents) / Number(budgetCategory.allocatedAmountCents)) * 100;

        // Over-budget recommendations
        if (spentPercentage > 100) {
          const overage = Number(budgetCategory.spentAmountCents) - Number(budgetCategory.allocatedAmountCents);
          
          recommendations.push({
            type: 'BUDGET_OPTIMIZATION',
            title: `Reduce ${budgetCategory.category.name} Spending`,
            description: `You've exceeded your ${budgetCategory.category.name} budget by ${this.formatCurrency(overage)}. Consider reducing spending in this category or reallocating budget from other categories.`,
            priority: 'HIGH',
            potentialSavings: overage * 0.5, // Assume 50% reduction possible
            effort: 'MEDIUM',
            timeframe: 'IMMEDIATE',
            actionSteps: [
              `Review recent ${budgetCategory.category.name} transactions`,
              'Identify non-essential expenses to cut',
              'Set spending alerts for this category',
              'Consider alternative cheaper options',
            ],
            data: {
              categoryName: budgetCategory.category.name,
              allocated: budgetCategory.allocatedAmountCents,
              spent: budgetCategory.spentAmountCents,
              overage,
            },
          });
        }

        // Under-budget reallocation recommendations
        else if (spentPercentage < 50) {
          const unused = Number(budgetCategory.allocatedAmountCents) - Number(budgetCategory.spentAmountCents);
          
          recommendations.push({
            type: 'BUDGET_OPTIMIZATION',
            title: `Reallocate Unused ${budgetCategory.category.name} Budget`,
            description: `You have ${this.formatCurrency(unused)} unused in your ${budgetCategory.category.name} budget. Consider reallocating to categories where you're overspending.`,
            priority: 'LOW',
            effort: 'LOW',
            timeframe: 'SHORT_TERM',
            actionSteps: [
              'Review other budget categories for overspending',
              'Reallocate unused budget to high-priority categories',
              'Consider increasing savings allocation',
            ],
            data: {
              categoryName: budgetCategory.category.name,
              allocated: budgetCategory.allocatedAmountCents,
              spent: budgetCategory.spentAmountCents,
              unused,
            },
          });
        }
      }
    }

    // No budget recommendation
    if (budgets.length === 0) {
      const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
      
      recommendations.push({
        type: 'BUDGET_OPTIMIZATION',
        title: 'Create Your First Budget',
        description: `You're spending ${this.formatCurrency(monthlyExpenses)} monthly without a budget. Creating a budget could help you save 10-20% of your expenses.`,
        priority: 'HIGH',
        potentialSavings: monthlyExpenses * 0.15, // 15% potential savings
        effort: 'MEDIUM',
        timeframe: 'SHORT_TERM',
        actionSteps: [
          'Analyze your spending patterns from the last 3 months',
          'Set realistic spending limits for each category',
          'Start with the 50/30/20 rule (needs/wants/savings)',
          'Track your progress weekly',
        ],
        data: {
          monthlyExpenses,
          suggestedSavings: monthlyExpenses * 0.15,
        },
      });
    }

    return recommendations;
  }

  /**
   * Generate savings recommendations
   */
  private async generateSavingsRecommendations(
    transactions: any[],
    accounts: any[],
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // Calculate current savings rate
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    // Low savings rate recommendations
    if (savingsRate < 10) {
      recommendations.push({
        type: 'SAVINGS_OPPORTUNITY',
        title: 'Increase Your Savings Rate',
        description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your income.`,
        priority: 'HIGH',
        potentialSavings: monthlyIncome * 0.1, // 10% of income
        effort: 'MEDIUM',
        timeframe: 'MEDIUM_TERM',
        actionSteps: [
          'Set up automatic transfers to savings account',
          'Reduce discretionary spending by 5-10%',
          'Look for ways to increase income',
          'Use the "pay yourself first" principle',
        ],
        data: {
          currentSavingsRate: savingsRate,
          targetSavingsRate: 20,
          monthlyIncome,
          monthlySavings,
        },
      });
    }

    // Emergency fund recommendations
    const liquidAssets = accounts
      .filter(a => a.type === 'ASSET' && ['BANK', 'CASH'].includes(a.subtype))
      .reduce((sum, a) => sum + Number(a.balanceCents), 0);

    const emergencyFundTarget = monthlyExpenses * 6; // 6 months of expenses

    if (liquidAssets < emergencyFundTarget) {
      const shortfall = emergencyFundTarget - liquidAssets;
      
      recommendations.push({
        type: 'SAVINGS_OPPORTUNITY',
        title: 'Build Your Emergency Fund',
        description: `You need ${this.formatCurrency(shortfall)} more to reach your 6-month emergency fund target of ${this.formatCurrency(emergencyFundTarget)}.`,
        priority: 'HIGH',
        effort: 'HIGH',
        timeframe: 'LONG_TERM',
        actionSteps: [
          'Open a high-yield savings account for emergency fund',
          'Set up automatic monthly transfers',
          'Start with a goal of 1 month of expenses, then gradually increase',
          'Keep emergency fund separate from other savings',
        ],
        data: {
          currentEmergencyFund: liquidAssets,
          targetEmergencyFund: emergencyFundTarget,
          shortfall,
          monthlyExpenses,
        },
      });
    }

    // High-yield savings recommendations
    const savingsAccounts = accounts.filter(a => a.subtype === 'SAVINGS');
    if (savingsAccounts.length === 0 && liquidAssets > 5000000) { // > 50,000 IDR
      recommendations.push({
        type: 'SAVINGS_OPPORTUNITY',
        title: 'Open a High-Yield Savings Account',
        description: `You have ${this.formatCurrency(liquidAssets)} in low-yield accounts. A high-yield savings account could earn you more interest.`,
        priority: 'MEDIUM',
        potentialSavings: liquidAssets * 0.02, // 2% annual interest difference
        effort: 'LOW',
        timeframe: 'IMMEDIATE',
        actionSteps: [
          'Research high-yield savings accounts from reputable banks',
          'Compare interest rates and fees',
          'Open account and transfer funds',
          'Set up automatic transfers for future savings',
        ],
        data: {
          currentBalance: liquidAssets,
          potentialAnnualEarnings: liquidAssets * 0.02,
        },
      });
    }

    return recommendations;
  }

  /**
   * Generate debt reduction recommendations
   */
  private async generateDebtRecommendations(
    debts: any[],
    transactions: any[],
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    if (debts.length === 0) return recommendations;

    // High-interest debt recommendations
    const highInterestDebts = debts.filter(debt => 
      debt.interestRate && Number(debt.interestRate) > 0.15 // > 15% interest
    );

    if (highInterestDebts.length > 0) {
      const totalHighInterestDebt = highInterestDebts.reduce((sum, debt) => sum + Number(debt.currentBalanceCents), 0);
      const averageInterestRate = highInterestDebts.reduce((sum, debt) => sum + Number(debt.interestRate), 0) / highInterestDebts.length;
      
      recommendations.push({
        type: 'DEBT_REDUCTION',
        title: 'Prioritize High-Interest Debt',
        description: `You have ${this.formatCurrency(totalHighInterestDebt)} in high-interest debt (avg ${(averageInterestRate * 100).toFixed(1)}%). Focus on paying these off first.`,
        priority: 'URGENT',
        potentialSavings: totalHighInterestDebt * averageInterestRate * 0.5, // 6 months of interest savings
        effort: 'HIGH',
        timeframe: 'MEDIUM_TERM',
        actionSteps: [
          'List all debts by interest rate (highest first)',
          'Pay minimum on all debts, extra on highest interest',
          'Consider debt consolidation if available at lower rate',
          'Avoid taking on new high-interest debt',
        ],
        data: {
          highInterestDebts: highInterestDebts.map(debt => ({
            name: debt.name,
            balance: debt.currentBalanceCents,
            interestRate: debt.interestRate,
          })),
          totalDebt: totalHighInterestDebt,
          averageRate: averageInterestRate,
        },
      });
    }

    // Debt consolidation recommendations
    if (debts.length > 3) {
      const totalDebt = debts.reduce((sum, debt) => sum + Number(debt.currentBalanceCents), 0);
      const weightedAverageRate = debts.reduce((sum, debt) => {
        const balance = Number(debt.currentBalanceCents);
        const rate = Number(debt.interestRate) || 0;
        return sum + (balance * rate);
      }, 0) / totalDebt;

      recommendations.push({
        type: 'DEBT_REDUCTION',
        title: 'Consider Debt Consolidation',
        description: `You have ${debts.length} different debts. Consolidating could simplify payments and potentially reduce interest rates.`,
        priority: 'MEDIUM',
        effort: 'MEDIUM',
        timeframe: 'SHORT_TERM',
        actionSteps: [
          'Research debt consolidation loans with lower rates',
          'Calculate total interest savings from consolidation',
          'Compare fees and terms carefully',
          'Avoid accumulating new debt after consolidation',
        ],
        data: {
          debtCount: debts.length,
          totalDebt,
          currentWeightedRate: weightedAverageRate,
        },
      });
    }

    // Minimum payment recommendations
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const totalMinimumPayments = debts.reduce((sum, debt) => {
      // Estimate minimum payment as 2% of balance for credit cards, actual payment for loans
      const balance = Number(debt.currentBalanceCents);
      return sum + (debt.type === 'CONVENTIONAL' ? balance * 0.02 : balance * 0.05);
    }, 0);

    const debtToIncomeRatio = monthlyIncome > 0 ? (totalMinimumPayments / monthlyIncome) * 100 : 0;

    if (debtToIncomeRatio > 40) {
      recommendations.push({
        type: 'DEBT_REDUCTION',
        title: 'Reduce Debt-to-Income Ratio',
        description: `Your debt payments are ${debtToIncomeRatio.toFixed(1)}% of your income. Aim for less than 36% for better financial health.`,
        priority: 'HIGH',
        effort: 'HIGH',
        timeframe: 'LONG_TERM',
        actionSteps: [
          'Create a debt payoff plan using avalanche or snowball method',
          'Look for ways to increase income',
          'Reduce non-essential expenses to free up money for debt payments',
          'Consider speaking with a financial counselor',
        ],
        data: {
          debtToIncomeRatio,
          monthlyIncome,
          totalMinimumPayments,
          targetRatio: 36,
        },
      });
    }

    return recommendations;
  }

  /**
   * Generate investment recommendations
   */
  private async generateInvestmentRecommendations(
    accounts: any[],
    transactions: any[],
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    const investmentAccounts = accounts.filter(a => a.subtype === 'INVESTMENT');
    const totalAssets = accounts
      .filter(a => a.type === 'ASSET')
      .reduce((sum, a) => sum + Number(a.balanceCents), 0);

    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const monthlySavings = monthlyIncome - monthlyExpenses;

    // No investment accounts recommendation
    if (investmentAccounts.length === 0 && monthlySavings > 1000000) { // > 10,000 IDR monthly savings
      recommendations.push({
        type: 'INVESTMENT_SUGGESTION',
        title: 'Start Investing for Long-term Growth',
        description: `You're saving ${this.formatCurrency(monthlySavings)} monthly but not investing. Starting to invest could help grow your wealth over time.`,
        priority: 'MEDIUM',
        potentialSavings: monthlySavings * 12 * 0.07, // 7% annual return
        effort: 'MEDIUM',
        timeframe: 'LONG_TERM',
        actionSteps: [
          'Learn about different investment options (mutual funds, ETFs, stocks)',
          'Start with low-cost index funds for diversification',
          'Consider using robo-advisors for automated investing',
          'Invest consistently with dollar-cost averaging',
        ],
        data: {
          monthlySavings,
          potentialAnnualReturn: monthlySavings * 12 * 0.07,
          timeHorizon: 'long-term',
        },
      });
    }

    // Asset allocation recommendations
    const investmentBalance = investmentAccounts.reduce((sum, a) => sum + Number(a.balanceCents), 0);
    const investmentPercentage = totalAssets > 0 ? (investmentBalance / totalAssets) * 100 : 0;

    if (investmentPercentage < 10 && totalAssets > 50000000) { // < 10% in investments, > 500,000 IDR total
      recommendations.push({
        type: 'INVESTMENT_SUGGESTION',
        title: 'Increase Investment Allocation',
        description: `Only ${investmentPercentage.toFixed(1)}% of your assets are invested. Consider increasing this for better long-term growth.`,
        priority: 'LOW',
        effort: 'MEDIUM',
        timeframe: 'MEDIUM_TERM',
        actionSteps: [
          'Assess your risk tolerance and investment timeline',
          'Gradually increase investment allocation to 10-20% of assets',
          'Maintain emergency fund before increasing investments',
          'Diversify across different asset classes',
        ],
        data: {
          currentInvestmentPercentage: investmentPercentage,
          totalAssets,
          investmentBalance,
          targetPercentage: 15,
        },
      });
    }

    return recommendations;
  }

  /**
   * Generate spending reduction recommendations
   */
  private async generateSpendingRecommendations(
    transactions: any[],
    spendingPatterns: any[],
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // Analyze spending by category
    const categorySpending = this.calculateCategorySpending(transactions);
    const totalSpending = Array.from(categorySpending.values()).reduce((sum, amount) => sum + amount, 0);

    // Find categories with high spending
    const sortedCategories = Array.from(categorySpending.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    for (const [categoryId, amount] of sortedCategories) {
      const percentage = (amount / totalSpending) * 100;
      
      if (percentage > 30) { // More than 30% of spending in one category
        const transaction = transactions.find(t => t.categoryId === categoryId);
        const categoryName = transaction?.category?.name || 'Uncategorized';
        
        recommendations.push({
          type: 'SPENDING_REDUCTION',
          title: `Reduce ${categoryName} Spending`,
          description: `${categoryName} accounts for ${percentage.toFixed(1)}% of your spending (${this.formatCurrency(amount)}). Consider ways to reduce this expense.`,
          priority: 'MEDIUM',
          potentialSavings: amount * 0.2, // 20% reduction
          effort: 'MEDIUM',
          timeframe: 'SHORT_TERM',
          actionSteps: [
            `Review all ${categoryName} transactions for unnecessary expenses`,
            'Look for cheaper alternatives or substitutes',
            'Set a monthly spending limit for this category',
            'Track progress weekly',
          ],
          data: {
            categoryName,
            currentSpending: amount,
            percentage,
            potentialReduction: amount * 0.2,
          },
        });
      }
    }

    // Subscription and recurring payment recommendations
    const recurringTransactions = transactions.filter(t => 
      t.description && (
        t.description.toLowerCase().includes('subscription') ||
        t.description.toLowerCase().includes('monthly') ||
        t.description.toLowerCase().includes('recurring')
      )
    );

    if (recurringTransactions.length > 0) {
      const totalRecurring = recurringTransactions.reduce((sum, t) => sum + Number(t.amountCents), 0);
      
      recommendations.push({
        type: 'SPENDING_REDUCTION',
        title: 'Review Recurring Subscriptions',
        description: `You have ${recurringTransactions.length} recurring payments totaling ${this.formatCurrency(totalRecurring)}. Review and cancel unused subscriptions.`,
        priority: 'MEDIUM',
        potentialSavings: totalRecurring * 0.3, // 30% of subscriptions might be unused
        effort: 'LOW',
        timeframe: 'IMMEDIATE',
        actionSteps: [
          'List all recurring subscriptions and memberships',
          'Evaluate which ones you actually use regularly',
          'Cancel unused or rarely used subscriptions',
          'Consider annual plans for frequently used services (often cheaper)',
        ],
        data: {
          recurringCount: recurringTransactions.length,
          totalRecurring,
          transactions: recurringTransactions.map(t => ({
            description: t.description,
            amount: t.amountCents,
            date: t.date,
          })),
        },
      });
    }

    return recommendations;
  }

  // Helper methods

  private async getRecentTransactions(householdId: string): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: thirtyDaysAgo },
      },
      include: { category: true },
    });
  }

  private async getActiveBudgets(householdId: string): Promise<any[]> {
    return this.prisma.budget.findMany({
      where: {
        householdId,
        isActive: true,
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

  private async getSpendingPatterns(householdId: string): Promise<any[]> {
    return this.prisma.spendingPattern.findMany({
      where: { householdId },
    });
  }

  private calculateMonthlyIncome(transactions: any[]): number {
    return transactions
      .filter(t => Number(t.amountCents) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amountCents)), 0);
  }

  private calculateMonthlyExpenses(transactions: any[]): number {
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

  private formatCurrency(amountCents: number): string {
    const amount = amountCents / 100;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}
