/**
 * Example TanStack Query hooks for Transactions
 * 
 * These hooks demonstrate how to use TanStack Query v5 with our new API routes.
 * Follow this pattern for all other features (accounts, budgets, etc.)
 */

import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

// Types (should match your service types)
interface Transaction {
  id: string;
  description: string;
  amountCents: number;
  date: Date;
  // ... other fields
}

interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// API client functions
const transactionApi = {
  async getAll(filters?: TransactionFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    const res = await fetch(`/api/transactions?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async getById(id: string) {
    const res = await fetch(`/api/transactions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch transaction');
    return res.json();
  },

  async create(data: any) {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create transaction');
    return res.json();
  },

  async update(id: string, data: any) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transaction');
    return res.json();
  },

  async delete(id: string) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
  },

  async getStats(filters?: Partial<TransactionFilters>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    const res = await fetch(`/api/transactions/stats?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch transaction stats');
    return res.json();
  },
};

/**
 * Hook to fetch all transactions with filters
 */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: () => transactionApi.getAll(filters),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch single transaction by ID
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: () => transactionApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch transaction statistics
 */
export function useTransactionStats(filters?: Partial<TransactionFilters>) {
  return useQuery({
    queryKey: queryKeys.transactionStats(filters),
    queryFn: () => transactionApi.getStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create transaction with automatic cache invalidation
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionApi.create,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets() });
    },
  });
}

/**
 * Hook to update transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      transactionApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transaction(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
}

/**
 * Hook to delete transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
}

/**
 * Example: Parallel queries for dashboard data
 */
export function useDashboardTransactionData() {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.transactions({ limit: 10 }),
        queryFn: () => transactionApi.getAll({ limit: 10 }),
      },
      {
        queryKey: queryKeys.transactionStats(),
        queryFn: () => transactionApi.getStats(),
      },
    ],
  });

  return {
    transactions: results[0],
    stats: results[1],
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
  };
}
