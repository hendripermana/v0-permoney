import apiClient from "@/lib/api-client"
import type {
  WishlistItem,
  CreateWishlistItemRequest,
  UpdateWishlistItemRequest,
  PriceHistoryEntry,
  SavingsOpportunity,
  PriceAlert,
} from "@/types/wishlist"

const WISHLIST_BASE_PATH = "/wishlist"

const buildUrl = (path: string, params?: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
  }

  const queryString = searchParams.toString()
  return queryString ? `${path}?${queryString}` : path
}

export const wishlistApi = {
  async getWishlistItems(): Promise<WishlistItem[]> {
    return apiClient.request<WishlistItem[]>(WISHLIST_BASE_PATH)
  },

  async getWishlistItem(id: string): Promise<WishlistItem> {
    return apiClient.request<WishlistItem>(`${WISHLIST_BASE_PATH}/${id}`)
  },

  async createWishlistItem(data: CreateWishlistItemRequest): Promise<WishlistItem> {
    return apiClient.request<WishlistItem>(WISHLIST_BASE_PATH, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateWishlistItem(id: string, data: UpdateWishlistItemRequest): Promise<WishlistItem> {
    return apiClient.request<WishlistItem>(`${WISHLIST_BASE_PATH}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async deleteWishlistItem(id: string): Promise<void> {
    await apiClient.request<void>(`${WISHLIST_BASE_PATH}/${id}`, {
      method: "DELETE",
    })
  },

  async refreshPrice(id: string): Promise<{ item: WishlistItem; priceAlert: PriceAlert | null }> {
    return apiClient.request<{ item: WishlistItem; priceAlert: PriceAlert | null }>(
      `${WISHLIST_BASE_PATH}/${id}/refresh-price`,
      { method: "POST" }
    )
  },

  async getPriceHistory(id: string, days = 30): Promise<PriceHistoryEntry[]> {
    return apiClient.request<PriceHistoryEntry[]>(
      buildUrl(`${WISHLIST_BASE_PATH}/${id}/price-history`, { days })
    )
  },

  async getSavingsOpportunity(id: string): Promise<SavingsOpportunity | null> {
    return apiClient.request<SavingsOpportunity | null>(
      `${WISHLIST_BASE_PATH}/${id}/savings-opportunity`
    )
  },

  async linkToGoal(id: string, goalId: string): Promise<WishlistItem> {
    return apiClient.request<WishlistItem>(`${WISHLIST_BASE_PATH}/${id}/link-goal`, {
      method: "POST",
      body: JSON.stringify({ goalId }),
    })
  },

  async unlinkFromGoal(id: string): Promise<WishlistItem> {
    return apiClient.request<WishlistItem>(`${WISHLIST_BASE_PATH}/${id}/unlink-goal`, {
      method: "POST",
    })
  },

  async markAsPurchased(id: string): Promise<WishlistItem> {
    return apiClient.request<WishlistItem>(`${WISHLIST_BASE_PATH}/${id}/mark-purchased`, {
      method: "POST",
    })
  },

  async getWishlistByGoal(goalId: string): Promise<WishlistItem[]> {
    return apiClient.request<WishlistItem[]>(`${WISHLIST_BASE_PATH}/goal/${goalId}`)
  },
}
