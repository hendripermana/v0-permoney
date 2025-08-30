/**
 * Data Preview Step
 * Third step of the import wizard - preview and validate mapped data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  PermoneyCard,
  PermoneyCardHeader,
  PermoneyCardTitle,
  PermoneyCardContent,
  Button,
  Badge,
  Input,
  Checkbox,
} from '../index';
import {
  Eye,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImportedTransaction } from './types';

interface DataPreviewStepProps {
  transactions: ImportedTransaction[];
  onConfirm: (selectedTransactions: ImportedTransaction[]) => void;
  className?: string;
}

type FilterType = 'all' | 'income' | 'expense' | 'transfer';
type SortField = 'date' | 'amount' | 'description' | 'category';
type SortOrder = 'asc' | 'desc';

export function DataPreviewStep({
  transactions,
  onConfirm,
  className,
}: DataPreviewStepProps) {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set(transactions.map((_, index) => index.toString()))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showErrors, setShowErrors] = useState(true);

  // Validate transactions and identify issues
  const validatedTransactions = useMemo(() => {
    return transactions.map((transaction, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate date
      if (!transaction.date) {
        errors.push('Missing date');
      } else {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) {
          errors.push('Invalid date format');
        }
      }

      // Validate amount
      if (transaction.amount === undefined || transaction.amount === null) {
        errors.push('Missing amount');
      } else if (isNaN(Number(transaction.amount))) {
        errors.push('Invalid amount format');
      }

      // Validate description
      if (!transaction.description || transaction.description.trim() === '') {
        warnings.push('Missing description');
      }

      // Validate type
      if (
        transaction.type &&
        !['income', 'expense', 'transfer'].includes(transaction.type)
      ) {
        warnings.push('Unknown transaction type');
      }

      return {
        ...transaction,
        id: transaction.id || index.toString(),
        errors,
        warnings,
        isValid: errors.length === 0,
      };
    });
  }, [transactions]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = validatedTransactions;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        transaction =>
          transaction.description?.toLowerCase().includes(term) ||
          transaction.category?.toLowerCase().includes(term) ||
          transaction.account?.toLowerCase().includes(term) ||
          transaction.notes?.toLowerCase().includes(term)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(
        transaction => transaction.type === filterType
      );
    }

    // Apply error filter
    if (showErrors) {
      filtered = filtered.filter(transaction => transaction.errors.length > 0);
    }

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date || 0).getTime();
          bValue = new Date(b.date || 0).getTime();
          break;
        case 'amount':
          aValue = Number(a.amount) || 0;
          bValue = Number(b.amount) || 0;
          break;
        case 'description':
          aValue = a.description || '';
          bValue = b.description || '';
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [
    validatedTransactions,
    searchTerm,
    filterType,
    showErrors,
    sortField,
    sortOrder,
  ]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const selected = validatedTransactions.filter(t =>
      selectedTransactions.has(t.id!)
    );
    const valid = selected.filter(t => t.isValid);
    const invalid = selected.filter(t => !t.isValid);

    const totalIncome = selected
      .filter(
        t =>
          t.type === 'income' || (t.type !== 'expense' && Number(t.amount) > 0)
      )
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

    const totalExpenses = selected
      .filter(
        t =>
          t.type === 'expense' || (t.type !== 'income' && Number(t.amount) < 0)
      )
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

    const dateRange = selected.reduce(
      (range, t) => {
        const date = new Date(t.date || 0);
        if (isNaN(date.getTime())) return range;

        return {
          start: !range.start || date < range.start ? date : range.start,
          end: !range.end || date > range.end ? date : range.end,
        };
      },
      { start: null as Date | null, end: null as Date | null }
    );

    return {
      total: selected.length,
      valid: valid.length,
      invalid: invalid.length,
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      dateRange,
    };
  }, [validatedTransactions, selectedTransactions]);

  const toggleTransaction = useCallback((id: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedTransactions.size === validatedTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(validatedTransactions.map(t => t.id!)));
    }
  }, [selectedTransactions.size, validatedTransactions]);

  const handleConfirm = useCallback(() => {
    const selected = validatedTransactions
      .filter(t => selectedTransactions.has(t.id!) && t.isValid)
      .map(({ errors, warnings, isValid, ...transaction }) => transaction);

    onConfirm(selected);
  }, [validatedTransactions, selectedTransactions, onConfirm]);

  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString();
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PermoneyCard className="glassmorphism">
          <PermoneyCardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Transactions
                </p>
                <p className="text-xl font-bold text-foreground">
                  {summary.total}
                </p>
              </div>
            </div>
          </PermoneyCardContent>
        </PermoneyCard>

        <PermoneyCard className="glassmorphism">
          <PermoneyCardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-xl font-bold text-green-500">
                  {formatAmount(summary.totalIncome)}
                </p>
              </div>
            </div>
          </PermoneyCardContent>
        </PermoneyCard>

        <PermoneyCard className="glassmorphism">
          <PermoneyCardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold text-red-500">
                  {formatAmount(summary.totalExpenses)}
                </p>
              </div>
            </div>
          </PermoneyCardContent>
        </PermoneyCard>

        <PermoneyCard className="glassmorphism">
          <PermoneyCardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neon-green/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-neon-green" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Amount</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    summary.netAmount >= 0 ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {formatAmount(summary.netAmount)}
                </p>
              </div>
            </div>
          </PermoneyCardContent>
        </PermoneyCard>
      </div>

      {/* Validation Summary */}
      {summary.invalid > 0 && (
        <PermoneyCard className="border-orange-500/50 bg-orange-500/5">
          <PermoneyCardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-600">
                  {summary.invalid} transaction(s) have validation errors
                </p>
                <p className="text-xs text-orange-600/80">
                  These transactions will be skipped during import. Review and
                  fix errors if needed.
                </p>
              </div>
            </div>
          </PermoneyCardContent>
        </PermoneyCard>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            All
          </Button>
          <Button
            variant={filterType === 'income' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('income')}
          >
            Income
          </Button>
          <Button
            variant={filterType === 'expense' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('expense')}
          >
            Expenses
          </Button>

          <div className="flex items-center gap-2">
            <Checkbox
              id="show-errors"
              checked={showErrors}
              onCheckedChange={checked => setShowErrors(checked === true)}
            />
            <label
              htmlFor="show-errors"
              className="text-sm text-muted-foreground"
            >
              Show only errors
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="flex items-center gap-2"
          >
            <Checkbox
              checked={
                selectedTransactions.size === validatedTransactions.length
              }
              onCheckedChange={toggleAll}
            />
            Select All
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <PermoneyCard className="glassmorphism">
        <PermoneyCardHeader>
          <PermoneyCardTitle>Transaction Preview</PermoneyCardTitle>
        </PermoneyCardHeader>
        <PermoneyCardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 w-12">
                    <Checkbox
                      checked={
                        selectedTransactions.size ===
                        validatedTransactions.length
                      }
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTransactions.map(transaction => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border/50 hover:bg-accent/50"
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selectedTransactions.has(transaction.id!)}
                        onCheckedChange={() =>
                          toggleTransaction(transaction.id!)
                        }
                      />
                    </td>
                    <td className="p-3">
                      {formatDate(transaction.date || '')}
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {transaction.description || 'No description'}
                        </p>
                        {transaction.notes && (
                          <p className="text-xs text-muted-foreground">
                            {transaction.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'font-medium',
                          Number(transaction.amount) >= 0
                            ? 'text-green-500'
                            : 'text-red-500'
                        )}
                      >
                        {formatAmount(Number(transaction.amount) || 0)}
                      </span>
                    </td>
                    <td className="p-3">
                      {transaction.category && (
                        <Badge variant="secondary" className="text-xs">
                          {transaction.category}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {transaction.isValid ? (
                          <Badge
                            variant="default"
                            className="bg-green-500 text-white text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {transaction.errors.length} Error(s)
                          </Badge>
                        )}

                        {transaction.warnings.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {transaction.warnings.length} Warning(s)
                          </Badge>
                        )}
                      </div>

                      {(transaction.errors.length > 0 ||
                        transaction.warnings.length > 0) && (
                        <div className="mt-1 space-y-1">
                          {transaction.errors.map((error, index) => (
                            <p key={index} className="text-xs text-red-600">
                              • {error}
                            </p>
                          ))}
                          {transaction.warnings.map((warning, index) => (
                            <p key={index} className="text-xs text-orange-600">
                              • {warning}
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAndSortedTransactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No transactions match your filters
                </p>
              </div>
            )}
          </div>
        </PermoneyCardContent>
      </PermoneyCard>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedTransactions.size} of {validatedTransactions.length}{' '}
          transactions selected
          {summary.invalid > 0 && (
            <span className="text-orange-600 ml-2">
              ({summary.invalid} will be skipped due to errors)
            </span>
          )}
        </div>

        <Button
          onClick={handleConfirm}
          disabled={selectedTransactions.size === 0 || summary.valid === 0}
          className="bg-neon-green hover:bg-neon-green/90 text-white"
        >
          Import {summary.valid} Transaction(s)
        </Button>
      </div>
    </div>
  );
}
