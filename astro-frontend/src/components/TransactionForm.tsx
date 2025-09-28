import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

const transactionSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  householdId: string;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
}

export function TransactionForm({ householdId, onSubmit, onCancel }: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
  });

  const handleFormSubmit = async (data: TransactionFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const watchedAmount = watch('amount');

  return (
    <Card class="max-w-md mx-auto" padding="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} class="space-y-4">
        <div>
          <label htmlFor="amount" class="block text-sm font-medium mb-2">
            Amount
          </label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('amount', { valueAsNumber: true })}
            class={errors.amount ? 'border-destructive' : ''}
          />
          {errors.amount && (
            <p class="text-sm text-destructive mt-1">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" class="block text-sm font-medium mb-2">
            Description
          </label>
          <Input
            id="description"
            type="text"
            placeholder="Transaction description"
            {...register('description')}
            class={errors.description ? 'border-destructive' : ''}
          />
          {errors.description && (
            <p class="text-sm text-destructive mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="date" class="block text-sm font-medium mb-2">
            Date
          </label>
          <Input
            id="date"
            type="date"
            {...register('date')}
            class={errors.date ? 'border-destructive' : ''}
          />
          {errors.date && (
            <p class="text-sm text-destructive mt-1">{errors.date.message}</p>
          )}
        </div>

        <div class="flex gap-2 pt-4">
          <Button type="submit" disabled={isLoading} class="flex-1">
            {isLoading ? 'Adding...' : 'Add Transaction'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
