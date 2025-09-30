import { Prisma, Category, CategoryType } from '@prisma/client';
import { BaseService } from './base.service';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

export interface CreateCategoryData {
  name: string;
  slug: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  parentId?: string;
  isActive?: boolean;
  isEditable?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  isActive?: boolean;
  isArchived?: boolean;
  sortOrder?: number;
}

export interface CategoryFilters {
  type?: CategoryType;
  isActive?: boolean;
  isArchived?: boolean;
  parentId?: string | null;
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  parent?: Category;
  _count?: {
    transactions: number;
    children: number;
  };
}

export class CategoriesService extends BaseService {
  async createCategory(
    householdId: string,
    data: CreateCategoryData
  ): Promise<CategoryWithChildren> {
    try {
      this.validateRequired(data, ['name', 'slug', 'type']);

      const category = await this.prisma.category.create({
        data: {
          householdId,
          name: data.name,
          slug: data.slug,
          type: data.type,
          icon: data.icon,
          color: data.color,
          parentId: data.parentId,
          isActive: data.isActive ?? true,
          isEditable: data.isEditable ?? true,
          sortOrder: data.sortOrder,
        },
        include: {
          parent: true,
          _count: {
            select: { transactions: true, children: true },
          },
        },
      });

      await this.invalidateCachePatterns(`categories:${householdId}*`);
      return category as CategoryWithChildren;
    } catch (error) {
      return this.handleError(error, 'Failed to create category');
    }
  }

  async getCategoryById(
    id: string,
    householdId: string
  ): Promise<CategoryWithChildren> {
    try {
      const category = await this.prisma.category.findFirst({
        where: { id, householdId },
        include: {
          parent: true,
          children: true,
          _count: {
            select: { transactions: true, children: true },
          },
        },
      });

      if (!category) {
        throw new Error('Category not found');
      }

      return category as CategoryWithChildren;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch category');
    }
  }

  async getCategories(
    householdId: string,
    filters: CategoryFilters = {}
  ): Promise<CategoryWithChildren[]> {
    try {
      const cacheKey = CACHE_KEYS.categories(householdId) + `:${JSON.stringify(filters)}`;

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const where: Prisma.CategoryWhereInput = {
            householdId,
            ...(filters.type && { type: filters.type }),
            ...(filters.isActive !== undefined && { isActive: filters.isActive }),
            ...(filters.isArchived !== undefined && { isArchived: filters.isArchived }),
            ...(filters.parentId !== undefined && { parentId: filters.parentId }),
          };

          const categories = await this.prisma.category.findMany({
            where,
            include: {
              parent: true,
              children: true,
              _count: {
                select: { transactions: true, children: true },
              },
            },
            orderBy: [
              { sortOrder: 'asc' },
              { name: 'asc' },
            ],
          });

          return categories as CategoryWithChildren[];
        },
        CACHE_TTL.LONG
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch categories');
    }
  }

  async updateCategory(
    id: string,
    householdId: string,
    data: UpdateCategoryData
  ): Promise<CategoryWithChildren> {
    try {
      await this.getCategoryById(id, householdId);

      const category = await this.prisma.category.update({
        where: { id },
        data,
        include: {
          parent: true,
          children: true,
          _count: {
            select: { transactions: true, children: true },
          },
        },
      });

      await this.invalidateCachePatterns(`categories:${householdId}*`);
      return category as CategoryWithChildren;
    } catch (error) {
      return this.handleError(error, 'Failed to update category');
    }
  }

  async deleteCategory(id: string, householdId: string): Promise<void> {
    try {
      const category = await this.getCategoryById(id, householdId);

      // Check if category has transactions
      if (category._count && category._count.transactions > 0) {
        // Archive instead of delete
        await this.prisma.category.update({
          where: { id },
          data: { isArchived: true, isActive: false },
        });
      } else {
        await this.prisma.category.delete({ where: { id } });
      }

      await this.invalidateCachePatterns(`categories:${householdId}*`);
    } catch (error) {
      return this.handleError(error, 'Failed to delete category');
    }
  }
}

export const categoriesService = new CategoriesService();
