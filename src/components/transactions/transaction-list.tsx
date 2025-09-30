'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  Receipt,
  Tag,
  Filter,
  Search,
  Calendar,
  DollarSign
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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

import { Transaction, TransactionFilters } from '@/types/transaction';
import { cn } from '@/lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
  onView?: (transaction: Transaction) => void;
  filters?: TransactionFilters;
  onFiltersChange?: (filters: TransactionFilters) => void;
  showFilters?: boolean;
}

export function TransactionList({
  transactions,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
  filters = {},
  onFiltersChange,
  showFilters = true
}: TransactionListProps) {
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(filters.merchant || '');

  const formatCurrency = (amountCents: number, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
    }).format(amountCents / 100);
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.transferAccountId) {
      return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
    }
    
    if (transaction.amountCents > 0) {
      return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
    }
    
    return <ArrowUpRight className="h-4 w-4 text-red-600" />;
  };

  const getTransactionType = (transaction: Transaction) => {
    if (transaction.transferAccountId) return 'Transfer';
    return transaction.amountCents > 0 ? 'Income' : 'Expense';
  };

  const getAmountColor = (transaction: Transaction) => {
    if (transaction.transferAccountId) return 'text-blue-600';
    return transaction.amountCents > 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        merchant: query || undefined,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTransactionId && onDelete) {
      onDelete(deleteTransactionId);
      setDeleteTransactionId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <div className="flex items-center gap-2">
              {showFilters && (
                <>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No transactions found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Start by adding your first transaction.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onView?.(transaction)}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {getTransactionIcon(transaction)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{transaction.description}</div>
                          {transaction.merchant && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.merchant}
                            </div>
                          )}
                          {transaction.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {transaction.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag.tag}
                                </Badge>
                              ))}
                              {transaction.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{transaction.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{transaction.account.name}</div>
                          {transaction.transferAccountId && transaction.transferAccount && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              → {transaction.transferAccount.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {transaction.category ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: transaction.category.color }}
                            />
                            <span className="text-sm">{transaction.category.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.transferAccountId ? 'Transfer' : 'Uncategorized'}
                          </span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(transaction.createdAt), 'HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div className={cn("font-medium", getAmountColor(transaction))}>
                            {formatCurrency(Math.abs(transaction.amountCents), transaction.currency)}
                          </div>
                          {transaction.originalAmountCents && transaction.originalCurrency !== transaction.currency && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatCurrency(transaction.originalAmountCents, transaction.originalCurrency)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onView?.(transaction);
                            }}>
                              View Details
                            </DropdownMenuItem>
                            {onEdit && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onEdit(transaction);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {transaction.receiptUrl && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                window.open(transaction.receiptUrl, '_blank');
                              }}>
                                <Receipt className="h-4 w-4 mr-2" />
                                View Receipt
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTransactionId(transaction.id);
                                }}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTransactionId} onOpenChange={() => setDeleteTransactionId(null)}>
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
