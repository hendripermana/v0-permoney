import { z } from 'zod';

export const createTransactionSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200, 'Description must be less than 200 characters'),
  amountCents: z.number().min(1, 'Amount must be greater than 0'),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  merchant: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.string().optional(),
  recurringEndDate: z.string().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string().min(1, 'Transaction ID is required'),
});

export type CreateTransactionFormData = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionFormData = z.infer<typeof updateTransactionSchema>;
