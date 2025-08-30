import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WishlistRepository } from './wishlist.repository';
import { EcommerceParserService } from './ecommerce-parser.service';

export interface PriceAlert {
  wishlistItemId: string;
  itemName: string;
  oldPrice: number;
  newPrice: number;
  priceChange: number;
  priceChangePercent: number;
  targetPrice?: number;
  targetReached: boolean;
}

@Injectable()
export class PriceTrackingService {
  private readonly logger = new Logger(PriceTrackingService.name);

  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly ecommerceParser: EcommerceParserService,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async trackPrices(): Promise<PriceAlert[]> {
    this.logger.log('Starting price tracking job');
    
    try {
      const items = await this.wishlistRepository.findItemsForPriceTracking();
      const alerts: PriceAlert[] = [];

      for (const item of items) {
        try {
          const productInfo = await this.ecommerceParser.parseProductUrl(item.url);
          
          if (!productInfo.isValid || productInfo.price === 0) {
            this.logger.warn(`Failed to get valid price for item ${item.id}: ${item.name}`);
            continue;
          }

          const newPriceCents = Math.round(productInfo.price * 100);
          const oldPriceCents = item.currentPriceCents;

          // Only update if price has changed
          if (newPriceCents !== oldPriceCents) {
            await this.wishlistRepository.updatePrice(item.id, newPriceCents);
            await this.wishlistRepository.addPriceHistory(item.id, newPriceCents, item.currency);

            const priceChange = (newPriceCents - oldPriceCents) / 100;
            const priceChangePercent = ((newPriceCents - oldPriceCents) / oldPriceCents) * 100;
            const targetReached = item.targetPriceCents ? newPriceCents <= item.targetPriceCents : false;

            const alert: PriceAlert = {
              wishlistItemId: item.id,
              itemName: item.name,
              oldPrice: oldPriceCents / 100,
              newPrice: newPriceCents / 100,
              priceChange,
              priceChangePercent,
              targetPrice: item.targetPriceCents ? item.targetPriceCents / 100 : undefined,
              targetReached,
            };

            alerts.push(alert);

            this.logger.log(
              `Price updated for ${item.name}: ${oldPriceCents / 100} -> ${newPriceCents / 100} (${priceChangePercent.toFixed(2)}%)`,
            );
          }

          // Add small delay to avoid overwhelming e-commerce sites
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          this.logger.error(`Failed to track price for item ${item.id}: ${item.name}`, error);
        }
      }

      this.logger.log(`Price tracking completed. ${alerts.length} price changes detected.`);
      return alerts;
    } catch (error) {
      this.logger.error('Price tracking job failed', error);
      return [];
    }
  }

  async trackSingleItem(itemId: string): Promise<PriceAlert | null> {
    try {
      const item = await this.wishlistRepository.findById(itemId);
      
      if (!item) {
        throw new Error(`Wishlist item ${itemId} not found`);
      }

      const productInfo = await this.ecommerceParser.parseProductUrl(item.url);
      
      if (!productInfo.isValid || productInfo.price === 0) {
        this.logger.warn(`Failed to get valid price for item ${item.id}: ${item.name}`);
        return null;
      }

      const newPriceCents = Math.round(productInfo.price * 100);
      const oldPriceCents = item.currentPriceCents;

      if (newPriceCents !== oldPriceCents) {
        await this.wishlistRepository.updatePrice(item.id, newPriceCents);
        await this.wishlistRepository.addPriceHistory(item.id, newPriceCents, item.currency);

        const priceChange = (newPriceCents - oldPriceCents) / 100;
        const priceChangePercent = ((newPriceCents - oldPriceCents) / oldPriceCents) * 100;
        const targetReached = item.targetPriceCents ? newPriceCents <= item.targetPriceCents : false;

        return {
          wishlistItemId: item.id,
          itemName: item.name,
          oldPrice: oldPriceCents / 100,
          newPrice: newPriceCents / 100,
          priceChange,
          priceChangePercent,
          targetPrice: item.targetPriceCents ? item.targetPriceCents / 100 : undefined,
          targetReached,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to track single item ${itemId}`, error);
      throw error;
    }
  }

  async getPriceHistory(itemId: string, days = 30): Promise<any[]> {
    const history = await this.wishlistRepository.getPriceHistory(itemId, days);
    
    return history.map(entry => ({
      date: entry.recordedAt,
      price: entry.priceCents / 100,
      currency: entry.currency,
    }));
  }

  async getSignificantPriceAlerts(alerts: PriceAlert[]): Promise<PriceAlert[]> {
    // Filter for significant price changes (>5% change or target reached)
    return alerts.filter(alert => 
      Math.abs(alert.priceChangePercent) >= 5 || alert.targetReached
    );
  }

  async calculateSavingsOpportunity(itemId: string): Promise<{
    currentPrice: number;
    lowestPrice: number;
    highestPrice: number;
    averagePrice: number;
    potentialSavings: number;
    recommendedAction: 'BUY' | 'WAIT' | 'MONITOR';
  } | null> {
    try {
      const history = await this.wishlistRepository.getPriceHistory(itemId, 90); // 90 days
      
      if (history.length < 2) {
        return null;
      }

      const prices = history.map(h => h.priceCents / 100);
      const currentPrice = prices[0];
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      const potentialSavings = currentPrice - lowestPrice;
      const pricePosition = (currentPrice - lowestPrice) / (highestPrice - lowestPrice);
      
      let recommendedAction: 'BUY' | 'WAIT' | 'MONITOR' = 'MONITOR';
      
      if (pricePosition <= 0.2) {
        recommendedAction = 'BUY'; // Price is in bottom 20%
      } else if (pricePosition >= 0.8) {
        recommendedAction = 'WAIT'; // Price is in top 20%
      }

      return {
        currentPrice,
        lowestPrice,
        highestPrice,
        averagePrice,
        potentialSavings,
        recommendedAction,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate savings opportunity for item ${itemId}`, error);
      return null;
    }
  }
}
