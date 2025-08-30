'use client';

import { useState } from 'react';
import { Plus, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBudgets, useGoals, useBudgetAnalytics } from '@/hooks/use-budgets';
import { BudgetList } from '@/components/budgets/budget-list';
import { GoalList } from '@/components/budgets/goal-list';
import { BudgetAnalytics } from '@/components/budgets/budget-analytics';
import { CreateBudgetDialog } from '@/components/budgets/create-budget-dialog';
import { CreateGoalDialog } from '@/components/budgets/create-goal-dialog-simple';
import { BudgetAlerts } from '@/components/budgets/budget-alerts';

export default function BudgetsPage() {
  const [createBudgetOpen, setCreateBudgetOpen] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);

  const { data: budgets, isLoading: budgetsLoading } = useBudgets({ isActive: true });
  const { data: goals, isLoading: goalsLoading } = useGoals({ status: 'ACTIVE' });
  const { data: analytics, isLoading: analyticsLoading } = useBudgetAnalytics();

  const activeBudgets = budgets?.filter(budget => budget.isActive) || [];
  const activeGoals = goals?.filter(goal => goal.status === 'ACTIVE') || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets & Goals</h1>
          <p className="text-muted-foreground">
            Manage your budgets and track your financial goals
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateGoalOpen(true)} variant="outline">
            <Target className="h-4 w-4 mr-2" />
            New Goal
          </Button>
          <Button onClick={() => setCreateBudgetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Budget
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBudgets.length}</div>
            <p className="text-xs text-muted-foreground">
              {budgets?.length || 0} total budgets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground">
              {goals?.length || 0} total goals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : `${Math.round(analytics?.averageUtilization || 0)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all budgets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* This would need to be calculated from all budget alerts */}
              0
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Alerts */}
      <BudgetAlerts />

      {/* Main Content Tabs */}
      <Tabs defaultValue="budgets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-4">
          <BudgetList budgets={budgets} isLoading={budgetsLoading} />
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <GoalList goals={goals} isLoading={goalsLoading} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <BudgetAnalytics analytics={analytics} isLoading={analyticsLoading} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateBudgetDialog 
        open={createBudgetOpen} 
        onOpenChange={setCreateBudgetOpen} 
      />
      <CreateGoalDialog 
        open={createGoalOpen} 
        onOpenChange={setCreateGoalOpen} 
      />
    </div>
  );
}
