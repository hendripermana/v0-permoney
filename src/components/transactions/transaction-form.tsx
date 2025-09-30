'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plus, X, Sparkles, Receipt, Tag } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { CreateTransactionData, UpdateTransactionData, Account, Category, AISuggestion } from '@/types/transaction';
import { cn } from '@/lib/utils';

const transactionSchema = z.object({
  amountCents: z.number().min(1, 'Amount must be greater than 0'),
  currency: z.string().default('IDR'),
  originalAmountCents: z.number().optional(),
  originalCurrency: z.string().optional(),
  exchangeRate: z.number().optional(),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.string().optional(),
  merchant: z.string().optional(),
  date: z.date(),
  accountId: z.string().min(1, 'Account is required'),
  transferAccountId: z.string().optional(),
  receiptUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  splits: z.array(z.object({
    categoryId: z.string(),
    amountCents: z.number().min(1),
    description: z.string().optional(),
  })).default([]),
  isTransfer: z.boolean().default(false),
  enableSplits: z.boolean().default(false),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  initialData?: Partial<CreateTransactionData>;
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: CreateTransactionData | UpdateTransactionData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export function TransactionForm({
  initialData,
  accounts,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create'
}: TransactionFormProps) {
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [newTag, setNewTag] = useState('');

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amountCents: initialData?.amountCents || 0,
      currency: initialData?.currency || 'IDR',
      originalAmountCents: initialData?.originalAmountCents,
      originalCurrency: initialData?.originalCurrency,
      exchangeRate: initialData?.exchangeRate,
      description: initialData?.description || '',
      categoryId: initialData?.categoryId,
      merchant: initialData?.merchant,
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      accountId: initialData?.accountId || '',
      transferAccountId: initialData?.transferAccountId,
      receiptUrl: initialData?.receiptUrl,
      tags: initialData?.tags || [],
      splits: initialData?.splits || [],
      isTransfer: !!initialData?.transferAccountId,
      enableSplits: (initialData?.splits?.length || 0) > 0,
    },
  });

  const { fields: splitFields, append: appendSplit, remove: removeSplit } = useFieldArray({
    control: form.control,
    name: 'splits',
  });

  const watchedValues = form.watch();
  const isTransfer = watchedValues.isTransfer;
  const enableSplits = watchedValues.enableSplits;
  const description = watchedValues.description;
  const merchant = watchedValues.merchant;

  // Get AI suggestions when description or merchant changes
  useEffect(() => {
    if (description && description.length > 3) {
      // Mock AI suggestions - in real app, this would call the AI service
      const mockSuggestions: AISuggestion[] = [
        {
          categoryId: 'food-dining',
          categoryName: 'Food & Dining',
          confidence: 0.85,
          reason: 'Transaction description suggests food/restaurant'
        },
        {
          categoryId: 'groceries',
          categoryName: 'Groceries',
          confidence: 0.65,
          reason: 'Keywords match grocery shopping patterns'
        }
      ];
      setAiSuggestions(mockSuggestions);
      setShowAiSuggestions(true);
    } else {
      setAiSuggestions([]);
      setShowAiSuggestions(false);
    }
  }, [description, merchant]);

  // Calculate splits total
  const splitsTotal = splitFields.reduce((total, _, index) => {
    const splitAmount = form.getValues(`splits.${index}.amountCents`) || 0;
    return total + splitAmount;
  }, 0);

  const handleSubmit = (data: TransactionFormData) => {
    const submitData: CreateTransactionData | UpdateTransactionData = {
      amountCents: data.amountCents,
      currency: data.currency,
      originalAmountCents: data.originalAmountCents,
      originalCurrency: data.originalCurrency,
      exchangeRate: data.exchangeRate,
      description: data.description,
      categoryId: data.categoryId,
      merchant: data.merchant,
      date: data.date.toISOString(),
      accountId: data.accountId,
      transferAccountId: data.isTransfer ? data.transferAccountId : undefined,
      receiptUrl: data.receiptUrl,
      tags: data.tags,
      splits: data.enableSplits ? data.splits : undefined,
    };

    onSubmit(submitData);
  };

  const handleAiSuggestionSelect = (suggestion: AISuggestion) => {
    form.setValue('categoryId', suggestion.categoryId);
    setShowAiSuggestions(false);
  };

  const addTag = () => {
    if (newTag.trim() && !watchedValues.tags.includes(newTag.trim())) {
      const currentTags = form.getValues('tags');
      form.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const addSplit = () => {
    appendSplit({
      categoryId: '',
      amountCents: 0,
      description: '',
    });
  };

  const formatCurrency = (amountCents: number, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
    }).format(amountCents / 100);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Transaction Info */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount */}
            <FormField
              control={form.control}
              name="amountCents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value) * 100)}
                      value={field.value ? field.value / 100 : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Transaction description" {...field} />
                  </FormControl>
                  <FormMessage />
                  
                  {/* AI Suggestions */}
                  {showAiSuggestions && aiSuggestions.length > 0 && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          AI Category Suggestions
                        </span>
                      </div>
                      <div className="space-y-2">
                        {aiSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleAiSuggestionSelect(suggestion)}
                            className="w-full text-left p-2 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{suggestion.categoryName}</span>
                              <Badge variant="secondary">
                                {Math.round(suggestion.confidence * 100)}%
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {suggestion.reason}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Merchant */}
            <FormField
              control={form.control}
              name="merchant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Store or merchant name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Account Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transfer Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is-transfer"
                checked={isTransfer}
                onCheckedChange={(checked) => {
                  form.setValue('isTransfer', checked);
                  if (!checked) {
                    form.setValue('transferAccountId', undefined);
                  }
                }}
              />
              <Label htmlFor="is-transfer">This is a transfer between accounts</Label>
            </div>

            {/* From Account */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isTransfer ? 'From Account' : 'Account'}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* To Account (for transfers) */}
            {isTransfer && (
              <FormField
                control={form.control}
                name="transferAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts
                          .filter(account => account.id !== watchedValues.accountId)
                          .map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({account.currency})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Category and Tags */}
        {!isTransfer && (
          <Card>
            <CardHeader>
              <CardTitle>Categorization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                {watchedValues.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedValues.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction Splits */}
        {!isTransfer && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Split Transaction
                <Switch
                  checked={enableSplits}
                  onCheckedChange={(checked) => {
                    form.setValue('enableSplits', checked);
                    if (!checked) {
                      form.setValue('splits', []);
                    }
                  }}
                />
              </CardTitle>
            </CardHeader>
            {enableSplits && (
              <CardContent className="space-y-4">
                {splitFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Category</Label>
                      <Select
                        onValueChange={(value) => form.setValue(`splits.${index}.categoryId`, value)}
                        defaultValue={form.getValues(`splits.${index}.categoryId`)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        onChange={(e) => form.setValue(`splits.${index}.amountCents`, Number(e.target.value) * 100)}
                        value={form.getValues(`splits.${index}.amountCents`) ? form.getValues(`splits.${index}.amountCents`) / 100 : ''}
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Description (Optional)</Label>
                      <Input
                        placeholder="Split description"
                        {...form.register(`splits.${index}.description`)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSplit(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex justify-between items-center">
                  <Button type="button" onClick={addSplit} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Split
                  </Button>
                  
                  {splitFields.length > 0 && (
                    <div className="text-sm">
                      <span className={cn(
                        "font-medium",
                        splitsTotal === watchedValues.amountCents ? "text-green-600" : "text-red-600"
                      )}>
                        Splits Total: {formatCurrency(splitsTotal)}
                      </span>
                      <span className="text-gray-500 ml-2">
                        / {formatCurrency(watchedValues.amountCents)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Receipt */}
        <Card>
          <CardHeader>
            <CardTitle>Receipt (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="receiptUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Transaction' : 'Update Transaction'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
