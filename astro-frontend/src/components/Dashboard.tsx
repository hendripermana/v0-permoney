import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { formatCurrency } from '../lib/utils';
import { api } from '../lib/api';

interface DashboardProps {
  householdId: string;
}

interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  transactionCount: number;
  recentTransactions: Array<{
    id: string;
    amount: number;
    description: string;
    date: string;
    categoryName: string;
  }>;
}

export function Dashboard({ householdId }: DashboardProps) {
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard', householdId],
    queryFn: () => api.analytics.dashboard(householdId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} class="animate-pulse">
            <div class="h-4 bg-muted rounded mb-2"></div>
            <div class="h-8 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card class="p-6 text-center">
        <p class="text-destructive">Failed to load dashboard data</p>
        <Button
          onClick={() => window.location.reload()}
          class="mt-4"
          variant="outline"
        >
          Retry
        </Button>
      </Card>
    );
  }

  if (!dashboardData) {
    return (
      <Card class="p-6 text-center">
        <p class="text-muted-foreground">No data available</p>
      </Card>
    );
  }

  const netIncome = dashboardData.monthlyIncome - dashboardData.monthlyExpenses;

  return (
    <div class="space-y-6">
      {/* Summary Cards */}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card class="p-6">
          <div class="flex items-center justify-between space-y-0 pb-2">
            <h3 class="text-sm font-medium">Total Balance</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              class="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20m10-10H2" />
            </svg>
          </div>
          <div class="text-2xl font-bold">
            {formatCurrency(dashboardData.totalBalance)}
          </div>
        </Card>

        <Card class="p-6">
          <div class="flex items-center justify-between space-y-0 pb-2">
            <h3 class="text-sm font-medium">Monthly Income</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              class="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20m10-10H2" />
            </svg>
          </div>
          <div class="text-2xl font-bold text-green-600">
            +{formatCurrency(dashboardData.monthlyIncome)}
          </div>
        </Card>

        <Card class="p-6">
          <div class="flex items-center justify-between space-y-0 pb-2">
            <h3 class="text-sm font-medium">Monthly Expenses</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              class="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20m10-10H2" />
            </svg>
          </div>
          <div class="text-2xl font-bold text-red-600">
            -{formatCurrency(dashboardData.monthlyExpenses)}
          </div>
        </Card>

        <Card class="p-6">
          <div class="flex items-center justify-between space-y-0 pb-2">
            <h3 class="text-sm font-medium">Net Income</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              class="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20m10-10H2" />
            </svg>
          </div>
          <div class={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netIncome >= 0 ? '+' : ''}{formatCurrency(netIncome)}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Recent Transactions</h3>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        <div class="space-y-3">
          {dashboardData.recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              class="flex items-center justify-between p-3 rounded-lg border"
            >
              <div class="flex-1">
                <p class="font-medium">{transaction.description}</p>
                <p class="text-sm text-muted-foreground">
                  {transaction.categoryName} • {new Date(transaction.date).toLocaleDateString()}
                </p>
              </div>
              <div class="text-right">
                <p class="font-medium">
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
