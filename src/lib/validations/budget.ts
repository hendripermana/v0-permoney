import { z } from 'zod';
import { BudgetPeriod, GoalPriority } from '@/types/budget';

const baseBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(100, 'Budget name must be less than 100 characters'),
  period: z.nativeEnum(BudgetPeriod),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  categories: z.array(z.object({
    categoryId: z.string().min(1, 'Category is required'),
    allocatedAmountCents: z.number().min(1, 'Amount must be greater than 0'),
  })).min(1, 'At least one category is required'),
});

export const createBudgetSchema = baseBudgetSchema.refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const createGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100, 'Goal name must be less than 100 characters'),
  description: z.string().optional(),
  targetAmount: z.number().min(1, 'Target amount must be greater than 0'),
  targetDate: z.string().optional(),
  category: z.string().optional(),
  priority: z.nativeEnum(GoalPriority).default(GoalPriority.MEDIUM),
});

export const updateBudgetSchema = baseBudgetSchema.partial().extend({
  id: z.string().min(1, 'Budget ID is required'),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate > startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  id: z.string().min(1, 'Goal ID is required'),
});

export type CreateBudgetFormData = z.infer<typeof createBudgetSchema>;
export type CreateGoalFormData = z.infer<typeof createGoalSchema>;
export type UpdateBudgetFormData = z.infer<typeof updateBudgetSchema>;
export type UpdateGoalFormData = z.infer<typeof updateGoalSchema>;
