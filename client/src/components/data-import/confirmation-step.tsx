/**
 * Confirmation Step
 * Final step of the import wizard - confirm import and show results
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  PermoneyCard,
  PermoneyCardHeader,
  PermoneyCardTitle,
  PermoneyCardContent,
  Button,
  Badge,
  Progress,
} from '../index';
import {
  CheckCircle,
  AlertTriangle,
  Download,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Database,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImportedTransaction, ImportSummary } from './types';

interface ConfirmationStepProps {
  transactions: ImportedTransaction[];
  onComplete: (summary: ImportSummary) => void;
  onStartOver: () => void;
  className?: string;
}

type ImportStatus = 'pending' | 'importing' | 'completed' | 'error';

export function ConfirmationStep({
  transactions,
  onComplete,
  onStartOver,
  className,
}: ConfirmationStepProps) {
  const [importStatus, setImportStatus] = useState<ImportStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null
  );

  // Calculate summary statistics
  const summary = React.useMemo(() => {
    const totalIncome = transactions
      .filter(
        t =>
          t.type === 'income' || (t.type !== 'expense' && Number(t.amount) > 0)
      )
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

    const totalExpenses = transactions
      .filter(
        t =>
          t.type === 'expense' || (t.type !== 'income' && Number(t.amount) < 0)
      )
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

    const categories = Array.from(
      new Set(transactions.map(t => t.category).filter(Boolean))
    );
    const accounts = Array.from(
      new Set(transactions.map(t => t.account).filter(Boolean))
    );

    const dateRange = transactions.reduce(
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
      total: transactions.length,
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      categories: categories.length,
      accounts: accounts.length,
      dateRange,
    };
  }, [transactions]);

  // Simulate import process
  const handleImport = useCallback(async () => {
    setImportStatus('importing');
    setProgress(0);
    setImportedCount(0);
    setErrorCount(0);

    // Extract categories and accounts for summary
    const categories = Array.from(
      new Set(transactions.map(t => t.category).filter(Boolean))
    ) as string[];
    const accounts = Array.from(
      new Set(transactions.map(t => t.account).filter(Boolean))
    ) as string[];

    try {
      // Simulate processing each transaction
      for (let i = 0; i < transactions.length; i++) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Simulate random errors (5% chance)
        const hasError = Math.random() < 0.05;

        if (hasError) {
          setErrorCount(prev => prev + 1);
        } else {
          setImportedCount(prev => prev + 1);
        }

        setProgress(((i + 1) / transactions.length) * 100);
      }

      // Create final summary
      const finalSummary: ImportSummary = {
        totalRows: transactions.length,
        successfulImports: importedCount,
        skippedRows: 0,
        errorRows: errorCount,
        duplicatesFound: 0,
        totalAmount: {
          income: summary.totalIncome,
          expenses: summary.totalExpenses,
          net: summary.netAmount,
        },
        dateRange: {
          start: summary.dateRange.start?.toISOString() || '',
          end: summary.dateRange.end?.toISOString() || '',
        },
        categoriesCreated: categories,
        accountsCreated: accounts,
      };

      setImportSummary(finalSummary);
      setImportStatus('completed');
      onComplete(finalSummary);
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus('error');
    }
  }, [transactions, summary, importedCount, errorCount, onComplete]);

  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  const formatDate = useCallback((date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString();
  }, []);

  const formatDuration = useCallback((ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }, []);

  if (importStatus === 'completed' && importSummary) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Import Completed Successfully!
            </h2>
            <p className="text-muted-foreground">
              {importSummary.successfulImports} transactions imported
              successfully
            </p>
          </div>
        </div>

        {/* Import Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PermoneyCard className="glassmorphism">
            <PermoneyCardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Imported</p>
                  <p className="text-xl font-bold text-green-500">
                    {importSummary.successfulImports}
                  </p>
                </div>
              </div>
            </PermoneyCardContent>
          </PermoneyCard>

          {importSummary.errorRows > 0 && (
            <PermoneyCard className="glassmorphism">
              <PermoneyCardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-xl font-bold text-red-500">
                      {importSummary.errorRows}
                    </p>
                  </div>
                </div>
              </PermoneyCardContent>
            </PermoneyCard>
          )}

          <PermoneyCard className="glassmorphism">
            <PermoneyCardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Amount</p>
                  <p
                    className={cn(
                      'text-xl font-bold',
                      importSummary.totalAmount.net >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    )}
                  >
                    {formatAmount(importSummary.totalAmount.net)}
                  </p>
                </div>
              </div>
            </PermoneyCardContent>
          </PermoneyCard>

          <PermoneyCard className="glassmorphism">
            <PermoneyCardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Range</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(new Date(importSummary.dateRange.start))} -{' '}
                    {formatDate(new Date(importSummary.dateRange.end))}
                  </p>
                </div>
              </div>
            </PermoneyCardContent>
          </PermoneyCard>
        </div>

        {/* Additional Details */}
        <PermoneyCard className="glassmorphism">
          <PermoneyCardHeader>
            <PermoneyCardTitle>Import Details</PermoneyCardTitle>
          </PermoneyCardHeader>
          <PermoneyCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Categories Created
                </p>
                <p className="text-2xl font-bold text-neon-green">
                  {importSummary.categoriesCreated.length}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Accounts Created
                </p>
                <p className="text-2xl font-bold text-neon-green">
                  {importSummary.accountsCreated.length}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Duplicates Found
                </p>
                <p className="text-2xl font-bold text-neon-green">
                  {importSummary.duplicatesFound}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Total Processed
                </p>
                <p className="text-sm text-muted-foreground">
                  {importSummary.totalRows} transactions
                </p>
              </div>
            </div>
          </PermoneyCardContent>
        </PermoneyCard>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={onStartOver}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Import More Data
          </Button>
          <Button
            onClick={() => (window.location.href = '/dashboard')}
            className="bg-neon-green hover:bg-neon-green/90 text-white flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (importStatus === 'error') {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Error Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Import Failed
            </h2>
            <p className="text-muted-foreground">
              An error occurred while importing your transactions. Please try
              again.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" onClick={onStartOver}>
            Start Over
          </Button>
          <Button
            onClick={handleImport}
            className="bg-neon-green hover:bg-neon-green/90 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (importStatus === 'importing') {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Import Progress */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Importing Transactions...
            </h2>
            <p className="text-muted-foreground">
              Please wait while we process your data
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <PermoneyCard className="glassmorphism">
          <PermoneyCardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600">{importedCount} imported</span>
                {errorCount > 0 && (
                  <span className="text-red-600">{errorCount} failed</span>
                )}
                <span className="text-muted-foreground">
                  {importedCount + errorCount} of {transactions.length}
                </span>
              </div>
            </div>
          </PermoneyCardContent>
        </PermoneyCard>
      </div>
    );
  }

  // Pending state - show confirmation
  return (
    <div className={cn('space-y-6', className)}>
      {/* Confirmation Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-neon-green/10 rounded-full flex items-center justify-center">
          <FileText className="h-8 w-8 text-neon-green" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Ready to Import
          </h2>
          <p className="text-muted-foreground">
            Review the summary below and confirm to start the import process
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PermoneyCard className="glassmorphism">
          <PermoneyCardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
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

      {/* Additional Details */}
      <PermoneyCard className="glassmorphism">
        <PermoneyCardHeader>
          <PermoneyCardTitle>Import Summary</PermoneyCardTitle>
        </PermoneyCardHeader>
        <PermoneyCardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Date Range</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(summary.dateRange.start)} to{' '}
                {formatDate(summary.dateRange.end)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Categories</p>
              <p className="text-sm text-muted-foreground">
                {summary.categories} unique categories
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Accounts</p>
              <p className="text-sm text-muted-foreground">
                {summary.accounts} accounts affected
              </p>
            </div>
          </div>
        </PermoneyCardContent>
      </PermoneyCard>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onStartOver}>
          Start Over
        </Button>

        <Button
          onClick={handleImport}
          className="bg-neon-green hover:bg-neon-green/90 text-white flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Start Import
        </Button>
      </div>
    </div>
  );
}
