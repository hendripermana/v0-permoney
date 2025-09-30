import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes
      staleTime: 1000 * 60 * 5,
      // 10 minutes
      gcTime: 1000 * 60 * 10,
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const statusError = error as { status: number };
          if (statusError.status >= 400 && statusError.status < 500) {
            return false;
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  all: ['permoney'] as const,
  
  // Auth
  auth: () => [...queryKeys.all, 'auth'] as const,
  currentUser: () => [...queryKeys.auth(), 'current-user'] as const,
  
  // Households
  households: () => [...queryKeys.all, 'households'] as const,
  household: (id: string) => [...queryKeys.households(), id] as const,
  householdMembers: (id: string) => [...queryKeys.household(id), 'members'] as const,
  
  // Accounts
  accounts: () => [...queryKeys.all, 'accounts'] as const,
  account: (id: string) => [...queryKeys.accounts(), id] as const,
  accountHistory: (id: string, period?: string) => 
    [...queryKeys.account(id), 'history', period] as const,
  
  // Transactions
  transactions: () => [...queryKeys.all, 'transactions'] as const,
  transaction: (id: string) => [...queryKeys.transactions(), id] as const,
  transactionsByAccount: (accountId: string) => 
    [...queryKeys.transactions(), 'by-account', accountId] as const,
  transactionStats: (filters?: any) => 
    [...queryKeys.transactions(), 'stats', filters] as const,
  transactionCategoryBreakdown: (filters?: any) => 
    [...queryKeys.transactions(), 'category-breakdown', filters] as const,
  
  // Dashboard
  dashboard: () => [...queryKeys.all, 'dashboard'] as const,
  dashboardSummary: (householdId: string, viewType: string) => 
    [...queryKeys.dashboard(), householdId, viewType] as const,
  
  // Analytics
  analytics: () => [...queryKeys.all, 'analytics'] as const,
  spendingAnalytics: (householdId: string, period: string) => 
    [...queryKeys.analytics(), 'spending', householdId, period] as const,
  netWorth: (householdId: string, period: string) => 
    [...queryKeys.analytics(), 'net-worth', householdId, period] as const,
} as const;
