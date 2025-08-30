import { 
  Transaction, 
  CreateTransactionData, 
  UpdateTransactionData, 
  TransactionFilters, 
  TransactionSearchParams, 
  PaginatedTransactions,
  TransactionStats,
  CategoryBreakdown,
  AISuggestion
} from '@/types/transaction';

const API_BASE = '/api/v1/transactions';

export const transactionApi = {
  // Create a new transaction
  async create(data: CreateTransactionData): Promise<Transaction> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create transaction');
    }

    return response.json();
  },

  // Get transactions with filters
  async getAll(filters: TransactionFilters = {}): Promise<PaginatedTransactions> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await fetch(`${API_BASE}?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch transactions');
    }

    return response.json();
  },

  // Search transactions
  async search(searchParams: TransactionSearchParams): Promise<PaginatedTransactions> {
    const params = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE}/search?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to search transactions');
    }

    return response.json();
  },

  // Get transaction by ID
  async getById(id: string): Promise<Transaction> {
    const response = await fetch(`${API_BASE}/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch transaction');
    }

    return response.json();
  },

  // Update transaction
  async update(id: string, data: UpdateTransactionData): Promise<Transaction> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update transaction');
    }

    return response.json();
  },

  // Delete transaction
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete transaction');
    }
  },

  // Update transaction splits
  async updateSplits(id: string, splits: Array<{
    categoryId: string;
    amountCents: number;
    description?: string;
  }>): Promise<Transaction> {
    const response = await fetch(`${API_BASE}/${id}/splits`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ splits }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update transaction splits');
    }

    return response.json();
  },

  // Categorize transaction
  async categorize(id: string, categoryId: string): Promise<Transaction> {
    const response = await fetch(`${API_BASE}/${id}/category`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to categorize transaction');
    }

    return response.json();
  },

  // Add tags to transaction
  async addTags(id: string, tags: string[]): Promise<Transaction> {
    const response = await fetch(`${API_BASE}/${id}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tags }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add tags');
    }

    return response.json();
  },

  // Remove tags from transaction
  async removeTags(id: string, tags: string[]): Promise<Transaction> {
    const response = await fetch(`${API_BASE}/${id}/tags`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tags }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove tags');
    }

    return response.json();
  },

  // Get transaction statistics
  async getStats(filters?: Partial<TransactionFilters>): Promise<TransactionStats> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await fetch(`${API_BASE}/stats?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch transaction stats');
    }

    return response.json();
  },

  // Get category breakdown
  async getCategoryBreakdown(filters?: Partial<TransactionFilters>): Promise<CategoryBreakdown[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await fetch(`${API_BASE}/category-breakdown?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch category breakdown');
    }

    return response.json();
  },

  // Get AI category suggestions (calls real service when available)
  async getAISuggestions(description: string, merchant?: string): Promise<AISuggestion[]> {
    try {
      const params = new URLSearchParams()
      if (description) params.append('description', description)
      if (merchant) params.append('merchant', merchant)
      // Prefer server-provided suggestions if exposed
      const res = await fetch(`/api/ai-insights/suggestions?${params.toString()}`)
      if (!res.ok) return []
      const json = await res.json()
      return (json?.suggestions || []) as AISuggestion[]
    } catch {
      // No mock fallbacks; return empty suggestions in absence of a live service
      return []
    }
  }
};
