/**
 * TanStack Query hooks for Accounts
 * Standardized pattern following use-transactions-query.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { apiClient } from '@/lib/api-client';

export interface AccountFilters {
  isActive?: boolean
  type?: string
  page?: number
  limit?: number
}

/**
 * Hook to fetch all accounts with filters
 */
export function useAccounts(filters?: AccountFilters) {
  return useQuery({
    queryKey: queryKeys.accounts(),
    queryFn: () => apiClient.getAccounts(filters),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch single account by ID
 */
export function useAccount(id: string) {
  return useQuery({
    queryKey: queryKeys.account(id),
    queryFn: () => apiClient.getAccount(id),
    enabled: !!id,
  });
}

/**
 * Hook to create account with automatic cache invalidation
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
}

/**
 * Hook to update account
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiClient.updateAccount(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.account(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
}

/**
 * Hook to delete account
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
}
