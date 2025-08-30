/**
 * Forms Demo Component
 * Showcases the Smart Forms & Multi-step Wizards implementation
 */

import React, { useState } from 'react';
import {
  TransactionForm,
  TransactionFormData,
  PermoneyCard,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './index';
import { Plus, Receipt, TrendingUp, ArrowLeftRight } from 'lucide-react';

export function FormsDemo() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<
    TransactionFormData[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTransactionSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add to recent transactions
      setRecentTransactions(prev => [data, ...prev.slice(0, 4)]);
      setShowTransactionForm(false);

      // Show success message (you could use a toast here)
      console.log('Transaction saved successfully:', data);
    } catch (error) {
      console.error('Failed to save transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (showTransactionForm) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setShowTransactionForm(false)}
              className="mb-4"
            >
              ← Back to Demo
            </Button>
            <h1 className="text-3xl font-bold mb-2">Add New Transaction</h1>
            <p className="text-muted-foreground">
              Experience our Smart Forms & Multi-step Wizards system
            </p>
          </div>

          <TransactionForm
            onSubmit={handleTransactionSubmit}
            onCancel={() => setShowTransactionForm(false)}
            className="w-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Smart Forms & Multi-step Wizards
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Experience our sophisticated form system with validation, auto-save,
            and step-by-step guidance
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="secondary">Multi-step Navigation</Badge>
            <Badge variant="secondary">Real-time Validation</Badge>
            <Badge variant="secondary">Auto-save</Badge>
            <Badge variant="secondary">Progress Tracking</Badge>
            <Badge variant="secondary">Responsive Design</Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <PermoneyCard
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setShowTransactionForm(true)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Plus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Add Transaction</h3>
                <p className="text-sm text-muted-foreground">
                  Record income or expense
                </p>
              </div>
            </div>
          </PermoneyCard>

          <PermoneyCard className="p-6 opacity-60">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Budget Setup</h3>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </div>
          </PermoneyCard>

          <PermoneyCard className="p-6 opacity-60">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <ArrowLeftRight className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Account Setup</h3>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </div>
          </PermoneyCard>
        </div>

        {/* Features Overview */}
        <Tabs defaultValue="features" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Key Features</TabsTrigger>
            <TabsTrigger value="demo">Live Demo</TabsTrigger>
            <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PermoneyCard className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-500" />
                  Multi-step Navigation
                </h3>
                <p className="text-muted-foreground mb-4">
                  Break complex forms into manageable steps with clear progress
                  indicators and validation at each stage.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Step-by-step guidance</li>
                  <li>• Progress visualization</li>
                  <li>• Conditional navigation</li>
                  <li>• Skip optional steps</li>
                </ul>
              </PermoneyCard>

              <PermoneyCard className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Smart Validation
                </h3>
                <p className="text-muted-foreground mb-4">
                  Real-time validation with Zod schemas ensures data integrity
                  and provides immediate feedback.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Real-time validation</li>
                  <li>• Custom error messages</li>
                  <li>• Field-level validation</li>
                  <li>• Async validation support</li>
                </ul>
              </PermoneyCard>

              <PermoneyCard className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-500" />
                  Auto-save & Recovery
                </h3>
                <p className="text-muted-foreground mb-4">
                  Never lose your progress with automatic saving and intelligent
                  data recovery.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Automatic data saving</li>
                  <li>• Session recovery</li>
                  <li>• Configurable intervals</li>
                  <li>• Local storage backup</li>
                </ul>
              </PermoneyCard>

              <PermoneyCard className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-orange-500" />
                  Responsive Design
                </h3>
                <p className="text-muted-foreground mb-4">
                  Optimized for all devices with touch-friendly controls and
                  adaptive layouts.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Mobile-first design</li>
                  <li>• Touch optimizations</li>
                  <li>• Adaptive layouts</li>
                  <li>• Accessibility features</li>
                </ul>
              </PermoneyCard>
            </div>
          </TabsContent>

          <TabsContent value="demo" className="mt-6">
            <PermoneyCard className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  Try the Transaction Form
                </h3>
                <p className="text-muted-foreground mb-6">
                  Experience our multi-step wizard with real-time validation,
                  auto-save, and progress tracking.
                </p>
                <Button
                  onClick={() => setShowTransactionForm(true)}
                  size="lg"
                  className="w-full"
                >
                  Start Demo
                </Button>
              </div>
            </PermoneyCard>
          </TabsContent>

          <TabsContent value="recent" className="mt-6">
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction, index) => (
                  <PermoneyCard key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            transaction.type === 'expense'
                              ? 'bg-red-100 dark:bg-red-900/20'
                              : 'bg-green-100 dark:bg-green-900/20'
                          }`}
                        >
                          <Receipt
                            className={`h-4 w-4 ${
                              transaction.type === 'expense'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}
                          />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {transaction.description}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {transaction.category} •{' '}
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            transaction.type === 'expense'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {transaction.type === 'expense' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                    {transaction.notes && (
                      <p className="text-sm text-muted-foreground mt-2 pl-11">
                        {transaction.notes}
                      </p>
                    )}
                    {transaction.tags && transaction.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 pl-11">
                        {transaction.tags.map((tag, tagIndex) => (
                          <Badge
                            key={tagIndex}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </PermoneyCard>
                ))}
              </div>
            ) : (
              <PermoneyCard className="p-8 text-center">
                <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-2">No transactions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Try the demo form to see your transactions appear here.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowTransactionForm(true)}
                >
                  Add Your First Transaction
                </Button>
              </PermoneyCard>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
