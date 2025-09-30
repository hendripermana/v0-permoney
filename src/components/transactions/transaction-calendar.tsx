'use client';

import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Transaction } from '@/types/transaction';
import { cn } from '@/lib/utils';

interface TransactionCalendarProps {
  transactions: Transaction[];
  onDateSelect?: (date: Date) => void;
  onTransactionClick?: (transaction: Transaction) => void;
  onAddTransaction?: (date: Date) => void;
  selectedDate?: Date;
  className?: string;
}

interface DayData {
  date: Date;
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export function TransactionCalendar({
  transactions,
  onDateSelect,
  onTransactionClick,
  onAddTransaction,
  selectedDate,
  className
}: TransactionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const formatCurrency = (amountCents: number, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountCents / 100);
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.transferAccountId) {
      return <ArrowRightLeft className="h-3 w-3 text-blue-600" />;
    }
    
    if (transaction.amountCents > 0) {
      return <ArrowDownLeft className="h-3 w-3 text-green-600" />;
    }
    
    return <ArrowUpRight className="h-3 w-3 text-red-600" />;
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    return days.map((date): DayData => {
      const dayTransactions = transactions.filter(transaction => 
        isSameDay(new Date(transaction.date), date)
      );

      let totalIncome = 0;
      let totalExpenses = 0;
      let totalTransfers = 0;

      dayTransactions.forEach(transaction => {
        if (transaction.transferAccountId) {
          totalTransfers++;
        } else if (transaction.amountCents > 0) {
          totalIncome += transaction.amountCents;
        } else {
          totalExpenses += Math.abs(transaction.amountCents);
        }
      });

      return {
        date,
        transactions: dayTransactions,
        totalIncome,
        totalExpenses,
        totalTransfers,
        isCurrentMonth: isSameMonth(date, currentMonth),
        isToday: isSameDay(date, new Date()),
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      };
    });
  }, [currentMonth, transactions, selectedDate]);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (dayData: DayData) => {
    onDateSelect?.(dayData.date);
  };

  const handleAddTransaction = (date: Date, event: React.MouseEvent) => {
    event.stopPropagation();
    onAddTransaction?.(date);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((dayData, index) => (
            <div
              key={index}
              className={cn(
                "min-h-[120px] p-1 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                !dayData.isCurrentMonth && "bg-gray-50 dark:bg-gray-900 text-gray-400",
                dayData.isToday && "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
                dayData.isSelected && "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700"
              )}
              onClick={() => handleDateClick(dayData)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium",
                  dayData.isToday && "text-blue-600 dark:text-blue-400"
                )}>
                  {format(dayData.date, 'd')}
                </span>
                {onAddTransaction && dayData.isCurrentMonth && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                    onClick={(e) => handleAddTransaction(dayData.date, e)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Transaction summary */}
              {dayData.transactions.length > 0 && (
                <div className="space-y-1">
                  {dayData.totalIncome > 0 && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      +{formatCurrency(dayData.totalIncome)}
                    </div>
                  )}
                  {dayData.totalExpenses > 0 && (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      -{formatCurrency(dayData.totalExpenses)}
                    </div>
                  )}
                  {dayData.totalTransfers > 0 && (
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      {dayData.totalTransfers} transfer{dayData.totalTransfers > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Transaction list (first few) */}
              <div className="space-y-1 mt-2">
                {dayData.transactions.slice(0, 3).map((transaction) => (
                  <Popover key={transaction.id}>
                    <PopoverTrigger asChild>
                      <div
                        className="flex items-center gap-1 p-1 rounded text-xs hover:bg-white dark:hover:bg-gray-700 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransactionClick?.(transaction);
                        }}
                      >
                        {getTransactionIcon(transaction)}
                        <span className="truncate flex-1">
                          {transaction.description}
                        </span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" side="right">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{transaction.description}</h4>
                          {getTransactionIcon(transaction)}
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {transaction.merchant && (
                            <div>Merchant: {transaction.merchant}</div>
                          )}
                          <div>Account: {transaction.account.name}</div>
                          {transaction.category && (
                            <div className="flex items-center gap-2">
                              Category: 
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: transaction.category.color }}
                                />
                                {transaction.category.name}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-lg font-medium">
                          {formatCurrency(Math.abs(transaction.amountCents), transaction.currency)}
                        </div>

                        {transaction.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {transaction.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag.tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}

                {dayData.transactions.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{dayData.transactions.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
