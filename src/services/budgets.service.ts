import { Prisma, Budget, BudgetPeriod } from '@prisma/client';
import { BaseService } from './base.service';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

// Types
export interface CreateBudgetData {
  name: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  currency?: string;
  categories: BudgetCategoryData[];
}

export interface UpdateBudgetData {
  name?: string;
  period?: BudgetPeriod;
  startDate?: Date;
  endDate?: Date;
  currency?: string;
  isActive?: boolean;
  categories?: BudgetCategoryData[];
}

export interface BudgetCategoryData {
  categoryId: string;
  allocatedAmountCents: number;
  carryOverCents?: number;
}

export interface BudgetFilters {
  isActive?: boolean;
  period?: BudgetPeriod;
  startDate?: Date;
  endDate?: Date;
}

export interface BudgetWithDetails extends Budget {
  categories: BudgetCategoryWithDetails[];
}

export interface BudgetCategoryWithDetails {
  id: string;
  categoryId: string;
  category?: any;
  allocatedAmountCents: bigint;
  spentAmountCents: bigint;
  carryOverCents: bigint;
}

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

export class BudgetsService extends BaseService {
  /**
   * Create a new budget
   */
  async createBudget(
    householdId: string,
    data: CreateBudgetData
  ): Promise<BudgetWithDetails> {
    try {
      this.validateRequired(data, ['name', 'period', 'startDate', 'endDate', 'categories']);

      // Calculate total allocated
      const totalAllocatedCents = data.categories.reduce(
        (sum, cat) => sum + cat.allocatedAmountCents,
        0
      );

      const result = await this.prisma.$transaction(async (tx) => {
        // Create budget
        const budget = await tx.budget.create({
          data: {
            householdId,
            name: data.name,
            period: data.period,
            totalAllocatedCents: BigInt(totalAllocatedCents),
            currency: data.currency || 'IDR',
            startDate: data.startDate,
            endDate: data.endDate,
            isActive: true,
          },
        });

        // Create budget categories
        await tx.budgetCategory.createMany({
          data: data.categories.map(cat => ({
            budgetId: budget.id,
            categoryId: cat.categoryId,
            allocatedAmountCents: BigInt(cat.allocatedAmountCents),
            carryOverCents: BigInt(cat.carryOverCents || 0),
            spentAmountCents: BigInt(0),
          })),
        });

        return budget;
      });

      // Invalidate caches
      await this.invalidateCachePatterns(
        `budgets:${householdId}*`,
        `dashboard:${householdId}`
      );

      return this.getBudgetById(result.id, householdId);
    } catch (error) {
      return this.handleError(error, 'Failed to create budget');
    }
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(
    id: string,
    householdId: string
  ): Promise<BudgetWithDetails> {
    try {
      const budget = await this.prisma.budget.findFirst({
        where: { id, householdId },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      if (!budget) {
        throw new Error('Budget not found');
      }

      return budget as BudgetWithDetails;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch budget');
    }
  }

  /**
   * Get all budgets with filters
   */
  async getBudgets(
    householdId: string,
    filters: BudgetFilters = {}
  ): Promise<BudgetWithDetails[]> {
    try {
      const cacheKey = CACHE_KEYS.budgets(householdId) + `:${JSON.stringify(filters)}`;

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const where: Prisma.BudgetWhereInput = {
            householdId,
            ...(filters.isActive !== undefined && { isActive: filters.isActive }),
            ...(filters.period && { period: filters.period }),
            ...(filters.startDate && {
              startDate: { gte: filters.startDate },
            }),
            ...(filters.endDate && {
              endDate: { lte: filters.endDate },
            }),
          };

          const budgets = await this.prisma.budget.findMany({
            where,
            include: {
              categories: {
                include: {
                  category: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          });

          return budgets as BudgetWithDetails[];
        },
        CACHE_TTL.SHORT
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch budgets');
    }
  }

  /**
   * Update budget
   */
  async updateBudget(
    id: string,
    householdId: string,
    data: UpdateBudgetData
  ): Promise<BudgetWithDetails> {
    try {
      // Verify budget exists
      await this.getBudgetById(id, householdId);

      const result = await this.prisma.$transaction(async (tx) => {
        // Calculate new total if categories provided
        let totalAllocatedCents: bigint | undefined;
        if (data.categories) {
          totalAllocatedCents = BigInt(
            data.categories.reduce((sum, cat) => sum + cat.allocatedAmountCents, 0)
          );
        }

        // Update budget
        const budget = await tx.budget.update({
          where: { id },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.period && { period: data.period }),
            ...(data.startDate && { startDate: data.startDate }),
            ...(data.endDate && { endDate: data.endDate }),
            ...(data.currency && { currency: data.currency }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(totalAllocatedCents !== undefined && { totalAllocatedCents }),
          },
        });

        // Update categories if provided
        if (data.categories) {
          // Delete existing categories
          await tx.budgetCategory.deleteMany({
            where: { budgetId: id },
          });

          // Create new categories
          await tx.budgetCategory.createMany({
            data: data.categories.map(cat => ({
              budgetId: id,
              categoryId: cat.categoryId,
              allocatedAmountCents: BigInt(cat.allocatedAmountCents),
              carryOverCents: BigInt(cat.carryOverCents || 0),
              spentAmountCents: BigInt(0),
            })),
          });
        }

        return budget;
      });

      // Invalidate caches
      await this.invalidateCachePatterns(
        `budgets:${householdId}*`,
        `budget:${id}:*`,
        `dashboard:${householdId}`
      );

      return this.getBudgetById(id, householdId);
    } catch (error) {
      return this.handleError(error, 'Failed to update budget');
    }
  }

  /**
   * Delete budget
   */
  async deleteBudget(id: string, householdId: string): Promise<void> {
    try {
      // Verify budget exists
      await this.getBudgetById(id, householdId);

      // Delete budget (cascade will delete categories)
      await this.prisma.budget.delete({
        where: { id },
      });

      // Invalidate caches
      await this.invalidateCachePatterns(
        `budgets:${householdId}*`,
        `budget:${id}:*`,
        `dashboard:${householdId}`
      );
    } catch (error) {
      return this.handleError(error, 'Failed to delete budget');
    }
  }

  /**
   * Get budget progress
   */
  async getBudgetProgress(
    id: string,
    householdId: string
  ): Promise<BudgetProgress> {
    try {
      const cacheKey = CACHE_KEYS.budgetProgress(id);

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const budget = await this.getBudgetById(id, householdId);

          // Get transactions for budget period and categories
          const categoryIds = budget.categories.map(c => c.categoryId);
          
          const transactions = await this.prisma.transaction.findMany({
            where: {
              householdId,
              categoryId: { in: categoryIds },
              date: {
                gte: budget.startDate,
                lte: budget.endDate,
              },
            },
            include: {
              category: true,
            },
          });

          // Calculate spent per category
          const spentByCategory = transactions.reduce((acc, transaction) => {
            const categoryId = transaction.categoryId || 'uncategorized';
            if (!acc[categoryId]) {
              acc[categoryId] = 0;
            }
            acc[categoryId] += Math.abs(Number(transaction.amountCents));
            return acc;
          }, {} as Record<string, number>);

          // Calculate progress per category
          const categoryProgress = budget.categories.map(budgetCat => {
            const allocated = Number(budgetCat.allocatedAmountCents);
            const spent = spentByCategory[budgetCat.categoryId] || 0;
            const remaining = allocated - spent;
            const utilization = allocated > 0 ? (spent / allocated) * 100 : 0;
            const isOverspent = spent > allocated;
            const overspent = isOverspent ? spent - allocated : 0;

            return {
              categoryId: budgetCat.categoryId,
              categoryName: budgetCat.category?.name || 'Unknown',
              allocatedAmountCents: allocated,
              spentAmountCents: spent,
              remainingAmountCents: remaining,
              utilizationPercentage: utilization,
              isOverspent,
              overspentAmountCents: overspent,
            };
          });

          // Calculate totals
          const totalAllocated = Number(budget.totalAllocatedCents);
          const totalSpent = Object.values(spentByCategory).reduce((sum, val) => sum + val, 0);
          const totalRemaining = totalAllocated - totalSpent;
          const totalUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
          const isOverBudget = totalSpent > totalAllocated;
          const overBudgetAmount = isOverBudget ? totalSpent - totalAllocated : 0;

          return {
            budgetId: id,
            totalAllocatedCents: totalAllocated,
            totalSpentCents: totalSpent,
            totalRemainingCents: totalRemaining,
            utilizationPercentage: totalUtilization,
            categories: categoryProgress,
            isOverBudget,
            overBudgetAmountCents: overBudgetAmount,
          };
        },
        CACHE_TTL.SHORT
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch budget progress');
    }
  }

  /**
   * Get budget alerts
   */
  async getBudgetAlerts(
    id: string,
    householdId: string
  ): Promise<BudgetAlert[]> {
    try {
      const progress = await this.getBudgetProgress(id, householdId);
      const alerts: BudgetAlert[] = [];

      progress.categories.forEach(category => {
        const utilization = category.utilizationPercentage;

        if (category.isOverspent) {
          alerts.push({
            type: 'CRITICAL',
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            message: `Budget exceeded by ${category.overspentAmountCents} cents`,
            utilizationPercentage: utilization,
            remainingAmountCents: category.remainingAmountCents,
          });
        } else if (utilization >= 90) {
          alerts.push({
            type: 'CRITICAL',
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            message: `Only ${category.remainingAmountCents} cents remaining (${(100 - utilization).toFixed(1)}%)`,
            utilizationPercentage: utilization,
            remainingAmountCents: category.remainingAmountCents,
          });
        } else if (utilization >= 75) {
          alerts.push({
            type: 'WARNING',
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            message: `${utilization.toFixed(1)}% of budget used`,
            utilizationPercentage: utilization,
            remainingAmountCents: category.remainingAmountCents,
          });
        }
      });

      return alerts;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch budget alerts');
    }
  }

  /**
   * Recalculate budget spent amounts from transactions
   */
  async recalculateBudget(
    id: string,
    householdId: string
  ): Promise<BudgetWithDetails> {
    try {
      const budget = await this.getBudgetById(id, householdId);

      // Get all transactions for this budget period
      const categoryIds = budget.categories.map(c => c.categoryId);
      
      const transactions = await this.prisma.transaction.findMany({
        where: {
          householdId,
          categoryId: { in: categoryIds },
          date: {
            gte: budget.startDate,
            lte: budget.endDate,
          },
        },
      });

      // Calculate spent per category
      const spentByCategory = transactions.reduce((acc, transaction) => {
        const categoryId = transaction.categoryId || 'uncategorized';
        if (!acc[categoryId]) {
          acc[categoryId] = 0;
        }
        acc[categoryId] += Math.abs(Number(transaction.amountCents));
        return acc;
      }, {} as Record<string, number>);

      // Update budget categories
      await Promise.all(
        budget.categories.map(category =>
          this.prisma.budgetCategory.update({
            where: { id: category.id },
            data: {
              spentAmountCents: BigInt(spentByCategory[category.categoryId] || 0),
            },
          })
        )
      );

      // Invalidate caches
      await this.invalidateCachePatterns(
        `budgets:${householdId}*`,
        `budget:${id}:*`,
        `dashboard:${householdId}`
      );

      return this.getBudgetById(id, householdId);
    } catch (error) {
      return this.handleError(error, 'Failed to recalculate budget');
    }
  }
}

// Export singleton instance
export const budgetsService = new BudgetsService();
