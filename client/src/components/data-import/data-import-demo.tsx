/**
 * Data Import Demo
 * Comprehensive demonstration of the data import system
 */

import React, { useState } from 'react';
import {
  PermoneyCard,
  PermoneyCardHeader,
  PermoneyCardTitle,
  PermoneyCardContent,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../index';
import {
  Upload,
  FileText,
  Download,
  Database,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataImportWizard } from './data-import-wizard';
import type { ImportSummary } from './types';

interface DataImportDemoProps {
  className?: string;
}

// Mock recent imports data
const RECENT_IMPORTS = [
  {
    id: '1',
    fileName: 'mint_transactions_2024.csv',
    importedAt: '2024-01-15T10:30:00Z',
    transactionCount: 245,
    totalAmount: { income: 5420.5, expenses: 3210.75, net: 2209.75 },
    status: 'completed',
  },
  {
    id: '2',
    fileName: 'bank_export_december.ofx',
    importedAt: '2024-01-10T14:22:00Z',
    transactionCount: 89,
    totalAmount: { income: 2100.0, expenses: 1850.25, net: 249.75 },
    status: 'completed',
  },
  {
    id: '3',
    fileName: 'ynab_budget_export.csv',
    importedAt: '2024-01-08T09:15:00Z',
    transactionCount: 156,
    totalAmount: { income: 3200.0, expenses: 2890.5, net: 309.5 },
    status: 'completed',
  },
];

// Supported formats information
const SUPPORTED_FORMATS = [
  {
    category: 'Popular Apps',
    formats: [
      {
        name: 'Mint',
        description: 'Mint.com transaction exports',
        icon: '🌿',
        extension: '.csv',
      },
      {
        name: 'YNAB',
        description: 'You Need A Budget exports',
        icon: '💡',
        extension: '.csv',
      },
      {
        name: 'Quicken',
        description: 'Quicken financial software',
        icon: '🔢',
        extension: '.qif',
      },
      {
        name: 'Personal Capital',
        description: 'Personal Capital exports',
        icon: '💼',
        extension: '.csv',
      },
    ],
  },
  {
    category: 'Bank Formats',
    formats: [
      {
        name: 'OFX',
        description: 'Open Financial Exchange',
        icon: '🏦',
        extension: '.ofx',
      },
      {
        name: 'QIF',
        description: 'Quicken Interchange Format',
        icon: '💰',
        extension: '.qif',
      },
      {
        name: 'CSV',
        description: 'Comma-separated values',
        icon: '📊',
        extension: '.csv',
      },
    ],
  },
  {
    category: 'Spreadsheets',
    formats: [
      {
        name: 'Excel',
        description: 'Microsoft Excel files',
        icon: '📈',
        extension: '.xlsx',
      },
      {
        name: 'JSON',
        description: 'JavaScript Object Notation',
        icon: '📄',
        extension: '.json',
      },
    ],
  },
];

export function DataImportDemo({ className }: DataImportDemoProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [lastImportSummary, setLastImportSummary] =
    useState<ImportSummary | null>(null);

  const handleImportComplete = (summary: ImportSummary) => {
    setLastImportSummary(summary);
    setShowWizard(false);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (showWizard) {
    return (
      <div className={cn('min-h-screen bg-background', className)}>
        <DataImportWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={handleImportComplete}
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-neon-green/10 rounded-full flex items-center justify-center">
          <Database className="h-8 w-8 text-neon-green" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Data Import Center
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Import your financial data from other apps and services. We support
            popular formats and provide smart mapping to ensure your data is
            imported accurately.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => setShowWizard(true)}
          className="bg-neon-green hover:bg-neon-green/90 text-white flex items-center gap-2"
          size="lg"
        >
          <Upload className="h-5 w-5" />
          Import New Data
        </Button>
        <Button variant="outline" size="lg" className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download Sample Files
        </Button>
      </div>

      {/* Last Import Summary */}
      {lastImportSummary && (
        <PermoneyCard className="glassmorphism border-green-500/50 bg-green-500/5">
          <PermoneyCardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <PermoneyCardTitle className="text-green-600">
                  Import Completed Successfully!
                </PermoneyCardTitle>
                <p className="text-sm text-green-600/80">
                  {lastImportSummary.successfulImports} transactions imported
                </p>
              </div>
            </div>
          </PermoneyCardHeader>
          <PermoneyCardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {lastImportSummary.successfulImports}
                </p>
                <p className="text-sm text-muted-foreground">Imported</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-neon-green">
                  {formatAmount(lastImportSummary.totalAmount.net)}
                </p>
                <p className="text-sm text-muted-foreground">Net Amount</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {lastImportSummary.categoriesCreated.length}
                </p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">
                  {lastImportSummary.accountsCreated.length}
                </p>
                <p className="text-sm text-muted-foreground">Accounts</p>
              </div>
            </div>
          </PermoneyCardContent>
        </PermoneyCard>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="formats">Supported Formats</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PermoneyCard className="glassmorphism">
              <PermoneyCardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Smart Detection
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Automatically detects file formats and suggests field mappings
                  based on common patterns.
                </p>
              </PermoneyCardContent>
            </PermoneyCard>

            <PermoneyCard className="glassmorphism">
              <PermoneyCardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Data Validation
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Validates your data before import and highlights any issues
                  that need attention.
                </p>
              </PermoneyCardContent>
            </PermoneyCard>

            <PermoneyCard className="glassmorphism">
              <PermoneyCardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Database className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Bulk Import
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Import thousands of transactions at once with progress
                  tracking and error handling.
                </p>
              </PermoneyCardContent>
            </PermoneyCard>
          </div>

          {/* Import Process */}
          <PermoneyCard className="glassmorphism">
            <PermoneyCardHeader>
              <PermoneyCardTitle>How It Works</PermoneyCardTitle>
            </PermoneyCardHeader>
            <PermoneyCardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-blue-500" />
                  </div>
                  <h4 className="font-semibold text-foreground">
                    1. Upload File
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Select your financial data file from your computer or drag
                    and drop.
                  </p>
                </div>

                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-500" />
                  </div>
                  <h4 className="font-semibold text-foreground">
                    2. Map Fields
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Tell us which columns correspond to dates, amounts, and
                    descriptions.
                  </p>
                </div>

                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-purple-500" />
                  </div>
                  <h4 className="font-semibold text-foreground">
                    3. Preview Data
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Review how your transactions will look and fix any issues.
                  </p>
                </div>

                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-neon-green/10 rounded-full flex items-center justify-center">
                    <Database className="h-6 w-6 text-neon-green" />
                  </div>
                  <h4 className="font-semibold text-foreground">4. Import</h4>
                  <p className="text-sm text-muted-foreground">
                    Confirm the import and watch your transactions appear in
                    your account.
                  </p>
                </div>
              </div>
            </PermoneyCardContent>
          </PermoneyCard>
        </TabsContent>

        <TabsContent value="formats" className="space-y-6">
          {SUPPORTED_FORMATS.map(category => (
            <PermoneyCard key={category.category} className="glassmorphism">
              <PermoneyCardHeader>
                <PermoneyCardTitle>{category.category}</PermoneyCardTitle>
              </PermoneyCardHeader>
              <PermoneyCardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.formats.map(format => (
                    <div
                      key={format.name}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50"
                    >
                      <span className="text-2xl">{format.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">
                            {format.name}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {format.extension}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </PermoneyCardContent>
            </PermoneyCard>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PermoneyCard className="glassmorphism">
            <PermoneyCardHeader>
              <PermoneyCardTitle>Recent Imports</PermoneyCardTitle>
            </PermoneyCardHeader>
            <PermoneyCardContent>
              <div className="space-y-4">
                {RECENT_IMPORTS.map(importItem => (
                  <div
                    key={importItem.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <FileText className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {importItem.fileName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(importItem.importedAt)} •{' '}
                          {importItem.transactionCount} transactions
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={cn(
                          'font-medium',
                          importItem.totalAmount.net >= 0
                            ? 'text-green-500'
                            : 'text-red-500'
                        )}
                      >
                        {formatAmount(importItem.totalAmount.net)}
                      </p>
                      <Badge
                        variant="default"
                        className="bg-green-500 text-white text-xs"
                      >
                        Completed
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </PermoneyCardContent>
          </PermoneyCard>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <PermoneyCard className="glassmorphism border-blue-500/50 bg-blue-500/5">
        <PermoneyCardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">Need Help?</h3>
              <p className="text-blue-600/80 text-sm mb-3">
                If you're having trouble importing your data, check our help
                guide or contact support.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-500/50 text-blue-600"
                >
                  View Help Guide
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-500/50 text-blue-600"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </PermoneyCardContent>
      </PermoneyCard>
    </div>
  );
}
