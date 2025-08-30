'use client';

import { useState, useMemo } from 'react';
import { Plus, Calendar, List, BarChart3, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

import { TransactionForm } from '@/components/transactions/transaction-form';
import { TransactionList } from '@/components/transactions/transaction-list';
import { TransactionFiltersComponent } from '@/components/transactions/transaction-filters';
import { TransactionCalendar } from '@/components/transactions/transaction-calendar';
import { TransactionDetails } from '@/components/transactions/transaction-details';

import { 
  useTransactions, 
  useCreateTransaction, 
  useUpdateTransaction, 
  useDeleteTransaction,
  useCategorizeTransaction,
  useTransactionStats,
  useTransactionCategoryBreakdown
} from '@/hooks/use-transactions';
import { Transaction, TransactionFilters, CreateTransactionData, UpdateTransactionData, Account, Category } from '@/types/transaction';

// Mock data - in real app, these would come from API calls
const mockAccounts: Account[] = [
  { id: '1', name: 'BCA Checking', type: 'ASSET', subtype: 'BANK', currency: 'IDR', balance: 5000000, isActive: true },
  { id: '2', name: 'Mandiri Savings', type: 'ASSET', subtype: 'BANK', currency: 'IDR', balance: 10000000, isActive: true },
  { id: '3', name: 'USD Account', type: 'ASSET', subtype: 'BANK', currency: 'USD', balance: 150000, isActive: true },
];

const mockCategories: Category[] = [
  { id: 'food-dining', name: 'Food & Dining', color: '#ef4444', icon: 'utensils' },
  { id: 'groceries', name: 'Groceries', color: '#22c55e', icon: 'shopping-cart' },
  { id: 'transportation', name: 'Transportation', color: '#3b82f6', icon: 'car' },
  { id: 'entertainment', name: 'Entertainment', color: '#a855f7', icon: 'film' },
  { id: 'utilities', name: 'Utilities', color: '#f59e0b', icon: 'zap' },
  { id: 'healthcare', name: 'Healthcare', color: '#ec4899', icon: 'heart' },
  { id: 'salary', name: 'Salary', color: '#10b981', icon: 'briefcase' },
  { id: 'freelance', name: 'Freelance', color: '#06b6d4', icon: 'laptop' },
];

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 50,
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // API hooks
  const { data: transactionsData, isLoading } = useTransactions(filters);
  const { data: stats } = useTransactionStats(filters);
  const { data: categoryBreakdown } = useTransactionCategoryBreakdown(filters);
  const createTransactionMutation = useCreateTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();
  const categorizeTransactionMutation = useCategorizeTransaction();

  const transactions = transactionsData?.transactions || [];

  // Filter active count
  const activeFiltersCount = useMemo(() => {
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
  }, [filters]);

  const handleCreateTransaction = (data: CreateTransactionData | UpdateTransactionData) => {
    createTransactionMutation.mutate(data as CreateTransactionData, {
      onSuccess: () => {
        setShowCreateDialog(false);
      },
    });
  };

  const handleUpdateTransaction = (data: UpdateTransactionData) => {
    if (!selectedTransaction) return;
    
    updateTransactionMutation.mutate(
      { id: selectedTransaction.id, data },
      {
        onSuccess: () => {
          setShowEditDialog(false);
          setSelectedTransaction(null);
        },
      }
    );
  };

  const handleDeleteTransaction = (transactionId: string) => {
    deleteTransactionMutation.mutate(transactionId);
  };

  const handleCategorizeTransaction = (categoryId: string) => {
    if (!selectedTransaction) return;
    
    categorizeTransactionMutation.mutate({
      id: selectedTransaction.id,
      categoryId,
    });
  };

  const handleTransactionEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowEditDialog(true);
  };

  const handleTransactionView = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsDialog(true);
  };

  const handleAddTransactionForDate = (date: Date) => {
    setSelectedDate(date);
    setShowCreateDialog(true);
  };

  const handleFiltersReset = () => {
    setFilters({
      page: 1,
      limit: 50,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const formatCurrency = (amount: number, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all your financial transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet open={showFiltersSheet} onOpenChange={setShowFiltersSheet}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-96">
              <SheetHeader>
                <SheetTitle>Transaction Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <TransactionFiltersComponent
                  filters={filters}
                  onFiltersChange={setFilters}
                  accounts={mockAccounts}
                  categories={mockCategories}
                  onReset={handleFiltersReset}
                />
              </div>
            </SheetContent>
          </Sheet>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalIncome)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalExpenses)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Net Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                stats.totalIncome - stats.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(stats.totalIncome - stats.totalExpenses)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <TransactionList
            transactions={transactions}
            isLoading={isLoading}
            onEdit={handleTransactionEdit}
            onDelete={handleDeleteTransaction}
            onView={handleTransactionView}
            filters={filters}
            onFiltersChange={setFilters}
            showFilters={false}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <TransactionCalendar
            transactions={transactions}
            onDateSelect={setSelectedDate}
            onTransactionClick={handleTransactionView}
            onAddTransaction={handleAddTransactionForDate}
            selectedDate={selectedDate}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            {categoryBreakdown && categoryBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryBreakdown.slice(0, 10).map((item) => (
                      <div key={item.categoryId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                          <span className="text-sm">{item.categoryName}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(item.totalAmount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional analytics cards can be added here */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Chart visualization would go here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Transaction Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            initialData={selectedDate ? { date: selectedDate.toISOString() } : undefined}
            accounts={mockAccounts}
            categories={mockCategories}
            onSubmit={handleCreateTransaction}
            onCancel={() => setShowCreateDialog(false)}
            isLoading={createTransactionMutation.isPending}
            mode="create"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <TransactionForm
              initialData={{
                amountCents: selectedTransaction.amountCents,
                currency: selectedTransaction.currency,
                originalAmountCents: selectedTransaction.originalAmountCents,
                originalCurrency: selectedTransaction.originalCurrency,
                exchangeRate: selectedTransaction.exchangeRate,
                description: selectedTransaction.description,
                categoryId: selectedTransaction.categoryId,
                merchant: selectedTransaction.merchant,
                date: selectedTransaction.date,
                accountId: selectedTransaction.accountId,
                transferAccountId: selectedTransaction.transferAccountId,
                receiptUrl: selectedTransaction.receiptUrl,
                tags: selectedTransaction.tags.map(t => t.tag),
                splits: selectedTransaction.splits.map(s => ({
                  categoryId: s.categoryId,
                  amountCents: s.amountCents,
                  description: s.description,
                })),
              }}
              accounts={mockAccounts}
              categories={mockCategories}
              onSubmit={handleUpdateTransaction}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedTransaction(null);
              }}
              isLoading={updateTransactionMutation.isPending}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTransaction && (
            <TransactionDetails
              transaction={selectedTransaction}
              onEdit={() => {
                setShowDetailsDialog(false);
                setShowEditDialog(true);
              }}
              onDelete={() => {
                handleDeleteTransaction(selectedTransaction.id);
                setShowDetailsDialog(false);
                setSelectedTransaction(null);
              }}
              onClose={() => {
                setShowDetailsDialog(false);
                setSelectedTransaction(null);
              }}
              onCategorize={handleCategorizeTransaction}
              categories={mockCategories}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
