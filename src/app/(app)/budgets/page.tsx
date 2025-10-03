"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle,
  PieChart,
  RefreshCw,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { BudgetModal } from "@/components/modals/budget-modal"
import { formatCurrency, fromCents } from "@/lib/utils"
import {
  PageContainer,
  PageHeader,
  ContentSection,
  LoadingState,
  ErrorState,
  BudgetItem,
  EmptyState,
} from "@/components/ui/enhanced"
import { toast } from "@/hooks/use-toast"

export default function BudgetsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  function resolveBudgetBadge(percentage: number) {
    if (percentage >= 90) return { severity: "danger" as const, color: "text-red-600", bg: "bg-red-100" }
    if (percentage >= 75) return { severity: "warning" as const, color: "text-yellow-600", bg: "bg-yellow-100" }
    return { severity: "good" as const, color: "text-green-600", bg: "bg-green-100" }
  }

  useEffect(() => {
    fetchBudgets()
  }, [])

  const fetchBudgets = async () => {
    try {
      setLoading(true)
      setError(null)

      const apiBudgets = await apiClient.getBudgets({ isActive: true })

      const transformedBudgets = apiBudgets.flatMap((budget: any) =>
        (budget.categories ?? []).map((category: any) => {
          const budgeted = fromCents(category.allocatedAmountCents)
          const spent = fromCents(category.spentAmountCents)
          const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0
          const remaining = budgeted - spent
          const badge = resolveBudgetBadge(percentage)
          const status = percentage >= 100 ? "over-budget" : percentage >= 80 ? "warning" : "on-track"

          return {
            id: category.id ?? `${budget.id}-${category.categoryId ?? "unknown"}`,
            category: category.category?.name || "Unknown Category",
            spent,
            budgeted,
            remaining,
            currency: budget.currency ?? category.currency ?? "IDR",
            percentage,
            status,
            severity: badge,
            transactions: category.transactionCount ?? category.transactions?.length ?? 0,
          }
        }),
      )

      setBudgets(transformedBudgets)
    } catch (err) {
      console.error("Failed to fetch budgets:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch budgets")

      setBudgets(getMockBudgets())
    } finally {
      setLoading(false)
    }
  }

  const getMockBudgets = () => {
    const mockData = [
      {
        id: "mock-1",
        category: "Food & Dining",
        spent: 2100000,
        budgeted: 3000000,
        transactions: 24,
      },
      {
        id: "mock-2",
        category: "Transportation",
        spent: 800000,
        budgeted: 1200000,
        transactions: 18,
      },
      {
        id: "mock-3",
        category: "Entertainment",
        spent: 450000,
        budgeted: 800000,
        transactions: 12,
      },
      {
        id: "mock-4",
        category: "Utilities",
        spent: 650000,
        budgeted: 1000000,
        transactions: 6,
      },
    ]

    return mockData.map((item) => {
      const percentage = item.budgeted > 0 ? (item.spent / item.budgeted) * 100 : 0
      const remaining = item.budgeted - item.spent
      const badge = resolveBudgetBadge(percentage)
      const status = percentage >= 100 ? "over-budget" : percentage >= 80 ? "warning" : "on-track"

      return {
        ...item,
        currency: "IDR",
        percentage,
        remaining,
        status,
        severity: badge,
      }
    })
  }

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgeted, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchBudgets()
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Budgets have been updated",
    })
  }

  const handleBudgetCreated = () => {
    fetchBudgets()
    setIsBudgetModalOpen(false)
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading budgets..." fullPage />
      </PageContainer>
    )
  }

  if (error && budgets.length === 0) {
    return (
      <PageContainer>
        <ErrorState
          message={error}
          onRetry={fetchBudgets}
          fullPage
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="xl">
      <ContentSection spacing="lg">
        <PageHeader
          title="Budget Management"
          description="Track your spending and stay within your budget limits"
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
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button size="sm" onClick={() => setIsBudgetModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Budget
              </Button>
            </>
          }
        />

        {error && (
          <ErrorState
            variant="inline"
            title="Warning"
            message={`Using offline data - ${error}`}
          />
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body font-medium">Total Budget</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-h3 font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(totalBudget)}
              </div>
              <p className="text-caption text-muted-foreground">This {selectedPeriod}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body font-medium">Total Spent</CardTitle>
              <PieChart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-h3 font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalSpent)}
              </div>
              <p className="text-caption text-muted-foreground">
                {overallProgress.toFixed(1)}% of budget
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body font-medium">Remaining</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-h3 font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalRemaining)}
              </div>
              <p className="text-caption text-muted-foreground">
                {(100 - overallProgress).toFixed(1)}% remaining
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body font-medium">Categories</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-h3 font-bold">{budgets.length}</div>
              <p className="text-caption text-muted-foreground">
                {budgets.filter((b) => b.percentage >= 90).length} over 90%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Budget Progress</CardTitle>
            <CardDescription>Your total spending across all categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-body-sm">
                <span className="font-medium">Total Progress</span>
                <span className="text-muted-foreground">
                  {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                </span>
              </div>

              <Progress value={Math.min(overallProgress, 100)} className="h-3" />

              <div className="flex justify-between items-center">
                <Badge
                  variant={overallProgress > 90 ? "destructive" : "default"}
                  className={
                    overallProgress > 90
                      ? ""
                      : overallProgress > 75
                        ? "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                        : "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                  }
                >
                  {overallProgress.toFixed(1)}% used
                </Badge>
                <span className="text-body-sm text-muted-foreground">
                  {formatCurrency(totalRemaining)} remaining
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Items */}
        {budgets.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No budgets found"
            description="Get started by creating your first budget to track spending"
            action={{
              label: "Create Your First Budget",
              onClick: () => setIsBudgetModalOpen(true),
            }}
            variant="card"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgets.map((budget) => (
              <BudgetItem
                key={budget.id}
                {...budget}
              />
            ))}
          </div>
        )}
      </ContentSection>

      <BudgetModal
        open={isBudgetModalOpen}
        onOpenChange={setIsBudgetModalOpen}
        onSuccess={handleBudgetCreated}
      />
    </PageContainer>
  )
}
