import { Injectable, Logger } from '@nestjs/common';
import { BudgetsRepository } from '../budgets.repository';
import { BudgetValidators } from '../validators/budget.validators';
import { BudgetRecommendationDto, RecommendationType } from '../dto';

export interface BudgetAnalytics {
  totalBudgets: number;
  activeBudgets: number;
  totalAllocatedCents: number;
  totalSpentCents: number;
  overallUtilizationPercentage: number;
  categoriesOverBudget: number;
  averageUtilizationPercentage: number;
  topSpendingCategories: Array<{
    categoryId: string;
    categoryName: string;
    spentAmountCents: number;
    budgetedAmountCents: number;
    utilizationPercentage: number;
  }>;
  monthlyTrends: Array<{
    month: Date;
    totalBudgetedCents: number;
    totalSpentCents: number;
    utilizationPercentage: number;
    categoriesCount: number;
  }>;
}

export interface CategorySpendingPattern {
  categoryId: string;
  categoryName: string;
  averageMonthlySpending: number;
  spendingVariance: number;
  seasonalityFactor: number;
  trendDirection: 'INCREASING' | 'DECREASING' | 'STABLE';
  predictedNextMonthSpending: number;
  confidence: number;
}

@Injectable()
export class BudgetAnalyticsService {
  private readonly logger = new Logger(BudgetAnalyticsService.name);

  constructor(
    private budgetsRepository: BudgetsRepository,
    private budgetValidators: BudgetValidators
  ) {}

