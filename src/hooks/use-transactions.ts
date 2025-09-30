import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '@/lib/api/transactions';
import { 
  CreateTransactionData, 
  UpdateTransactionData, 
  TransactionFilters, 
  TransactionSearchParams 
} from '@/types/transaction';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  search: (params: TransactionSearchParams) => [...transactionKeys.all, 'search', params] as const,
  stats: (filters?: Partial<TransactionFilters>) => [...transactionKeys.all, 'stats', filters] as const,
  categoryBreakdown: (filters?: Partial<TransactionFilters>) => [...transactionKeys.all, 'category-breakdown', filters] as const,
};

// Get transactions with filters
export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => transactionApi.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Search transactions
export function useTransactionSearch(searchParams: TransactionSearchParams) {
  return useQuery({
    queryKey: transactionKeys.search(searchParams),
    queryFn: () => transactionApi.search(searchParams),
    enabled: !!searchParams.query,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Get transaction by ID
export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionApi.getById(id),
    enabled: !!id,
  });
}

// Get transaction statistics
export function useTransactionStats(filters?: Partial<TransactionFilters>) {
  return useQuery({
    queryKey: transactionKeys.stats(filters),
    queryFn: () => transactionApi.getStats(filters),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Get category breakdown
export function useTransactionCategoryBreakdown(filters?: Partial<TransactionFilters>) {
  return useQuery({
    queryKey: transactionKeys.categoryBreakdown(filters),
    queryFn: () => transactionApi.getCategoryBreakdown(filters),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Create transaction mutation
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTransactionData) => transactionApi.create(data),
    onSuccess: (newTransaction) => {
      // Invalidate and refetch transaction lists
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.categoryBreakdown() });
      
      toast({
        title: 'Transaction created',
        description: `Successfully created transaction: ${newTransaction.description}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating transaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update transaction mutation
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionData }) => 
      transactionApi.update(id, data),
    onSuccess: (updatedTransaction) => {
      // Update the specific transaction in cache
      queryClient.setQueryData(
        transactionKeys.detail(updatedTransaction.id),
        updatedTransaction
      );
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.categoryBreakdown() });
      
      toast({
        title: 'Transaction updated',
        description: `Successfully updated transaction: ${updatedTransaction.description}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating transaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete transaction mutation
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => transactionApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: transactionKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.categoryBreakdown() });
      
      toast({
        title: 'Transaction deleted',
        description: 'Transaction has been successfully deleted',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting transaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Categorize transaction mutation
export function useCategorizeTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, categoryId }: { id: string; categoryId: string }) => 
      transactionApi.categorize(id, categoryId),
    onSuccess: (updatedTransaction) => {
      // Update the specific transaction in cache
      queryClient.setQueryData(
        transactionKeys.detail(updatedTransaction.id),
        updatedTransaction
      );
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.categoryBreakdown() });
      
      toast({
        title: 'Transaction categorized',
        description: `Transaction categorized as ${updatedTransaction.category?.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error categorizing transaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update transaction splits mutation
export function useUpdateTransactionSplits() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, splits }: { 
      id: string; 
      splits: Array<{
        categoryId: string;
        amountCents: number;
        description?: string;
      }> 
    }) => transactionApi.updateSplits(id, splits),
    onSuccess: (updatedTransaction) => {
      // Update the specific transaction in cache
      queryClient.setQueryData(
        transactionKeys.detail(updatedTransaction.id),
        updatedTransaction
      );
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.categoryBreakdown() });
      
      toast({
        title: 'Transaction splits updated',
        description: 'Transaction has been split across multiple categories',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating splits',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Add tags mutation
export function useAddTransactionTags() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) => 
      transactionApi.addTags(id, tags),
    onSuccess: (updatedTransaction) => {
      queryClient.setQueryData(
        transactionKeys.detail(updatedTransaction.id),
        updatedTransaction
      );
      
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      
      toast({
        title: 'Tags added',
        description: 'Tags have been added to the transaction',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding tags',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Remove tags mutation
export function useRemoveTransactionTags() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) => 
      transactionApi.removeTags(id, tags),
    onSuccess: (updatedTransaction) => {
      queryClient.setQueryData(
        transactionKeys.detail(updatedTransaction.id),
        updatedTransaction
      );
      
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      
      toast({
        title: 'Tags removed',
        description: 'Tags have been removed from the transaction',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing tags',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
