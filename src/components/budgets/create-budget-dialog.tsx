'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BudgetPeriod, CreateBudgetDto } from '@/types/budget';
import { useCreateBudget, useCategories } from '@/hooks/use-budgets';
import { formatCurrency } from '@/lib/utils';
import { createBudgetSchema, CreateBudgetFormData } from '@/lib/validations/budget';

interface CreateBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBudgetDialog({ open, onOpenChange }: CreateBudgetDialogProps) {
  const { data: categories } = useCategories();
  const createBudget = useCreateBudget();

  const form = useForm<CreateBudgetFormData>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      name: '',
      period: BudgetPeriod.MONTHLY,
      startDate: '',
      endDate: '',
      categories: [{ categoryId: '', allocatedAmountCents: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'categories',
  });

  const generateEndDate = (startDate: string, period: BudgetPeriod): string => {
    const start = new Date(startDate);
    const end = new Date(start);

    switch (period) {
      case BudgetPeriod.WEEKLY:
        end.setDate(start.getDate() + 7);
        break;
      case BudgetPeriod.MONTHLY:
        end.setMonth(start.getMonth() + 1);
        break;
      case BudgetPeriod.YEARLY:
        end.setFullYear(start.getFullYear() + 1);
        break;
    }

    return end.toISOString().split('T')[0];
  };

  const onSubmit = async (data: CreateBudgetFormData) => {
    try {
      const budgetData: CreateBudgetDto = {
        ...data,
        categories: data.categories.filter(cat => cat.categoryId),
      };

      await createBudget.mutateAsync(budgetData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  const handlePeriodChange = (value: string) => {
    const period = value as BudgetPeriod;
    form.setValue('period', period);
    const startDate = form.getValues('startDate');
    if (startDate) {
      const endDate = generateEndDate(startDate, period);
      form.setValue('endDate', endDate);
    }
  };

  const handleStartDateChange = (startDate: string) => {
    form.setValue('startDate', startDate);
    const period = form.getValues('period');
    const endDate = generateEndDate(startDate, period);
    form.setValue('endDate', endDate);
  };

  const totalAllocated = form.watch('categories').reduce(
    (sum, cat) => sum + (cat.allocatedAmountCents || 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Budget</DialogTitle>
          <DialogDescription>
            Set up a budget to track your spending across different categories.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Monthly Expenses" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <Select onValueChange={handlePeriodChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={BudgetPeriod.WEEKLY}>Weekly</SelectItem>
                        <SelectItem value={BudgetPeriod.MONTHLY}>Monthly</SelectItem>
                        <SelectItem value={BudgetPeriod.YEARLY}>Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category Allocations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Category Allocations</span>
                  <div className="text-sm font-medium">
                    Total: {formatCurrency(totalAllocated, 'IDR')}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`categories.${index}.categoryId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.icon && <span className="mr-2">{category.icon}</span>}
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`categories.${index}.allocatedAmountCents`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount (IDR)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                value={field.value ? field.value / 100 : ''}
                                onChange={(e) => field.onChange(Number(e.target.value) * 100)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ categoryId: '', allocatedAmountCents: 0 })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createBudget.isPending}>
                {createBudget.isPending ? 'Creating...' : 'Create Budget'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