  async getBudgetAnalytics(householdId: string): Promise<BudgetAnalytics> {
    try {
      // Get all budgets for the household
      const allBudgets = await this.budgetsRepository.findByHousehold(householdId);
      const activeBudgets = allBudgets.filter(budget => budget.isActive);

      let totalAllocatedCents = 0;
      let totalSpentCents = 0;
      let categoriesOverBudget = 0;
      const categorySpending = new Map<string, {
        name: string;
        spent: number;
        budgeted: number;
      }>();

      // Calculate totals and category spending
      for (const budget of activeBudgets) {
        totalAllocatedCents += Number(budget.totalAllocatedCents);

        // Get actual spending for this budget
        const categoryIds = budget.categories.map(cat => cat.categoryId);
        const spendingData = await this.budgetsRepository.getSpendingByCategory(
          householdId,
          categoryIds,
          budget.startDate,
          budget.endDate
        );

        const spendingMap = new Map(
          spendingData.map(item => [item.categoryId, item.totalSpentCents])
        );

        for (const budgetCategory of budget.categories) {
          const actualSpent = spendingMap.get(budgetCategory.categoryId) || 0;
          const allocated = budgetCategory.allocatedAmountCents + budgetCategory.carryOverCents;
          
          totalSpentCents += actualSpent;
          
          if (actualSpent > allocated) {
            categoriesOverBudget++;
          }

          // Aggregate category spending
          const existing = categorySpending.get(budgetCategory.categoryId);
          if (existing) {
            existing.spent += actualSpent;
            existing.budgeted += Number(allocated);
          } else {
            categorySpending.set(budgetCategory.categoryId, {
              name: budgetCategory.category.name,
              spent: actualSpent,
              budgeted: Number(allocated),
            });
          }
        }
      }

      // Calculate overall utilization
      const overallUtilizationPercentage = totalAllocatedCents > 0 
        ? (totalSpentCents / totalAllocatedCents) * 100 
        : 0;

      // Calculate average utilization
      const categoryUtilizations = Array.from(categorySpending.values())
        .map(cat => cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0);
      
      const averageUtilizationPercentage = categoryUtilizations.length > 0
        ? categoryUtilizations.reduce((sum, util) => sum + util, 0) / categoryUtilizations.length
        : 0;

      // Get top spending categories
      const topSpendingCategories = Array.from(categorySpending.entries())
        .map(([categoryId, data]) => ({
          categoryId,
          categoryName: data.name,
          spentAmountCents: data.spent,
          budgetedAmountCents: data.budgeted,
          utilizationPercentage: data.budgeted > 0 ? (data.spent / data.budgeted) * 100 : 0,
        }))
        .sort((a, b) => b.spentAmountCents - a.spentAmountCents)
        .slice(0, 10);

      // Get monthly trends
      const monthlyTrends = await this.getMonthlyTrends(householdId, 12);

      return {
        totalBudgets: allBudgets.length,
        activeBudgets: activeBudgets.length,
        totalAllocatedCents,
        totalSpentCents,
        overallUtilizationPercentage: Math.round(overallUtilizationPercentage * 100) / 100,
        categoriesOverBudget,
        averageUtilizationPercentage: Math.round(averageUtilizationPercentage * 100) / 100,
        topSpendingCategories,
        monthlyTrends,
      };
    } catch (error) {
      this.logger.error(`Failed to get budget analytics: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCategorySpendingPatterns(
    householdId: string,
    months = 12
  ): Promise<CategorySpendingPattern[]> {
    try {
      // Get all categories that have been used in budgets
      const budgets = await this.budgetsRepository.findByHousehold(householdId);
      const categoryIds = Array.from(new Set(budgets.flatMap(b => b.categories.map(c => c.categoryId))));

      const patterns: CategorySpendingPattern[] = [];

      for (const categoryId of categoryIds) {
        const historicalData = await this.budgetsRepository.getHistoricalSpending(
          householdId,
          categoryId,
          months
        );

        if (historicalData.length >= 3) {
          const pattern = await this.analyzeSpendingPattern(categoryId, historicalData);
          patterns.push(pattern);
        }
      }

      return patterns.sort((a, b) => b.averageMonthlySpending - a.averageMonthlySpending);
    } catch (error) {
      this.logger.error(`Failed to get category spending patterns: ${error.message}`, error.stack);
      throw error;
    }
  }

  async generateAdvancedRecommendations(householdId: string): Promise<BudgetRecommendationDto[]> {
    try {
      const recommendations: BudgetRecommendationDto[] = [];
      const analytics = await this.getBudgetAnalytics(householdId);
      const patterns = await this.getCategorySpendingPatterns(householdId);

      // Recommendation 1: Overall budget optimization
      if (analytics.overallUtilizationPercentage < 70) {
        recommendations.push({
          id: 'optimize_overall_budget',
          type: RecommendationType.DECREASE_ALLOCATION,
          title: 'Optimize Overall Budget Allocation',
          description: `Your overall budget utilization is ${analytics.overallUtilizationPercentage.toFixed(1)}%. Consider reallocating funds from underutilized categories.`,
          suggestedAmountCents: Math.round(analytics.totalAllocatedCents * 0.9),
          confidenceScore: 0.8,
          reasoning: 'Low overall utilization suggests over-budgeting across multiple categories',
        });
      }

      // Recommendation 2: High variance categories
      for (const pattern of patterns) {
        if (pattern.spendingVariance > 0.5 && pattern.confidence > 0.6) {
          recommendations.push({
            id: `stabilize_${pattern.categoryId}`,
            type: RecommendationType.SEASONAL_ADJUSTMENT,
            title: `Stabilize ${pattern.categoryName} Budget`,
            description: `Your ${pattern.categoryName} spending varies significantly month-to-month. Consider creating a buffer for this category.`,
            categoryId: pattern.categoryId,
            suggestedAmountCents: Math.round(pattern.averageMonthlySpending * (1 + pattern.spendingVariance)),
            confidenceScore: pattern.confidence,
            reasoning: `High spending variance (${(pattern.spendingVariance * 100).toFixed(1)}%) indicates unpredictable expenses`,
          });
        }
      }

      // Recommendation 3: Trending categories
      for (const pattern of patterns) {
        if (pattern.trendDirection === 'INCREASING' && pattern.confidence > 0.7) {
          recommendations.push({
            id: `increase_trending_${pattern.categoryId}`,
            type: RecommendationType.INCREASE_ALLOCATION,
            title: `Increase ${pattern.categoryName} Budget`,
            description: `Your ${pattern.categoryName} spending has been consistently increasing. Consider adjusting your budget allocation.`,
            categoryId: pattern.categoryId,
            suggestedAmountCents: pattern.predictedNextMonthSpending,
            confidenceScore: pattern.confidence,
            reasoning: `Increasing trend detected with ${(pattern.confidence * 100).toFixed(1)}% confidence`,
          });
        }
      }

      // Recommendation 4: Seasonal adjustments
      const currentMonth = new Date().getMonth();
      const seasonalCategories = this.getSeasonalCategories(currentMonth);
      
      for (const seasonalCategory of seasonalCategories) {
        const pattern = patterns.find(p => p.categoryId === seasonalCategory.categoryId);
        if (pattern) {
          recommendations.push({
            id: `seasonal_${seasonalCategory.categoryId}`,
            type: RecommendationType.SEASONAL_ADJUSTMENT,
            title: `Seasonal Adjustment: ${pattern.categoryName}`,
            description: seasonalCategory.description,
            categoryId: pattern.categoryId,
            suggestedAmountCents: Math.round(pattern.averageMonthlySpending * seasonalCategory.multiplier),
            confidenceScore: 0.7,
            reasoning: seasonalCategory.reasoning,
          });
        }
      }

      return recommendations
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, 15); // Top 15 recommendations
    } catch (error) {
      this.logger.error(`Failed to generate advanced recommendations: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getMonthlyTrends(householdId: string, months: number) {
    const trends = [];
    const currentDate = new Date();

    for (let i = 0; i < months; i++) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

      // Find budgets for this month
      const budgets = await this.budgetsRepository.findByHousehold(householdId);
      const monthBudgets = budgets.filter(budget => 
        budget.startDate <= monthEnd && budget.endDate >= monthStart
      );

      let totalBudgetedCents = 0;
      let totalSpentCents = 0;
      let categoriesCount = 0;

      for (const budget of monthBudgets) {
        totalBudgetedCents += Number(budget.totalAllocatedCents);
        categoriesCount += budget.categories.length;

        // Get spending for this budget in this month
        const categoryIds = budget.categories.map(cat => cat.categoryId);
        const spendingData = await this.budgetsRepository.getSpendingByCategory(
          householdId,
          categoryIds,
          monthStart,
          monthEnd
        );

        totalSpentCents += spendingData.reduce((sum, item) => sum + item.totalSpentCents, 0);
      }

      const utilizationPercentage = totalBudgetedCents > 0 
        ? (totalSpentCents / totalBudgetedCents) * 100 
        : 0;

      trends.unshift({
        month: monthStart,
        totalBudgetedCents,
        totalSpentCents,
        utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
        categoriesCount,
      });
    }

    return trends;
  }

  private async analyzeSpendingPattern(
    categoryId: string,
    historicalData: Array<{ month: Date; totalSpentCents: number }>
  ): Promise<CategorySpendingPattern> {
    const amounts = historicalData.map(d => d.totalSpentCents);
    const averageMonthlySpending = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

    // Calculate variance
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - averageMonthlySpending, 2), 0) / amounts.length;
    const spendingVariance = averageMonthlySpending > 0 ? Math.sqrt(variance) / averageMonthlySpending : 0;

    // Calculate trend
    const trendDirection = this.calculateTrend(amounts);

    // Calculate seasonality (simplified)
    const seasonalityFactor = this.calculateSeasonality(historicalData);

    // Predict next month spending using linear regression
    const predictedNextMonthSpending = this.predictNextMonthSpending(amounts);

    // Calculate confidence based on data quality
    const confidence = this.budgetValidators.validateRecommendationConfidence(
      historicalData.length,
      spendingVariance,
      seasonalityFactor
    );

    // Get category name (simplified - in real implementation, you'd fetch from database)
    const categoryName = `Category ${categoryId}`;

    return {
      categoryId,
      categoryName,
      averageMonthlySpending,
      spendingVariance,
      seasonalityFactor,
      trendDirection,
      predictedNextMonthSpending,
      confidence,
    };
  }

