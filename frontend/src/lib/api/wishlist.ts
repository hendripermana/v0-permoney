import { apiClient } from '../api';
import type {
  WishlistItem,
  CreateWishlistItemRequest,
  UpdateWishlistItemRequest,
  PriceHistoryEntry,
  SavingsOpportunity,
} from '@/types/wishlist';

export const wishlistApi = {
  // Get all wishlist items for the household
  getWishlistItems: async (): Promise<WishlistItem[]> => {
    return apiClient['request']('/wishlist');
  },

  // Get a specific wishlist item
  getWishlistItem: async (id: string): Promise<WishlistItem> => {
    return apiClient['request'](`/wishlist/${id}`);
  },

  // Create a new wishlist item
  createWishlistItem: async (data: CreateWishlistItemRequest): Promise<WishlistItem> => {
    return apiClient['request']('/wishlist', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a wishlist item
  updateWishlistItem: async (id: string, data: UpdateWishlistItemRequest): Promise<WishlistItem> => {
    return apiClient['request'](`/wishlist/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete a wishlist item
  deleteWishlistItem: async (id: string): Promise<void> => {
    await apiClient['request'](`/wishlist/${id}`, {
      method: 'DELETE',
    });
  },

  // Refresh price for a specific item
  refreshPrice: async (id: string): Promise<{ item: WishlistItem; priceAlert: any }> => {
    return apiClient['request'](`/wishlist/${id}/refresh-price`, {
      method: 'POST',
    });
  },

  // Get price history for an item
  getPriceHistory: async (id: string, days = 30): Promise<PriceHistoryEntry[]> => {
    return apiClient['request'](`/wishlist/${id}/price-history?days=${days}`);
  },

  // Get savings opportunity analysis
  getSavingsOpportunity: async (id: string): Promise<SavingsOpportunity | null> => {
    return apiClient['request'](`/wishlist/${id}/savings-opportunity`);
  },

  // Link item to a goal
  linkToGoal: async (id: string, goalId: string): Promise<WishlistItem> => {
    return apiClient['request'](`/wishlist/${id}/link-goal`, {
      method: 'POST',
      body: JSON.stringify({ goalId }),
    });
  },

  // Unlink item from goal
  unlinkFromGoal: async (id: string): Promise<WishlistItem> => {
    return apiClient['request'](`/wishlist/${id}/unlink-goal`, {
      method: 'POST',
    });
  },

  // Mark item as purchased
  markAsPurchased: async (id: string): Promise<WishlistItem> => {
    return apiClient['request'](`/wishlist/${id}/mark-purchased`, {
      method: 'POST',
    });
  },

  // Get wishlist items by goal
  getWishlistByGoal: async (goalId: string): Promise<WishlistItem[]> => {
    return apiClient['request'](`/wishlist/goal/${goalId}`);
  },
};
