'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  Edit,
  Trash2,
  Receipt,
  Tag,
  Calendar,
  CreditCard,
  Building,
  Sparkles,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Transaction, Category, AISuggestion } from '@/types/transaction';
import { cn } from '@/lib/utils';

interface TransactionDetailsProps {
  transaction: Transaction;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
  onCategorize?: (categoryId: string) => void;
  categories?: Category[];
  className?: string;
}

export function TransactionDetails({
  transaction,
  onEdit,
  onDelete,
  onClose,
  onCategorize,
  categories = [],
  className
}: TransactionDetailsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [aiSuggestions] = useState<AISuggestion[]>([
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
  ]);

  const formatCurrency = (amountCents: number, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
    }).format(amountCents / 100);
  };

  const getTransactionIcon = () => {
    if (transaction.transferAccountId) {
      return <ArrowRightLeft className="h-6 w-6 text-blue-600" />;
    }
    
    if (transaction.amountCents > 0) {
      return <ArrowDownLeft className="h-6 w-6 text-green-600" />;
    }
    
    return <ArrowUpRight className="h-6 w-6 text-red-600" />;
  };

  const getTransactionType = () => {
    if (transaction.transferAccountId) return 'Transfer';
    return transaction.amountCents > 0 ? 'Income' : 'Expense';
  };

  const getAmountColor = () => {
    if (transaction.transferAccountId) return 'text-blue-600';
    return transaction.amountCents > 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleCategorySelect = (categoryId: string) => {
    onCategorize?.(categoryId);
    setShowCategoryDialog(false);
  };

  const handleDeleteConfirm = () => {
    onDelete?.();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getTransactionIcon()}
              <div>
                <CardTitle className="text-xl">{transaction.description}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {getTransactionType()} • {format(new Date(transaction.date), 'PPP')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Amount */}
          <div className="text-center">
            <div className={cn("text-3xl font-bold", getAmountColor())}>
              {formatCurrency(Math.abs(transaction.amountCents), transaction.currency)}
            </div>
            {transaction.originalAmountCents && transaction.originalCurrency !== transaction.currency && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Original: {formatCurrency(transaction.originalAmountCents, transaction.originalCurrency)}
                {transaction.exchangeRate && (
                  <span className="ml-2">
                    (Rate: {transaction.exchangeRate.toFixed(4)})
                  </span>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Account Information */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {transaction.transferAccountId ? 'From Account' : 'Account'}
                </p>
                <p className="font-medium">{transaction.account.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {transaction.account.type} • {transaction.account.currency}
                </p>
              </div>
              {transaction.transferAccountId && transaction.transferAccount && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">To Account</p>
                  <p className="font-medium">{transaction.transferAccount.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {transaction.transferAccount.type} • {transaction.transferAccount.currency}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Category and Merchant */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categorization
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                {transaction.category ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: transaction.category.color }}
                    />
                    <span className="font-medium">{transaction.category.name}</span>
                    {onCategorize && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowCategoryDialog(true)}
                        className="ml-2"
                      >
                        Change
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Uncategorized</span>
                    {onCategorize && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowCategoryDialog(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Categorize
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {transaction.merchant && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Merchant</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{transaction.merchant}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {transaction.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {transaction.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag.tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Transaction Splits */}
          {transaction.splits.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium">Transaction Splits</h3>
                <div className="space-y-2">
                  {transaction.splits.map((split) => (
                    <div key={split.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: split.category.color }}
                        />
                        <div>
                          <p className="font-medium">{split.category.name}</p>
                          {split.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {split.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatCurrency(split.amountCents, transaction.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Receipt */}
          {transaction.receiptUrl && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Receipt
                </h3>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(transaction.receiptUrl, '_blank')}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Transaction Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Transaction Date</p>
                <p className="font-medium">{format(new Date(transaction.date), 'PPP')}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Created</p>
                <p className="font-medium">
                  {format(new Date(transaction.createdAt), 'PPP p')}
                </p>
              </div>
              {transaction.updatedAt !== transaction.createdAt && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Last Updated</p>
                  <p className="font-medium">
                    {format(new Date(transaction.updatedAt), 'PPP p')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-600 dark:text-gray-400">Transaction ID</p>
                <p className="font-mono text-xs">{transaction.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Selection Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Category</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    AI Suggestions
                  </span>
                </div>
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleCategorySelect(suggestion.categoryId)}
                    className="w-full text-left p-3 rounded-lg bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800"
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
                <Separator />
              </div>
            )}

            {/* All Categories */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
