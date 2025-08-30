import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../../prisma/prisma.service';
import { Category } from '@prisma/client';

@Injectable()
export class CategoriesDataLoader {
  constructor(private prisma: PrismaService) {}

  // Batch load categories by IDs
  private categoryLoader = new DataLoader<string, Category | null>(
    async (categoryIds: readonly string[]) => {
      const categories = await this.prisma.category.findMany({
        where: {
          id: { in: [...categoryIds] },
        },
        include: {
          parent: true,
          children: {
            where: {
              isActive: true,
            },
            orderBy: {
              name: 'asc',
            },
          },
        },
      });

      const categoryMap = new Map(categories.map(category => [category.id, category]));
      return categoryIds.map(id => categoryMap.get(id) || null);
    },
  );

  // Batch load categories by household ID
  private categoriesByHouseholdLoader = new DataLoader<string, Category[]>(
    async (householdIds: readonly string[]) => {
      const categories = await this.prisma.category.findMany({
        where: {
          OR: [
            { householdId: { in: [...householdIds] } },
            { householdId: null }, // Global categories
          ],
          isActive: true,
        },
        include: {
          parent: true,
          children: {
            where: {
              isActive: true,
            },
            orderBy: {
              name: 'asc',
            },
          },
        },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' },
        ],
      });

      const categoriesByHousehold = new Map<string, Category[]>();
      
      // Group categories by household
      categories.forEach(category => {
        if (category.householdId) {
          const existing = categoriesByHousehold.get(category.householdId) || [];
          existing.push(category);
          categoriesByHousehold.set(category.householdId, existing);
        } else {
          // Global categories - add to all households
          householdIds.forEach(householdId => {
            const existing = categoriesByHousehold.get(householdId) || [];
            existing.push(category);
            categoriesByHousehold.set(householdId, existing);
          });
        }
      });

      return householdIds.map(id => categoriesByHousehold.get(id) || []);
    },
  );

  // Batch load root categories (no parent) by household
  private rootCategoriesByHouseholdLoader = new DataLoader<string, Category[]>(
    async (householdIds: readonly string[]) => {
      const categories = await this.prisma.category.findMany({
        where: {
          OR: [
            { householdId: { in: [...householdIds] } },
            { householdId: null }, // Global categories
          ],
          parentId: null,
          isActive: true,
        },
        include: {
          children: {
            where: {
              isActive: true,
            },
            orderBy: {
              name: 'asc',
            },
          },
        },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' },
        ],
      });

      const categoriesByHousehold = new Map<string, Category[]>();
      
      categories.forEach(category => {
        if (category.householdId) {
          const existing = categoriesByHousehold.get(category.householdId) || [];
          existing.push(category);
          categoriesByHousehold.set(category.householdId, existing);
        } else {
          // Global categories - add to all households
          householdIds.forEach(householdId => {
            const existing = categoriesByHousehold.get(householdId) || [];
            existing.push(category);
            categoriesByHousehold.set(householdId, existing);
          });
        }
      });

      return householdIds.map(id => categoriesByHousehold.get(id) || []);
    },
  );

  // Batch load categories by type
  private categoriesByTypeLoader = new DataLoader<{ householdId: string; type: string }, Category[]>(
    async (keys: readonly { householdId: string; type: string }[]) => {
      const householdIds = [...new Set(keys.map(k => k.householdId))];
      const types = [...new Set(keys.map(k => k.type))];

      const categories = await this.prisma.category.findMany({
        where: {
          OR: [
            { householdId: { in: householdIds } },
            { householdId: null }, // Global categories
          ],
          type: { in: types },
          isActive: true,
        },
        include: {
          parent: true,
          children: {
            where: {
              isActive: true,
            },
            orderBy: {
              name: 'asc',
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      const categoriesByKey = new Map<string, Category[]>();
      
      keys.forEach(key => {
        const keyString = `${key.householdId}:${key.type}`;
        const matchingCategories = categories.filter(category => 
          (category.householdId === key.householdId || category.householdId === null) &&
          category.type === key.type
        );
        categoriesByKey.set(keyString, matchingCategories);
      });

      return keys.map(key => {
        const keyString = `${key.householdId}:${key.type}`;
        return categoriesByKey.get(keyString) || [];
      });
    },
    {
      cacheKeyFn: (key) => `${key.householdId}:${key.type}`,
    },
  );

  // Public methods
  async loadCategory(id: string): Promise<Category | null> {
    return this.categoryLoader.load(id);
  }

  async loadCategories(ids: string[]): Promise<(Category | null)[]> {
    return this.categoryLoader.loadMany(ids);
  }

  async loadCategoriesByHousehold(householdId: string): Promise<Category[]> {
    return this.categoriesByHouseholdLoader.load(householdId);
  }

  async loadRootCategoriesByHousehold(householdId: string): Promise<Category[]> {
    return this.rootCategoriesByHouseholdLoader.load(householdId);
  }

  async loadCategoriesByType(householdId: string, type: string): Promise<Category[]> {
    return this.categoriesByTypeLoader.load({ householdId, type });
  }

  // Clear cache methods
  clearCategory(id: string): void {
    this.categoryLoader.clear(id);
  }

  clearCategoriesByHousehold(householdId: string): void {
    this.categoriesByHouseholdLoader.clear(householdId);
    this.rootCategoriesByHouseholdLoader.clear(householdId);
  }

  clearCategoriesByType(householdId: string, type: string): void {
    this.categoriesByTypeLoader.clear({ householdId, type });
  }

  clearAll(): void {
    this.categoryLoader.clearAll();
    this.categoriesByHouseholdLoader.clearAll();
    this.rootCategoriesByHouseholdLoader.clearAll();
    this.categoriesByTypeLoader.clearAll();
  }
}
