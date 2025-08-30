'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react';
import { BudgetAnalytics as BudgetAnalyticsType } from '@/types/budget';
import { formatCurrency } from '@/lib/utils';

interface BudgetAnalyticsProps {
  analytics?: BudgetAnalyticsType;
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function BudgetAnalytics({ analytics, isLoading }: BudgetAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No analytics data</h3>
          <p className="text-muted-foreground text-center">
            Create some budgets and add transactions to see analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budgets</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBudgets}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeBudgets} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.averageUtilization)}%</div>
            <Progress value={analytics.averageUtilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {analytics.topSpendingCategories[0]?.categoryName || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.topSpendingCategories[0] && 
                `${Math.round(analytics.topSpendingCategories[0].utilizationPercentage)}% utilized`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recommendations.length}</div>
            <p className="text-xs text-muted-foreground">
              Available suggestions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Category Spending</CardTitle>
            <CardDescription>
              Budget utilization by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topSpendingCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="categoryName" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${Math.round(value)}%`,
                    'Utilization'
                  ]}
                />
                <Bar dataKey="utilizationPercentage" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spending Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
            <CardDescription>
              How your budget is allocated across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.topSpendingCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoryName, utilizationPercentage }) => 
                    `${categoryName}: ${Math.round(utilizationPercentage)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="budgetedAmount"
                >
                  {analytics.topSpendingCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    formatCurrency(value / 100, 'IDR'),
                    'Budgeted Amount'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Trends</CardTitle>
          <CardDescription>
            Monthly budget performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'utilizationPercentage' 
                    ? `${Math.round(value)}%`
                    : formatCurrency(value / 100, 'IDR'),
                  name === 'utilizationPercentage' ? 'Utilization' : 
                  name === 'totalBudgeted' ? 'Budgeted' : 'Spent'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="totalBudgeted" 
                stroke="#8884d8" 
                name="totalBudgeted"
              />
              <Line 
                type="monotone" 
                dataKey="totalSpent" 
                stroke="#82ca9d" 
                name="totalSpent"
              />
              <Line 
                type="monotone" 
                dataKey="utilizationPercentage" 
                stroke="#ffc658" 
                name="utilizationPercentage"
                yAxisId="right"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {analytics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Recommendations</CardTitle>
            <CardDescription>
              AI-powered suggestions to optimize your budget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{rec.categoryName}</div>
                  <div className="text-sm text-muted-foreground">{rec.reason}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {Math.round(rec.confidence * 100)}% confidence
                    </Badge>
                    {rec.potentialSavings && (
                      <Badge variant="secondary">
                        Save {formatCurrency(rec.potentialSavings / 100, 'IDR')}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-muted-foreground">Current</div>
                  <div className="font-medium">
                    {formatCurrency(rec.currentAllocation / 100, 'IDR')}
                  </div>
                  <div className="text-muted-foreground mt-1">Recommended</div>
                  <div className="font-medium text-green-600">
                    {formatCurrency(rec.recommendedAllocation / 100, 'IDR')}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
