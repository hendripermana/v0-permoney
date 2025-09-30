'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage, getTrendColor, getTrendDirection } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  PiggyBank,
  Target,
  CreditCard,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsGoal: number;
  currentSavings: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  // Trend data (percentage change from previous period)
  balanceChange: number;
  incomeChange: number;
  expenseChange: number;
  netWorthChange: number;
}

interface SummaryCardsProps {
  data: SummaryData;
  currency?: string;
  showTrends?: boolean;
}

function TrendIcon({ value, className }: { value: number; className?: string }) {
  // For change values, we compare against 0
  const direction = getTrendDirection(value, 0);
  
  if (direction === 'up') {
    return <TrendingUp className={cn('h-3 w-3', className)} />;
  } else if (direction === 'down') {
    return <TrendingDown className={cn('h-3 w-3', className)} />;
  }
  return <Minus className={cn('h-3 w-3', className)} />;
}

function TrendText({ value, prefix = '' }: { value: number; prefix?: string }) {
  const direction = getTrendDirection(value, 0);
  const color = getTrendColor(direction);
  const sign = direction === 'up' ? '+' : direction === 'down' ? '' : '';
  
  return (
    <span className={cn('text-xs', color)}>
      {sign}{formatPercentage(Math.abs(value))} {prefix}
    </span>
  );
}

export function SummaryCards({ data, currency = 'IDR', showTrends = true }: SummaryCardsProps) {
  const savingsProgress = data.savingsGoal > 0 
    ? (data.currentSavings / data.savingsGoal) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Net Worth */}
      <Card className="permoney-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.netWorth, currency)}
          </div>
          {showTrends && (
            <div className="flex items-center space-x-1 mt-1">
              <TrendIcon value={data.netWorthChange} />
              <TrendText value={data.netWorthChange} prefix="from last month" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Income */}
      <Card className="permoney-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(data.monthlyIncome, currency)}
          </div>
          {showTrends && (
            <div className="flex items-center space-x-1 mt-1">
              <TrendIcon value={data.incomeChange} />
              <TrendText value={data.incomeChange} prefix="from last month" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Expenses */}
      <Card className="permoney-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(data.monthlyExpenses, currency)}
          </div>
          {showTrends && (
            <div className="flex items-center space-x-1 mt-1">
              <TrendIcon value={data.expenseChange} />
              <TrendText value={data.expenseChange} prefix="from last month" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Savings Progress */}
      <Card className="permoney-card-green">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-black">Savings Goal</CardTitle>
          <Target className="h-4 w-4 text-black" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">
            {formatPercentage(savingsProgress)}
          </div>
          <p className="text-xs text-black/70 mt-1">
            {formatCurrency(data.currentSavings, currency)} of {formatCurrency(data.savingsGoal, currency)}
          </p>
          {/* Progress bar */}
          <div className="w-full bg-black/20 rounded-full h-2 mt-2">
            <div 
              className="bg-black h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(savingsProgress, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Total Assets */}
      <Card className="permoney-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.totalAssets, currency)}
          </div>
          {showTrends && (
            <div className="flex items-center space-x-1 mt-1">
              <TrendIcon value={data.balanceChange} />
              <TrendText value={data.balanceChange} prefix="from last month" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Liabilities */}
      <Card className="permoney-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(data.totalLiabilities, currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Debt obligations
          </p>
        </CardContent>
      </Card>

      {/* Monthly Savings */}
      <Card className="permoney-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.monthlyIncome - data.monthlyExpenses, currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Income - Expenses
          </p>
        </CardContent>
      </Card>

      {/* Savings Rate */}
      <Card className="permoney-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercentage(
              data.monthlyIncome > 0 
                ? ((data.monthlyIncome - data.monthlyExpenses) / data.monthlyIncome) * 100 
                : 0
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Of monthly income
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
