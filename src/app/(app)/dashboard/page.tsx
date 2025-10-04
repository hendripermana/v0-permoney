"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SpendingPatternsChart } from "@/components/charts/spending-patterns-chart"
import { BudgetProgressChart } from "@/components/charts/budget-progress-chart"
import { NetWorthChart } from "@/components/charts/net-worth-chart"
import { SankeyFlowChart } from "@/components/charts/sankey-flow-chart"
import { StatCard } from "@/components/ui/enhanced/stat-card"
import { DataGrid } from "@/components/ui/enhanced/data-grid"
import {
  PageContainer,
  PageHeader,
  ContentSection,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/ui/enhanced"
import {
  DollarSign,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Activity,
  PieChart,
  RefreshCw,
} from "lucide-react"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { toast } from "@/hooks/use-toast"
import {
  formatCurrency,
  formatShortDate,
  fromCents,
  getDeterministicColor,
  safeNumber,
} from "@/lib/utils"

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

  type NormalizedTransaction = {
    id: string
    description: string
    amount: number
    amountCents: number
    type: "income" | "expense" | "transfer"
    date: Date
    formattedDate: string
    category: string
  }

  const transactions = data?.transactions ?? []

  const normalizedTransactions = useMemo<NormalizedTransaction[]>(() => {
    if (!transactions?.length) {
      return []
    }

    return transactions.map((transaction: any) => {
      const amountCents = safeNumber(transaction.amountCents, 0)
      const amount = fromCents(amountCents)
      const isoDate = transaction.date ?? transaction.createdAt ?? new Date().toISOString()
      const date = new Date(isoDate)
      const type: NormalizedTransaction["type"] = amount > 0 ? "income" : amount < 0 ? "expense" : "transfer"

      return {
        id: transaction.id,
        description: transaction.description ?? "Unknown Transaction",
        amount,
        amountCents,
        type,
        date,
        formattedDate: formatShortDate(date),
        category: transaction.category?.name ?? "Uncategorized",
      }
    })
  }, [transactions])

  const accountSummary = useMemo(() => {
    if (!data) {
      return {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        savings: 0,
        totalLiabilities: 0,
      }
    }

    // Ensure transactions is an array with defensive check
    const transactionsArray = Array.isArray(transactions) ? transactions : []
    
    const incomeCents = transactionsArray.reduce((sum: number, transaction: any) => {
      const amountCents = safeNumber(transaction.amountCents, 0)
      return amountCents > 0 ? sum + amountCents : sum
    }, 0)

    const expenseCents = transactionsArray.reduce((sum: number, transaction: any) => {
      const amountCents = safeNumber(transaction.amountCents, 0)
      return amountCents < 0 ? sum + amountCents : sum
    }, 0)

    const totalAssets = fromCents(data.netWorth?.totalAssets)
    const totalLiabilities = fromCents(data.netWorth?.totalLiabilities)
    const netWorth = fromCents(data.netWorth?.netWorth)

    return {
      totalBalance: totalAssets,
      monthlyIncome: fromCents(incomeCents),
      monthlyExpenses: fromCents(Math.abs(expenseCents)),
      savings: netWorth || totalAssets - totalLiabilities,
      totalLiabilities,
    }
  }, [data, transactions])

  const savingsRate = useMemo(() => {
    if (accountSummary.monthlyIncome <= 0) {
      return 0
    }

    const rate = ((accountSummary.monthlyIncome - accountSummary.monthlyExpenses) / accountSummary.monthlyIncome) * 100
    return Number.isFinite(rate) ? Math.max(rate, 0) : 0
  }, [accountSummary])

  const recentTransactions = useMemo(() => normalizedTransactions.slice(0, 5), [normalizedTransactions])

  const budgetData = useMemo(() => {
    if (!data?.budgets?.length) {
      return []
    }

    return data.budgets.flatMap((budget: any) =>
      (budget.categories ?? []).map((category: any) => {
        const budgeted = fromCents(category.allocatedAmountCents)
        const spent = fromCents(category.spentAmountCents)
        const remaining = Math.max(0, budgeted - spent)
        const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0

        let status: "on-track" | "warning" | "over-budget" | "completed" = "on-track"
        if (percentage >= 100) {
          status = "over-budget"
        } else if (percentage >= 80) {
          status = "warning"
        }

        return {
          id: category.id ?? `${budget.id}-${category.categoryId ?? "unknown"}`,
          category: category.category?.name ?? "Unknown Category",
          budgeted,
          spent,
          remaining,
          percentage,
          status,
          transactions: category.transactionCount ?? category.transactions?.length ?? 0,
          color: getDeterministicColor(category.category?.name ?? "Unknown Category"),
        }
      }),
    )
  }, [data?.budgets])

  const budgetSnapshot = useMemo(() => budgetData.slice(0, 4), [budgetData])

  const spendingData = useMemo(() => {
    if (!normalizedTransactions.length) {
      return []
    }

    const expenseTotals = new Map<string, { amount: number; transactions: number }>()

    normalizedTransactions
      .filter((transaction) => transaction.amount < 0)
      .forEach((transaction) => {
        const category = transaction.category
        const entry = expenseTotals.get(category) ?? { amount: 0, transactions: 0 }
        entry.amount += Math.abs(transaction.amount)
        entry.transactions += 1
        expenseTotals.set(category, entry)
      })

    const totalAmount = Array.from(expenseTotals.values()).reduce((sum, value) => sum + value.amount, 0)

    return Array.from(expenseTotals.entries())
      .map(([category, value]) => ({
        category,
        amount: value.amount,
        transactions: value.transactions,
        trend: "stable" as const,
        color: getDeterministicColor(category),
        percentage: totalAmount > 0 ? (value.amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [normalizedTransactions])

  const netWorthData = useMemo(() => {
    const baseNetWorth = accountSummary.savings
    const totalLiabilities = accountSummary.totalLiabilities
    const hasTransactions = normalizedTransactions.length > 0

    if (!baseNetWorth && !hasTransactions) {
      return []
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dates = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today)
      date.setDate(date.getDate() - (29 - index))
      return date
    })

    const dailyDelta = new Map<string, number>()
    normalizedTransactions.forEach((transaction) => {
      const key = transaction.date.toISOString().slice(0, 10)
      const value = dailyDelta.get(key) ?? 0
      dailyDelta.set(key, value + transaction.amount)
    })

    const totalChange = Array.from(dailyDelta.values()).reduce((sum, value) => sum + value, 0)
    let runningNetWorth = baseNetWorth - totalChange

    return dates.map((date) => {
      const key = date.toISOString().slice(0, 10)
      const change = dailyDelta.get(key) ?? 0
      runningNetWorth += change

      const assets = runningNetWorth + totalLiabilities

      return {
        date: date.toISOString(),
        assets,
        liabilities: totalLiabilities,
        netWorth: runningNetWorth,
        change,
        changePercentage: baseNetWorth ? (change / baseNetWorth) * 100 : 0,
      }
    })
  }, [accountSummary.savings, accountSummary.totalLiabilities, normalizedTransactions])

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading dashboard data..." fullPage />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          title="Error Loading Dashboard"
          message={error}
          onRetry={refetch}
          fullPage
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="xl">
      <ContentSection spacing="lg">
        <PageHeader
          title="Financial Dashboard"
          description="Welcome back! Here's your financial overview."
          actions={
            <>
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
            </>
          }
        />

        {/* Account Summary Cards */}
        <DataGrid columns={4} gap="md" className="mb-lg">
          <StatCard
            title="Total Balance"
            value={formatCurrency(accountSummary.totalBalance)}
            description={`${data?.accountStats?.activeAccounts || 0} active accounts`}
            icon={DollarSign}
            variant="success"
            isLoading={loading}
          />
          
          <StatCard
            title="Monthly Income"
            value={formatCurrency(accountSummary.monthlyIncome)}
            description="From recent transactions"
            icon={ArrowUpRight}
            isLoading={loading}
          />
          
          <StatCard
            title="Monthly Expenses"
            value={formatCurrency(accountSummary.monthlyExpenses)}
            description="From recent transactions"
            icon={ArrowDownRight}
            variant="danger"
            isLoading={loading}
          />
          
          <StatCard
            title="Net Worth"
            value={formatCurrency(accountSummary.savings)}
            description="Assets minus liabilities"
            icon={PiggyBank}
            variant="info"
            isLoading={loading}
          />
        </DataGrid>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <EmptyState
                  icon={Target}
                  title="No transactions yet"
                  description="Start tracking your finances by adding your first transaction"
                  action={{
                    label: "Add Transaction",
                    onClick: () => window.location.href = "/transactions",
                  }}
                  variant="minimal"
                />
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
                        <p className="text-xs text-muted-foreground">{transaction.formattedDate}</p>
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
              {budgetSnapshot.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No budgets set up yet</p>
                  <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                    <Target className="h-4 w-4 mr-2" />
                    Create your first budget
                  </Button>
                </div>
              ) : (
                budgetSnapshot.map((budget) => {
                  const percentage = budget.percentage
                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{budget.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.budgeted)}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between items-center">
                        <Badge variant={percentage > 80 ? "destructive" : percentage > 60 ? "default" : "secondary"}>
                          {percentage.toFixed(1)}% used
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(Math.max(0, budget.remaining))} remaining
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
              <DataGrid columns={2} gap="lg">
                <SpendingPatternsChart
                  data={spendingData}
                  period={chartPeriod as any}
                  onPeriodChange={handlePeriodChange}
                  loading={loading}
                />
                <SankeyFlowChart
                  transactions={Array.isArray(transactions) ? transactions : []}
                  loading={loading}
                  title="Money Flow"
                  description="Visualize income and expense flows"
                />
              </DataGrid>
              <DataGrid columns={2} gap="lg">
                <NetWorthChart
                  data={netWorthData}
                  period={chartPeriod as any}
                  onPeriodChange={handlePeriodChange}
                  loading={loading}
                  showBreakdown={true}
                />
                <BudgetProgressChart
                  data={budgetData}
                  period={selectedPeriod}
                  loading={loading}
                  onCategoryClick={handleCategoryClick}
                />
              </DataGrid>
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
                          {savingsRate.toFixed(0)}%
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
      </ContentSection>
    </PageContainer>
  )
}
