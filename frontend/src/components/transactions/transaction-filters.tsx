'use client';

import { useState } from 'react';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

import { TransactionFilters, Account, Category } from '@/types/transaction';
import { cn } from '@/lib/utils';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  accounts: Account[];
  categories: Category[];
  onReset?: () => void;
  className?: string;
}

export function TransactionFiltersComponent({
  filters,
  onFiltersChange,
  accounts,
  categories,
  onReset,
  className
}: TransactionFiltersProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined
  );

  const updateFilter = (key: keyof TransactionFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    updateFilter('startDate', date?.toISOString());
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    updateFilter('endDate', date?.toISOString());
  };

  const handleReset = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    if (onReset) {
      onReset();
    } else {
      onFiltersChange({});
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.accountId) count++;
    if (filters.categoryId) count++;
    if (filters.type) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    if (filters.merchant) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account Filter */}
        <div className="space-y-2">
          <Label>Account</Label>
          <Select
            value={filters.accountId || ''}
            onValueChange={(value) => updateFilter('accountId', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={filters.categoryId || ''}
            onValueChange={(value) => updateFilter('categoryId', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
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

        {/* Transaction Type Filter */}
        <div className="space-y-2">
          <Label>Transaction Type</Label>
          <Select
            value={filters.type || ''}
            onValueChange={(value) => updateFilter('type', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Date Range */}
        <div className="space-y-4">
          <Label>Date Range</Label>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateChange}
                    disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <Separator />

        {/* Amount Range */}
        <div className="space-y-4">
          <Label>Amount Range</Label>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">Min Amount</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minAmount || ''}
                onChange={(e) => updateFilter('minAmount', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">Max Amount</Label>
              <Input
                type="number"
                placeholder="No limit"
                value={filters.maxAmount || ''}
                onChange={(e) => updateFilter('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Merchant Filter */}
        <div className="space-y-2">
          <Label>Merchant</Label>
          <Input
            placeholder="Search by merchant name"
            value={filters.merchant || ''}
            onChange={(e) => updateFilter('merchant', e.target.value || undefined)}
          />
        </div>

        {/* Currency Filter */}
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={filters.currency || ''}
            onValueChange={(value) => updateFilter('currency', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All currencies</SelectItem>
              <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Options */}
        <div className="space-y-4">
          <Label>Options</Label>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="include-transfers"
              checked={filters.includeTransfers !== false}
              onCheckedChange={(checked) => updateFilter('includeTransfers', checked)}
            />
            <Label htmlFor="include-transfers" className="text-sm">
              Include transfers
            </Label>
          </div>
        </div>

        <Separator />

        {/* Sort Options */}
        <div className="space-y-4">
          <Label>Sort By</Label>
          
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={filters.sortBy || 'date'}
              onValueChange={(value) => updateFilter('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="description">Description</SelectItem>
                <SelectItem value="merchant">Merchant</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortOrder || 'desc'}
              onValueChange={(value) => updateFilter('sortOrder', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
