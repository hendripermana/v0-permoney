/**
 * TanStack Query hooks for Budgets
 * Standardized pattern following use-transactions-query.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { apiClient } from '@/lib/api-client';

export interface BudgetFilters {
  isActive?: boolean
  page?: number
  limit?: number
}

/**
 * Hook to fetch all budgets with filters
 */
export function useBudgets(filters?: BudgetFilters) {
  return useQuery({
    queryKey: queryKeys.budgets(filters),
    queryFn: () => apiClient.getBudgets(filters),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch single budget by ID
 */
export function useBudget(id: string) {
  return useQuery({
    queryKey: queryKeys.budget(id),
    queryFn: () => apiClient.getBudget(id),
    enabled: !!id,
  });
}

/**
 * Hook to create budget with automatic cache invalidation
 */
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
}

/**
 * Hook to update budget
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiClient.updateBudget(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets() });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
}

/**
 * Hook to delete budget
 */
export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
}
