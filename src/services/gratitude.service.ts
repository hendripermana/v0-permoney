import { Prisma, GratitudeEntry, GratitudeType } from '@prisma/client';
import { BaseService } from './base.service';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

export interface CreateGratitudeData {
  giver: string;
  type: GratitudeType;
  categoryId?: string;
  transactionId?: string;
  estimatedValueCents?: number;
  currency?: string;
  description: string;
  date: Date;
}

export interface UpdateGratitudeData {
  giver?: string;
  type?: GratitudeType;
  categoryId?: string;
  transactionId?: string;
  estimatedValueCents?: number;
  currency?: string;
  description?: string;
  date?: Date;
}

export interface GratitudeFilters {
  type?: GratitudeType;
  startDate?: Date;
  endDate?: Date;
  giver?: string;
}

export interface GratitudeWithDetails extends GratitudeEntry {
  category?: any;
  transaction?: any;
  creator: any;
}

export class GratitudeService extends BaseService {
  async createGratitudeEntry(
    householdId: string,
    userId: string,
    data: CreateGratitudeData
  ): Promise<GratitudeWithDetails> {
    try {
      this.validateRequired(data, ['giver', 'type', 'description', 'date']);

      const entry = await this.prisma.gratitudeEntry.create({
        data: {
          householdId,
          giver: data.giver,
          type: data.type,
          categoryId: data.categoryId,
          transactionId: data.transactionId,
          estimatedValueCents: data.estimatedValueCents ? BigInt(data.estimatedValueCents) : null,
          currency: data.currency || 'IDR',
          description: data.description,
          date: data.date,
          createdBy: userId,
        },
        include: {
          category: true,
          transaction: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await this.invalidateCachePatterns(`gratitude:${householdId}*`);
      return entry as GratitudeWithDetails;
    } catch (error) {
      return this.handleError(error, 'Failed to create gratitude entry');
    }
  }

  async getGratitudeById(
    id: string,
    householdId: string
  ): Promise<GratitudeWithDetails> {
    try {
      const entry = await this.prisma.gratitudeEntry.findFirst({
        where: { id, householdId },
        include: {
          category: true,
          transaction: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!entry) {
        throw new Error('Gratitude entry not found');
      }

      return entry as GratitudeWithDetails;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch gratitude entry');
    }
  }

  async getGratitudeEntries(
    householdId: string,
    filters: GratitudeFilters = {}
  ): Promise<GratitudeWithDetails[]> {
    try {
      const cacheKey = CACHE_KEYS.gratitude(householdId) + `:${JSON.stringify(filters)}`;

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const where: Prisma.GratitudeEntryWhereInput = {
            householdId,
            ...(filters.type && { type: filters.type }),
            ...(filters.giver && { giver: { contains: filters.giver, mode: 'insensitive' } }),
            ...(filters.startDate && { date: { gte: filters.startDate } }),
            ...(filters.endDate && { date: { lte: filters.endDate } }),
          };

          const entries = await this.prisma.gratitudeEntry.findMany({
            where,
            include: {
              category: true,
              transaction: true,
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { date: 'desc' },
          });

          return entries as GratitudeWithDetails[];
        },
        CACHE_TTL.SHORT
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch gratitude entries');
    }
  }

  async updateGratitudeEntry(
    id: string,
    householdId: string,
    data: UpdateGratitudeData
  ): Promise<GratitudeWithDetails> {
    try {
      await this.getGratitudeById(id, householdId);

      const entry = await this.prisma.gratitudeEntry.update({
        where: { id },
        data: {
          ...(data.giver && { giver: data.giver }),
          ...(data.type && { type: data.type }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.transactionId !== undefined && { transactionId: data.transactionId }),
          ...(data.estimatedValueCents !== undefined && { 
            estimatedValueCents: data.estimatedValueCents ? BigInt(data.estimatedValueCents) : null 
          }),
          ...(data.currency && { currency: data.currency }),
          ...(data.description && { description: data.description }),
          ...(data.date && { date: data.date }),
        },
        include: {
          category: true,
          transaction: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await this.invalidateCachePatterns(`gratitude:${householdId}*`);
      return entry as GratitudeWithDetails;
    } catch (error) {
      return this.handleError(error, 'Failed to update gratitude entry');
    }
  }

  async deleteGratitudeEntry(id: string, householdId: string): Promise<void> {
    try {
      await this.getGratitudeById(id, householdId);
      await this.prisma.gratitudeEntry.delete({ where: { id } });
      await this.invalidateCachePatterns(`gratitude:${householdId}*`);
    } catch (error) {
      return this.handleError(error, 'Failed to delete gratitude entry');
    }
  }
}

export const gratitudeService = new GratitudeService();
