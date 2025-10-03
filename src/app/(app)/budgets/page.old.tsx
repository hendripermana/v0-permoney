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
  Loader2,
  AlertCircle,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { BudgetModal } from "@/components/modals/budget-modal"
import { formatCurrency, fromCents } from "@/lib/utils"

export default function BudgetsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)

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

  const handleBudgetCreated = () => {
    fetchBudgets()
    setIsBudgetModalOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="w-full px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading budgets...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="w-full px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Budget Management</h1>
            <p className="text-muted-foreground">Track your spending and stay within your budget limits</p>
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                <AlertCircle className="h-4 w-4" />
                <span>Using offline data - {error}</span>
              </div>
            )}
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
            <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => setIsBudgetModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalBudget)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <PieChart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-muted-foreground">{overallProgress.toFixed(1)}% of budget</p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRemaining)}</div>
              <p className="text-xs text-muted-foreground">{(100 - overallProgress).toFixed(1)}% remaining</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgets.length}</div>
              <p className="text-xs text-muted-foreground">
                {budgets.filter((b) => b.percentage >= 90).length} over 90%
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Overall Budget Progress</CardTitle>
                <CardDescription>Your total spending across all categories</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchBudgets} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Progress</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <div className="flex justify-between items-center">
                <Badge variant={overallProgress > 90 ? "destructive" : overallProgress > 75 ? "default" : "secondary"}>
                  {overallProgress.toFixed(1)}% used
                </Badge>
                <span className="text-sm text-muted-foreground">{formatCurrency(totalRemaining)} remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {budgets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">No budgets found</p>
              <Button className="bg-green-500 hover:bg-green-600" onClick={() => setIsBudgetModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgets.map((budget) => {
              const percentage = budget.percentage
              const remaining = budget.remaining
              const status = budget.severity
              const statusLabel =
                status.severity === "danger" ? "Over target" : status.severity === "warning" ? "Monitor usage" : "On track"

              return (
                <Card key={budget.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-lg">{budget.category}</CardTitle>
                      <CardDescription>{budget.transactions} transactions this month</CardDescription>
                    </div>
                    <div className={`p-2 rounded-full ${status.bg}`}>
                      <Target className={`h-4 w-4 ${status.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(budget.spent, budget.currency ?? "IDR")} / {formatCurrency(budget.budgeted, budget.currency ?? "IDR")}
                      </span>
                    </div>

                    <Progress value={percentage} className="h-2" />

                    <div className="flex justify-between items-center">
                      <Badge variant={percentage > 90 ? "destructive" : percentage > 75 ? "default" : "secondary"}>
                        {percentage.toFixed(1)}% used
                      </Badge>
                      <span className={`text-xs font-medium ${status.color}`}>{statusLabel}</span>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Remaining</span>
                        <span className={`font-semibold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(remaining, budget.currency ?? "IDR")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <BudgetModal
        open={isBudgetModalOpen}
        onOpenChange={setIsBudgetModalOpen}
        onSuccess={handleBudgetCreated}
      />
    </div>
  )
}