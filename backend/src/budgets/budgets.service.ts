import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BudgetsRepository, BudgetWithCategories } from './budgets.repository';
import { CreateBudgetDto, UpdateBudgetDto, BudgetFiltersDto, BudgetRecommendationDto, RecommendationType } from './dto';
import { BudgetDomainService } from './domain/budget-domain.service';
import { BudgetDomainEntity } from './domain/budget.entity';
import { CacheService } from '../cache/cache.service';

export interface BudgetProgress {
  budgetId: string;
  totalAllocatedCents: number;
  totalSpentCents: number;
  totalRemainingCents: number;
  utilizationPercentage: number;
  categories: {
    categoryId: string;
    categoryName: string;
    allocatedAmountCents: number;
    spentAmountCents: number;
    remainingAmountCents: number;
    utilizationPercentage: number;
    isOverspent: boolean;
    overspentAmountCents: number;
  }[];
  isOverBudget: boolean;
  overBudgetAmountCents: number;
}

export interface BudgetAlert {
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  categoryId: string;
  categoryName: string;
  message: string;
  utilizationPercentage: number;
  remainingAmountCents: number;
}

@Injectable()
export class BudgetsService {
  constructor(
    private budgetsRepository: BudgetsRepository,
    private budgetDomainService: BudgetDomainService,
    private cacheService: CacheService
  ) {}

  async createBudget(householdId: string, data: CreateBudgetDto): Promise<BudgetWithCategories> {
    // Convert DTO to domain data
    const domainData = {
      name: data.name,
      period: data.period,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      currency: data.currency || 'IDR',
      categories: data.categories.map(cat => ({
        categoryId: cat.categoryId,
        allocatedAmountCents: cat.allocatedAmountCents,
        carryOverCents: cat.carryOverCents || 0,
      })),
    };

    // Use domain service
    const domainEntity = await this.budgetDomainService.createBudget(householdId, domainData);
    
    // Clear cache
    await this.cacheService.del(`budgets:${householdId}`);
    
    // Convert back to repository format for API response
    return this.convertDomainEntityToRepositoryFormat(domainEntity);
  }

  async getBudgets(householdId: string, filters: BudgetFiltersDto = {}): Promise<BudgetWithCategories[]> {
    const cacheKey = `budgets:${householdId}:${JSON.stringify(filters)}`;
    
    let budgets = await this.cacheService.get<BudgetWithCategories[]>(cacheKey);
    if (!budgets) {
      budgets = await this.budgetsRepository.findByHousehold(householdId, filters);
      await this.cacheService.set(cacheKey, budgets, 300); // 5 minutes
    }
    
    return budgets;
  }

  async getBudgetById(id: string, householdId: string): Promise<BudgetWithCategories> {
    const budget = await this.budgetsRepository.findById(id, householdId);
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return budget;
  }

  async updateBudget(id: string, householdId: string, data: UpdateBudgetDto): Promise<BudgetWithCategories> {
    // Convert DTO to domain data
    const domainData = {
      name: data.name,
      period: data.period,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      currency: data.currency,
      isActive: data.isActive,
      categories: data.categories?.map(cat => ({
        categoryId: cat.categoryId,
        allocatedAmountCents: cat.allocatedAmountCents,
        carryOverCents: cat.carryOverCents || 0,
      })),
    };

    // Use domain service
    const domainEntity = await this.budgetDomainService.updateBudget(id, householdId, domainData);
    
    // Clear cache
    await this.cacheService.del(`budgets:${householdId}`);
    
    // Convert back to repository format for API response
    return this.convertDomainEntityToRepositoryFormat(domainEntity);
  }

  async deleteBudget(id: string, householdId: string): Promise<void> {
    // Use domain service
    await this.budgetDomainService.deleteBudget(id, householdId);
    
    // Clear cache
    await this.cacheService.del(`budgets:${householdId}`);
  }

  async getBudgetProgress(budgetId: string, householdId: string): Promise<BudgetProgress> {
    // Use domain service to get progress
    const progress = await this.budgetDomainService.getBudgetProgress(budgetId, householdId);
    
    return {
      budgetId,
      totalAllocatedCents: progress.totalAllocatedCents,
      totalSpentCents: progress.totalSpentCents,
      totalRemainingCents: progress.totalRemainingCents,
      utilizationPercentage: progress.utilizationPercentage,
      categories: progress.categories,
      isOverBudget: progress.isOverBudget,
      overBudgetAmountCents: progress.overBudgetAmountCents,
    };
  }

  async getBudgetAlerts(budgetId: string, householdId: string): Promise<BudgetAlert[]> {
    const progress = await this.getBudgetProgress(budgetId, householdId);
    const alerts: BudgetAlert[] = [];

    progress.categories.forEach(category => {
      if (category.isOverspent) {
        alerts.push({
          type: 'CRITICAL',
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          message: `Budget exceeded by ${this.formatCurrency(category.overspentAmountCents)}`,
          utilizationPercentage: category.utilizationPercentage,
          remainingAmountCents: category.remainingAmountCents,
        });
      } else if (category.utilizationPercentage >= 90) {
        alerts.push({
          type: 'WARNING',
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          message: `90% of budget used, ${this.formatCurrency(category.remainingAmountCents)} remaining`,
          utilizationPercentage: category.utilizationPercentage,
          remainingAmountCents: category.remainingAmountCents,
        });
      } else if (category.utilizationPercentage >= 75) {
        alerts.push({
          type: 'INFO',
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          message: `75% of budget used, ${this.formatCurrency(category.remainingAmountCents)} remaining`,
          utilizationPercentage: category.utilizationPercentage,
          remainingAmountCents: category.remainingAmountCents,
        });
      }
    });

    return alerts;
  }

