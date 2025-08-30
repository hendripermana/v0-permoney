import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Budget, BudgetCategory, Prisma } from '@prisma/client';
import { CreateBudgetDto, UpdateBudgetDto, BudgetFiltersDto } from './dto';

export type BudgetWithCategories = Budget & {
  categories: (BudgetCategory & {
    category: {
      id: string;
      name: string;
      icon: string | null;
      color: string | null;
    };
  })[];
};

@Injectable()
export class BudgetsRepository {
  constructor(private prisma: PrismaService) {}

  async create(householdId: string, data: CreateBudgetDto): Promise<BudgetWithCategories> {
    const totalAllocatedCents = data.categories.reduce(
      (sum, cat) => sum + cat.allocatedAmountCents + (cat.carryOverCents || 0),
      0
    );

    return this.prisma.budget.create({
      data: {
        householdId,
        name: data.name,
        period: data.period,
        totalAllocatedCents,
        currency: data.currency || 'IDR',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        categories: {
          create: data.categories.map(cat => ({
            categoryId: cat.categoryId,
            allocatedAmountCents: cat.allocatedAmountCents,
            carryOverCents: cat.carryOverCents || 0,
          })),
        },
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  async findByHousehold(
    householdId: string,
    filters: BudgetFiltersDto = {}
  ): Promise<BudgetWithCategories[]> {
    const where: Prisma.BudgetWhereInput = {
      householdId,
      ...(filters.period && { period: filters.period }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.startDate && { startDate: { gte: new Date(filters.startDate) } }),
      ...(filters.endDate && { endDate: { lte: new Date(filters.endDate) } }),
      ...(filters.search && {
        name: {
          contains: filters.search,
          mode: 'insensitive',
        },
      }),
    };

    return this.prisma.budget.findMany({
      where,
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string, householdId: string): Promise<BudgetWithCategories | null> {
    return this.prisma.budget.findFirst({
      where: {
        id,
        householdId,
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, householdId: string, data: UpdateBudgetDto): Promise<BudgetWithCategories> {
    const updateData: Prisma.BudgetUpdateInput = {
      ...(data.name && { name: data.name }),
      ...(data.period && { period: data.period }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      ...(data.currency && { currency: data.currency }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };

    if (data.categories) {
      const totalAllocatedCents = data.categories.reduce(
        (sum, cat) => sum + cat.allocatedAmountCents + (cat.carryOverCents || 0),
        0
      );
      updateData.totalAllocatedCents = totalAllocatedCents;

      // Delete existing categories and create new ones
      await this.prisma.budgetCategory.deleteMany({
        where: { budgetId: id },
      });

      updateData.categories = {
        create: data.categories.map(cat => ({
          categoryId: cat.categoryId,
          allocatedAmountCents: cat.allocatedAmountCents,
          carryOverCents: cat.carryOverCents || 0,
        })),
      };
    }

    return this.prisma.budget.update({
      where: {
        id,
        householdId,
      },
      data: updateData,
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: string, householdId: string): Promise<void> {
    await this.prisma.budget.delete({
      where: {
        id,
        householdId,
      },
    });
  }

  async updateSpentAmount(
    budgetId: string,
    categoryId: string,
    amountCents: number
  ): Promise<BudgetCategory> {
    return this.prisma.budgetCategory.update({
      where: {
        budgetId_categoryId: {
          budgetId,
          categoryId,
        },
      },
      data: {
        spentAmountCents: {
          increment: amountCents,
        },
      },
    });
  }

  async getSpendingByCategory(
    householdId: string,
    categoryIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<{ categoryId: string; totalSpentCents: number }[]> {
    const result = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        householdId,
        categoryId: {
          in: categoryIds,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
        amountCents: {
          gt: 0, // Only expenses
        },
      },
      _sum: {
        amountCents: true,
      },
    });

    return result.map(item => ({
      categoryId: item.categoryId!,
      totalSpentCents: item._sum.amountCents || 0,
    }));
  }

  async getHistoricalSpending(
    householdId: string,
    categoryId: string,
    months = 6
  ): Promise<{ month: Date; totalSpentCents: number }[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const result = await this.prisma.$queryRaw<
      { month: Date; totalSpentCents: bigint }[]
    >`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount_cents) as "totalSpentCents"
      FROM transactions 
      WHERE household_id = ${householdId}::uuid
        AND category_id = ${categoryId}::uuid
        AND date >= ${startDate}
        AND amount_cents > 0
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
    `;

    return result.map(item => ({
      month: item.month,
      totalSpentCents: Number(item.totalSpentCents),
    }));
  }

  async validateCategoriesExist(
    householdId: string, 
    categoryIds: string[]
  ): Promise<{ id: string; name: string }[]> {
    return this.prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        OR: [
          { householdId },
          { householdId: null }, // Global categories
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getBudgetsByDateRange(
    householdId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Budget[]> {
    return this.prisma.budget.findMany({
      where: {
        householdId,
        isActive: true,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async updateBudgetCategorySpending(
    budgetId: string,
    categoryId: string,
    spentAmountCents: number
  ): Promise<void> {
    await this.prisma.budgetCategory.update({
      where: {
        budgetId_categoryId: {
          budgetId,
          categoryId,
        },
      },
      data: {
        spentAmountCents,
        updatedAt: new Date(),
      },
    });
  }

  async getActiveHouseholdsWithBudgets(): Promise<{ id: string; name: string }[]> {
    const households = await this.prisma.household.findMany({
      where: {
        budgets: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return households;
  }

  async getExpiredBudgets(): Promise<Budget[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.budget.findMany({
      where: {
        isActive: true,
        endDate: {
          lt: today,
        },
      },
    });
  }
}
