import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi, goalApi, categoryApi } from '../lib/api/budgets';
import {
  Budget,
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetProgress,
  BudgetAlert,
  Goal,
  CreateGoalDto,
  UpdateGoalDto,
  GoalProgress
} from '../types/budget';
import { useToast } from './use-toast';

// Budget hooks
export function useBudgets(filters?: {
  period?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['budgets', filters],
    queryFn: () => budgetApi.getBudgets(filters),
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ['budget', id],
    queryFn: () => budgetApi.getBudgetById(id),
    enabled: !!id,
  });
}

export function useBudgetProgress(id: string) {
  return useQuery({
    queryKey: ['budget-progress', id],
    queryFn: () => budgetApi.getBudgetProgress(id),
    enabled: !!id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

export function useBudgetAlerts(id: string) {
  return useQuery({
    queryKey: ['budget-alerts', id],
    queryFn: () => budgetApi.getBudgetAlerts(id),
    enabled: !!id,
  });
}

export function useBudgetRecommendations() {
  return useQuery({
    queryKey: ['budget-recommendations'],
    queryFn: () => budgetApi.getBudgetRecommendations(),
  });
}

export function useBudgetAnalytics() {
  return useQuery({
    queryKey: ['budget-analytics'],
    queryFn: () => budgetApi.getBudgetAnalytics(),
  });
}

export function useSpendingPatterns(months?: number) {
  return useQuery({
    queryKey: ['spending-patterns', months],
    queryFn: () => budgetApi.getSpendingPatterns(months),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateBudgetDto) => budgetApi.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Budget Created',
        description: 'Your budget has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create budget.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetDto }) =>
      budgetApi.updateBudget(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      queryClient.invalidateQueries({ queryKey: ['budget-progress', id] });
      toast({
        title: 'Budget Updated',
        description: 'Your budget has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update budget.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => budgetApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Budget Deleted',
        description: 'Your budget has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete budget.',
        variant: 'destructive',
      });
    },
  });
}

export function useCarryOverBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => budgetApi.carryOverBudget(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      queryClient.invalidateQueries({ queryKey: ['budget-progress', id] });
      toast({
        title: 'Budget Carried Over',
        description: 'Unused budget amounts have been carried over to the next period.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to carry over budget.',
        variant: 'destructive',
      });
    },
  });
}

// Goal hooks
export function useGoals(filters?: {
  status?: string;
  priority?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ['goals', filters],
    queryFn: () => goalApi.getGoals(filters),
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: () => goalApi.getGoalById(id),
    enabled: !!id,
  });
}

export function useGoalProgress(id: string) {
  return useQuery({
    queryKey: ['goal-progress', id],
    queryFn: () => goalApi.getGoalProgress(id),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateGoalDto) => goalApi.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({
        title: 'Goal Created',
        description: 'Your goal has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create goal.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalDto }) =>
      goalApi.updateGoal(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', id] });
      queryClient.invalidateQueries({ queryKey: ['goal-progress', id] });
      toast({
        title: 'Goal Updated',
        description: 'Your goal has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update goal.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => goalApi.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({
        title: 'Goal Deleted',
        description: 'Your goal has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete goal.',
        variant: 'destructive',
      });
    },
  });
}

export function useAddGoalContribution() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      goalApi.addGoalContribution(id, amount),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', id] });
      queryClient.invalidateQueries({ queryKey: ['goal-progress', id] });
      toast({
        title: 'Contribution Added',
        description: 'Your contribution has been added to the goal.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add contribution.',
        variant: 'destructive',
      });
    },
  });
}

// Categories hook
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getCategories(),
  });
}
