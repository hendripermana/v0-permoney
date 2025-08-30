"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SpendingPatternsChart } from "@/components/charts/spending-patterns-chart"
import { BudgetProgressChart } from "@/components/charts/budget-progress-chart"
import { NetWorthChart } from "@/components/charts/net-worth-chart"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Loader2,
  AlertCircle,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
} from "lucide-react"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { toast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [chartPeriod, setChartPeriod] = useState("30d")
  const { data, loading, error, refetch } = useDashboardData()

  const handleCategoryClick = (category: string) => {
    toast({
      title: "Category Selected",
      description: `Viewing details for ${category}`,
    })
  }

  const handlePeriodChange = (period: string) => {
    setChartPeriod(period)
    // In a real app, this would trigger a data refetch
  }

  const formatCurrency = (amount: number) => {
    const actualAmount = amount > 1000000 ? amount / 100 : amount
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(actualAmount)
  }

  const accountSummary = data
    ? {
        totalBalance: data.netWorth?.totalAssets || 0,
        monthlyIncome:
          data.transactions?.filter((t) => t.amountCents > 0).reduce((sum, t) => sum + t.amountCents, 0) || 0,
        monthlyExpenses:
          Math.abs(data.transactions?.filter((t) => t.amountCents < 0).reduce((sum, t) => sum + t.amountCents, 0)) || 0,
        savings: data.netWorth?.netWorth || 0,
      }
    : {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        savings: 0,
      }

  const recentTransactions =
    data?.transactions?.slice(0, 5).map((transaction) => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amountCents / 100, // Convert from cents
      type: transaction.amountCents > 0 ? "income" : "expense",
      date: new Date(transaction.date).toLocaleDateString("id-ID"),
      category: transaction.category?.name || "Uncategorized",
    })) || []

  const budgets =
    data?.budgets?.flatMap(
      (budget) =>
        budget.categories?.map((category: any) => ({
          category: category.category?.name || "Unknown",
          spent: category.spentAmountCents || 0,
          budget: category.allocatedAmountCents || 0,
          color: "bg-green-500",
        })) || [],
    ) || []

  // Prepare chart data
  const spendingData = recentTransactions
    .filter(t => t.type === "expense")
    .reduce((acc: any[], transaction) => {
      const existing = acc.find(item => item.category === transaction.category)
      if (existing) {
        existing.amount += Math.abs(transaction.amount)
        existing.transactions += 1
      } else {
        acc.push({
          category: transaction.category,
          amount: Math.abs(transaction.amount),
          transactions: 1,
          trend: "stable" as const,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        })
      }
      return acc
    }, [])
    .map((item, index, array) => ({
      ...item,
      percentage: array.reduce((sum, i) => sum + i.amount, 0) > 0 
        ? (item.amount / array.reduce((sum, i) => sum + i.amount, 0)) * 100 
        : 0
    }))
    .sort((a, b) => b.amount - a.amount)

  const budgetData = budgets.map((budget) => ({
    category: budget.category,
    budgeted: budget.budget / 100,
    spent: budget.spent / 100,
    remaining: (budget.budget - budget.spent) / 100,
    percentage: budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0,
    status: budget.budget > 0 
      ? (budget.spent / budget.budget) > 1 
        ? "over-budget" as const
        : (budget.spent / budget.budget) > 0.8 
          ? "warning" as const 
          : "on-track" as const
      : "on-track" as const,
    transactions: Math.floor(Math.random() * 20) + 1, // Mock data
  }))

  // Mock net worth data - in real app this would come from API
  const netWorthData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    const baseNetWorth = accountSummary.savings
    const variation = (Math.random() - 0.5) * 0.1 * baseNetWorth
    const netWorth = baseNetWorth + variation
    return {
      date: date.toISOString(),
      assets: netWorth + Math.random() * 1000000,
      liabilities: Math.random() * 500000,
      netWorth: netWorth,
      change: i > 0 ? variation : 0,
      changePercentage: i > 0 ? (variation / baseNetWorth) * 100 : 0,
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading dashboard data...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <CardTitle>Error Loading Dashboard</CardTitle>
                </div>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={refetch} className="w-full">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Financial Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("week")}
            >
              Week
            </Button>
            <Button
              variant={selectedPeriod === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("month")}
            >
              Month
            </Button>
            <Button
              variant={selectedPeriod === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("year")}
            >
              Year
            </Button>
          </div>
        </div>

        {/* Account Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(accountSummary.totalBalance)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                {data?.accountStats?.activeAccounts || 0} active accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(accountSummary.monthlyIncome)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                From recent transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(accountSummary.monthlyExpenses)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingDown className="inline h-3 w-3 mr-1" />
                From recent transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              <PiggyBank className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(accountSummary.savings)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Assets minus liabilities
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activities</CardDescription>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent transactions found</p>
                  <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first transaction
                  </Button>
                </div>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === "income"
                            ? "bg-green-100 text-green-600"
                            : transaction.type === "expense"
                              ? "bg-red-100 text-red-600"
                              : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : transaction.type === "expense" ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : (
                          <Target className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.category}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Budget Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Budget Overview</CardTitle>
                <CardDescription>Track your spending against budgets</CardDescription>
              </div>
              <Button size="sm" variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Manage Budgets
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {budgets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No budgets set up yet</p>
                  <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                    <Target className="h-4 w-4 mr-2" />
                    Create your first budget
                  </Button>
                </div>
              ) : (
                budgets.slice(0, 4).map((budget, index) => {
                  const percentage = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{budget.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between items-center">
                        <Badge variant={percentage > 80 ? "destructive" : percentage > 60 ? "default" : "secondary"}>
                          {percentage.toFixed(1)}% used
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(Math.max(0, budget.budget - budget.spent))} remaining
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Analytics Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Financial Analytics</h2>
              <p className="text-muted-foreground">Detailed insights into your financial patterns</p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="spending">Spending</TabsTrigger>
              <TabsTrigger value="budgets">Budgets</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SpendingPatternsChart
                  data={spendingData}
                  period={chartPeriod as any}
                  onPeriodChange={handlePeriodChange}
                  loading={loading}
                />
                <NetWorthChart
                  data={netWorthData}
                  period={chartPeriod as any}
                  onPeriodChange={handlePeriodChange}
                  loading={loading}
                  showBreakdown={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="spending" className="space-y-6">
              <SpendingPatternsChart
                data={spendingData}
                period={chartPeriod as any}
                onPeriodChange={handlePeriodChange}
                loading={loading}
                className="col-span-full"
              />
              
              {/* Top Spending Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Top Spending Categories
                  </CardTitle>
                  <CardDescription>Your highest expense categories this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {spendingData.slice(0, 5).map((item, index) => (
                      <div key={item.category} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{item.category}</p>
                            <p className="text-sm text-muted-foreground">{item.transactions} transactions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.amount)}</p>
                          <Badge variant="secondary" className="text-xs">
                            {item.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budgets" className="space-y-6">
              <BudgetProgressChart
                data={budgetData}
                period={selectedPeriod}
                loading={loading}
                onCategoryClick={handleCategoryClick}
              />
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <NetWorthChart
                  data={netWorthData}
                  period={chartPeriod as any}
                  onPeriodChange={handlePeriodChange}
                  loading={loading}
                  showBreakdown={true}
                  className="col-span-full"
                />
                
                {/* Financial Health Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Financial Health Score
                    </CardTitle>
                    <CardDescription>Overall assessment of your financial wellness</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">85</div>
                        <p className="text-sm font-medium">Health Score</p>
                        <p className="text-xs text-muted-foreground">Excellent</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {budgetData.filter(b => b.status === "on-track").length}
                        </div>
                        <p className="text-sm font-medium">Budgets On Track</p>
                        <p className="text-xs text-muted-foreground">of {budgetData.length} total</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                          {((accountSummary.monthlyIncome - accountSummary.monthlyExpenses) / accountSummary.monthlyIncome * 100).toFixed(0)}%
                        </div>
                        <p className="text-sm font-medium">Savings Rate</p>
                        <p className="text-xs text-muted-foreground">This month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
