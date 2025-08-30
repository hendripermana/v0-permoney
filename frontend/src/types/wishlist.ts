export interface WishlistItem {
  id: string;
  name: string;
  url: string;
  currentPrice: number;
  targetPrice?: number;
  currency: string;
  imageUrl?: string;
  merchant: string;
  linkedGoalId?: string;
  isPurchased: boolean;
  createdBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  priceHistory: PriceHistoryEntry[];
  latestPrice: PriceHistoryEntry | null;
}

export interface PriceHistoryEntry {
  date: string;
  price: number;
  currency: string;
}

export interface CreateWishlistItemRequest {
  name: string;
  url: string;
  targetPrice?: number;
  currency?: string;
  linkedGoalId?: string;
}

export interface UpdateWishlistItemRequest {
  name?: string;
  url?: string;
  targetPrice?: number;
  currency?: string;
  linkedGoalId?: string;
  isPurchased?: boolean;
}

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

export interface SavingsOpportunity {
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  potentialSavings: number;
  recommendedAction: 'BUY' | 'WAIT' | 'MONITOR';
}
