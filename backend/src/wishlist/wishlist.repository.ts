import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWishlistItemDto, UpdateWishlistItemDto } from './dto';
import { WishlistItem, PriceHistory } from '@prisma/client';

@Injectable()
export class WishlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    householdId: string,
    userId: string,
    data: CreateWishlistItemDto & {
      currentPriceCents: number;
      merchant: string;
      imageUrl?: string;
    },
  ): Promise<WishlistItem> {
    return this.prisma.wishlistItem.create({
      data: {
        ...data,
        householdId,
        createdBy: userId,
        targetPriceCents: data.targetPrice ? Math.round(data.targetPrice * 100) : null,
        currentPriceCents: data.currentPriceCents,
      },
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async findByHousehold(householdId: string): Promise<WishlistItem[]> {
    return this.prisma.wishlistItem.findMany({
      where: {
        householdId,
      },
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string): Promise<WishlistItem | null> {
    return this.prisma.wishlistItem.findUnique({
      where: { id },
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateWishlistItemDto): Promise<WishlistItem> {
    const updateData: any = { ...data };
    
    if (data.targetPrice !== undefined) {
      updateData.targetPriceCents = data.targetPrice ? Math.round(data.targetPrice * 100) : null;
      delete updateData.targetPrice;
    }

    return this.prisma.wishlistItem.update({
      where: { id },
      data: updateData,
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.wishlistItem.delete({
      where: { id },
    });
  }

  async updatePrice(id: string, priceCents: number): Promise<WishlistItem> {
    return this.prisma.wishlistItem.update({
      where: { id },
      data: {
        currentPriceCents: priceCents,
      },
    });
  }

  async addPriceHistory(wishlistItemId: string, priceCents: number, currency = 'IDR'): Promise<PriceHistory> {
    return this.prisma.priceHistory.create({
      data: {
        wishlistItemId,
        priceCents,
        currency,
      },
    });
  }

  async getPriceHistory(wishlistItemId: string, limit = 30): Promise<PriceHistory[]> {
    return this.prisma.priceHistory.findMany({
      where: { wishlistItemId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }

  async findItemsForPriceTracking(): Promise<WishlistItem[]> {
    return this.prisma.wishlistItem.findMany({
      where: {
        isPurchased: false,
      },
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findItemsByGoal(goalId: string): Promise<WishlistItem[]> {
    return this.prisma.wishlistItem.findMany({
      where: {
        linkedGoalId: goalId,
      },
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}