  private calculateTrend(amounts: number[]): 'INCREASING' | 'DECREASING' | 'STABLE' {
    if (amounts.length < 3) return 'STABLE';

    const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
    const secondHalf = amounts.slice(Math.ceil(amounts.length / 2));

    const firstAvg = firstHalf.reduce((sum, amount) => sum + amount, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, amount) => sum + amount, 0) / secondHalf.length;

    const changePercentage = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    if (changePercentage > 10) return 'INCREASING';
    if (changePercentage < -10) return 'DECREASING';
    return 'STABLE';
  }

  private calculateSeasonality(historicalData: Array<{ month: Date; totalSpentCents: number }>): number {
    // Simplified seasonality calculation
    // In a real implementation, you'd use more sophisticated time series analysis
    const monthlyAverages = new Map<number, number[]>();

    historicalData.forEach(data => {
      const month = data.month.getMonth();
      if (!monthlyAverages.has(month)) {
        monthlyAverages.set(month, []);
      }
      monthlyAverages.get(month)?.push(data.totalSpentCents);
    });

    const overallAverage = historicalData.reduce((sum, data) => sum + data.totalSpentCents, 0) / historicalData.length;
    let seasonalityScore = 0;

    monthlyAverages.forEach(amounts => {
      const monthAverage = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const deviation = Math.abs(monthAverage - overallAverage) / overallAverage;
      seasonalityScore = Math.max(seasonalityScore, deviation);
    });

    return Math.min(seasonalityScore, 1); // Cap at 1
  }

  private predictNextMonthSpending(amounts: number[]): number {
    if (amounts.length < 2) return amounts[0] || 0;

    // Simple linear regression
    const n = amounts.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = amounts;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return Math.max(0, slope * n + intercept);
  }

  private getSeasonalCategories(currentMonth: number) {
    const seasonalAdjustments = [
      {
        months: [11, 0], // December, January
        categoryId: 'holiday-spending',
        description: 'Holiday season typically sees increased spending on gifts and entertainment',
        multiplier: 1.5,
        reasoning: 'Historical data shows 50% increase in holiday-related spending',
      },
      {
        months: [6, 7], // July, August
        categoryId: 'education',
        description: 'Back-to-school season requires additional budget for education expenses',
        multiplier: 1.3,
        reasoning: 'School preparation typically increases education spending by 30%',
      },
      {
        months: [3, 4], // April, May (Ramadan/Eid period in Indonesia)
        categoryId: 'religious',
        description: 'Religious celebrations may require additional budget allocation',
        multiplier: 1.4,
        reasoning: 'Religious holidays typically see increased spending on food and gifts',
      },
    ];

    return seasonalAdjustments.filter(adj => adj.months.includes(currentMonth));
  }
}