  async generateBudgetRecommendations(householdId: string): Promise<BudgetRecommendationDto[]> {
    const recommendations: BudgetRecommendationDto[] = [];
    
    // Get active budgets
    const activeBudgets = await this.getBudgets(householdId, { isActive: true });
    
    if (activeBudgets.length === 0) {
      return recommendations;
    }

    // Analyze each active budget
    for (const budget of activeBudgets) {
      const progress = await this.getBudgetProgress(budget.id, householdId);
      
      // Analyze each category
      for (const category of progress.categories) {
        // Get historical spending for this category
        const historicalData = await this.budgetsRepository.getHistoricalSpending(
          householdId,
          category.categoryId,
          6
        );

        if (historicalData.length >= 3) {
          const avgHistoricalSpending = historicalData.reduce(
            (sum, month) => sum + month.totalSpentCents,
            0
          ) / historicalData.length;

          // Calculate variance for confidence scoring
          const variance = historicalData.reduce(
            (sum, month) => sum + Math.pow(month.totalSpentCents - avgHistoricalSpending, 2),
            0
          ) / historicalData.length;
          const varianceCoefficient = Math.sqrt(variance) / avgHistoricalSpending;

          const confidence = Math.max(0, Math.min(1, 1 - varianceCoefficient));

          // Recommendation: Increase allocation if consistently overspending
          if (category.isOverspent && avgHistoricalSpending > category.allocatedAmountCents * 1.1) {
            recommendations.push({
              id: `increase_${category.categoryId}`,
              type: RecommendationType.INCREASE_ALLOCATION,
              title: `Increase ${category.categoryName} Budget`,
              description: `Based on your spending patterns, consider increasing the ${category.categoryName} budget.`,
              categoryId: category.categoryId,
              suggestedAmountCents: Math.round(avgHistoricalSpending * 1.1),
              confidenceScore: confidence,
              reasoning: `Historical average spending (${this.formatCurrency(avgHistoricalSpending)}) exceeds current allocation by ${Math.round(((avgHistoricalSpending / category.allocatedAmountCents) - 1) * 100)}%`,
            });
          }

          // Recommendation: Decrease allocation if consistently underspending
          if (!category.isOverspent && category.utilizationPercentage < 50 && avgHistoricalSpending < category.allocatedAmountCents * 0.7) {
            recommendations.push({
              id: `decrease_${category.categoryId}`,
              type: RecommendationType.DECREASE_ALLOCATION,
              title: `Reduce ${category.categoryName} Budget`,
              description: `You consistently spend less than allocated for ${category.categoryName}. Consider reallocating funds.`,
              categoryId: category.categoryId,
              suggestedAmountCents: Math.round(avgHistoricalSpending * 1.2),
              confidenceScore: confidence * 0.9, // Slightly lower confidence for decrease recommendations
              reasoning: `Historical average spending (${this.formatCurrency(avgHistoricalSpending)}) is ${Math.round((1 - (avgHistoricalSpending / category.allocatedAmountCents)) * 100)}% below current allocation`,
            });
          }
        }

        // Seasonal adjustment recommendations
        const currentMonth = new Date().getMonth();
        if (this.isHighSpendingMonth(currentMonth, category.categoryId)) {
          recommendations.push({
            id: `seasonal_${category.categoryId}`,
            type: RecommendationType.SEASONAL_ADJUSTMENT,
            title: `Seasonal Adjustment for ${category.categoryName}`,
            description: `Consider increasing ${category.categoryName} budget for this month due to seasonal spending patterns.`,
            categoryId: category.categoryId,
            suggestedAmountCents: Math.round(category.allocatedAmountCents * 1.3),
            confidenceScore: 0.65,
            reasoning: `Historical data shows higher spending in this category during this time of year`,
          });
        }
      }
    }

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  async carryOverUnusedBudget(budgetId: string, householdId: string): Promise<BudgetWithCategories> {
    // Use domain service
    const domainEntity = await this.budgetDomainService.carryOverBudget(budgetId, householdId);
    
    // Clear cache
    await this.cacheService.del(`budgets:${householdId}`);
    
    // Convert back to repository format for API response
    return this.convertDomainEntityToRepositoryFormat(domainEntity);
  }

  private formatCurrency(amountCents: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amountCents / 100);
  }

  private convertDomainEntityToRepositoryFormat(domainEntity: BudgetDomainEntity): BudgetWithCategories {
    return {
      id: domainEntity.id,
      householdId: domainEntity.householdId,
      name: domainEntity.name,
      period: domainEntity.period,
      totalAllocatedCents: BigInt(domainEntity.totalAllocatedCents),
      currency: domainEntity.currency,
      startDate: domainEntity.startDate,
      endDate: domainEntity.endDate,
      isActive: domainEntity.isActive,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
      categories: domainEntity.categories.map(cat => ({
        id: cat.id,
        budgetId: cat.budgetId,
        categoryId: cat.categoryId,
        allocatedAmountCents: BigInt(cat.allocatedAmountCents),
        spentAmountCents: BigInt(cat.spentAmountCents),
        carryOverCents: BigInt(cat.carryOverCents),
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        category: {
          id: cat.category.id,
          name: cat.category.name,
          icon: cat.category.icon,
          color: cat.category.color,
        },
      })),
    };
  }

  private isHighSpendingMonth(month: number, categoryId: string): boolean {
    // Simple heuristic for seasonal spending patterns
    // This could be enhanced with actual historical analysis
    const seasonalCategories = {
      // Holiday months (December, January)
      holiday: [11, 0],
      // Back-to-school (July, August)
      education: [6, 7],
      // Ramadan/Eid (varies, but often around April-May)
      religious: [3, 4],
    };

    // This is a simplified implementation
    // In a real system, you'd analyze historical data
    return seasonalCategories.holiday.includes(month);
  }
}
