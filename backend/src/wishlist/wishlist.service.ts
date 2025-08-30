import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { WishlistRepository } from './wishlist.repository';
import { EcommerceParserService } from './ecommerce-parser.service';
import { PriceTrackingService } from './price-tracking.service';
import { CreateWishlistItemDto, UpdateWishlistItemDto } from './dto';

@Injectable()
export class WishlistService {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly ecommerceParser: EcommerceParserService,
    private readonly priceTrackingService: PriceTrackingService,
  ) {}

  async createWishlistItem(householdId: string, userId: string, dto: CreateWishlistItemDto) {
    // Parse the product information from the URL
    const productInfo = await this.ecommerceParser.parseProductUrl(dto.url);
    
    if (!productInfo.isValid) {
      throw new BadRequestException('Unable to parse product information from the provided URL');
    }

    const createData = {
      ...dto,
      name: dto.name || productInfo.name,
      currentPriceCents: Math.round(productInfo.price * 100),
      merchant: productInfo.merchant,
      imageUrl: productInfo.imageUrl,
      currency: dto.currency || productInfo.currency,
    };

    const wishlistItem = await this.wishlistRepository.create(householdId, userId, createData);

    // Add initial price history entry
    await this.wishlistRepository.addPriceHistory(
      wishlistItem.id,
      wishlistItem.currentPriceCents,
      wishlistItem.currency,
    );

    return this.formatWishlistItem(wishlistItem);
  }

  async getWishlistItems(householdId: string) {
    const items = await this.wishlistRepository.findByHousehold(householdId);
    return items.map(item => this.formatWishlistItem(item));
  }

  async getWishlistItem(id: string) {
    const item = await this.wishlistRepository.findById(id);
    
    if (!item) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    return this.formatWishlistItem(item);
  }

  async updateWishlistItem(id: string, dto: UpdateWishlistItemDto) {
    const existingItem = await this.wishlistRepository.findById(id);
    
    if (!existingItem) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    const updatedItem = await this.wishlistRepository.update(id, dto);
    return this.formatWishlistItem(updatedItem);
  }

  async deleteWishlistItem(id: string) {
    const existingItem = await this.wishlistRepository.findById(id);
    
    if (!existingItem) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    await this.wishlistRepository.delete(id);
  }

  async refreshPrice(id: string) {
    const alert = await this.priceTrackingService.trackSingleItem(id);
    const updatedItem = await this.wishlistRepository.findById(id);
    
    return {
      item: this.formatWishlistItem(updatedItem!),
      priceAlert: alert,
    };
  }

  async getPriceHistory(id: string, days = 30) {
    const item = await this.wishlistRepository.findById(id);
    
    if (!item) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    return this.priceTrackingService.getPriceHistory(id, days);
  }

  async getSavingsOpportunity(id: string) {
    const item = await this.wishlistRepository.findById(id);
    
    if (!item) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    return this.priceTrackingService.calculateSavingsOpportunity(id);
  }

  async getWishlistByGoal(goalId: string) {
    const items = await this.wishlistRepository.findItemsByGoal(goalId);
    return items.map(item => this.formatWishlistItem(item));
  }

  async linkToGoal(id: string, goalId: string) {
    const item = await this.wishlistRepository.findById(id);
    
    if (!item) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    const updatedItem = await this.wishlistRepository.update(id, { linkedGoalId: goalId });
    return this.formatWishlistItem(updatedItem);
  }

  async unlinkFromGoal(id: string) {
    const item = await this.wishlistRepository.findById(id);
    
    if (!item) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    const updatedItem = await this.wishlistRepository.update(id, { linkedGoalId: null });
    return this.formatWishlistItem(updatedItem);
  }

  async markAsPurchased(id: string) {
    const item = await this.wishlistRepository.findById(id);
    
    if (!item) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    const updatedItem = await this.wishlistRepository.update(id, { isPurchased: true });
    return this.formatWishlistItem(updatedItem);
  }

  private formatWishlistItem(item: any) {
    return {
      id: item.id,
      name: item.name,
      url: item.url,
      currentPrice: item.currentPriceCents / 100,
      targetPrice: item.targetPriceCents ? item.targetPriceCents / 100 : null,
      currency: item.currency,
      imageUrl: item.imageUrl,
      merchant: item.merchant,
      linkedGoalId: item.linkedGoalId,
      isPurchased: item.isPurchased,
      createdBy: item.creator ? {
        id: item.creator.id,
        name: item.creator.name,
        email: item.creator.email,
      } : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      priceHistory: item.priceHistory ? item.priceHistory.map((history: any) => ({
        date: history.recordedAt,
        price: history.priceCents / 100,
        currency: history.currency,
      })) : [],
      latestPrice: item.priceHistory && item.priceHistory.length > 0 ? {
        date: item.priceHistory[0].recordedAt,
        price: item.priceHistory[0].priceCents / 100,
        currency: item.priceHistory[0].currency,
      } : null,
    };
  }
}
