"use client"

import { useState } from "react"
import { PermoneyCard } from "@/components/permoney-card"
import { Button } from "@/components/ui/button"
import {
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  CreditCardIcon,
  TrendingUpIcon,
  Building2Icon,
  CreditCard,
  TrendingDown,
  BarChart3,
  LineChart,
  Calendar,
  Maximize2,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { DashboardLayout, DashboardPage } from "@/components"
import { useDashboard } from "@/hooks/use-dashboard"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Dashboard() {
  const [isFullscreenSankey, setIsFullscreenSankey] = useState(false)
  const [selectedCashflowPeriod, setSelectedCashflowPeriod] = useState("30D")
  const [selectedNetWorthPeriod, setSelectedNetWorthPeriod] = useState("30D")

  const {
    data,
    isLoading,
    error,
    isRefetching,
    refresh,
    refreshAll,
    hasData,
    isEmpty,
    accounts,
    netWorthSummary,
    recentTransactions,
  } = useDashboard({
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })

  // Handle period changes
  const handlePeriodChange = (period: string, type: "cashflow" | "networth") => {
    if (type === "cashflow") {
      setSelectedCashflowPeriod(period)
    } else {
      setSelectedNetWorthPeriod(period)
    }

    // Update filters based on period
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case "WTD":
        startDate.setDate(now.getDate() - now.getDay())
        break
      case "7D":
        startDate.setDate(now.getDate() - 7)
        break
      case "MTD":
        startDate.setDate(1)
        break
      case "30D":
        startDate.setDate(now.getDate() - 30)
        break
      case "90D":
        startDate.setDate(now.getDate() - 90)
        break
      case "YTD":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case "365D":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "5Y":
        startDate.setFullYear(now.getFullYear() - 5)
        break
      case "ALL":
        startDate = new Date("2020-01-01")
        break
    }

    // This would trigger a refetch with new filters
    // updateFilters({ startDate: startDate.toISOString(), endDate: now.toISOString() });
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <PermoneyCard className="glassmorphism p-6">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 animate-spin text-neon-green" />
              <div className="text-foreground text-xl">Loading Dashboard...</div>
            </div>
          </PermoneyCard>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <PermoneyCard className="glassmorphism p-6 max-w-md">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load dashboard data: {error.message}</AlertDescription>
            </Alert>
            <Button onClick={() => refresh()} className="mt-4 w-full" disabled={isRefetching}>
              {isRefetching ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                "Retry"
              )}
            </Button>
          </PermoneyCard>
        </div>
      </DashboardLayout>
    )
  }

  if (isEmpty) {
    return (
      <DashboardLayout>
        <DashboardPage
          title="Financial Dashboard"
          description="Your complete financial overview"
          actions={
            <Button className="button-solid">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          }
        >
          <PermoneyCard className="glassmorphism p-8 text-center">
            <div className="text-muted-foreground text-lg mb-4">No financial data available yet</div>
            <div className="text-sm text-muted-foreground mb-6">
              Start by adding your accounts and transactions to see your financial overview
            </div>
            <Button className="button-solid">
              <PlusIcon className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </PermoneyCard>
        </DashboardPage>
      </DashboardLayout>
    )
  }

  const summary = data?.summary

  return (
    <DashboardLayout>
      <DashboardPage
        title="Financial Dashboard"
        description="Your complete financial overview with real-time data."
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => refreshAll()} disabled={isRefetching}>
              {isRefetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Button className="button-solid">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Top 4 Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PermoneyCard className="glassmorphism p-6 slide-up stagger-1">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-foreground">Net Worth</div>
                <CreditCardIcon className="h-4 w-4 text-neon-green" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{summary?.netWorth?.formatted || "Rp 0"}</div>
                <p className="text-xs text-muted-foreground mt-1">Total assets minus liabilities</p>
              </div>
            </PermoneyCard>

            <PermoneyCard className="glassmorphism p-6 slide-up stagger-2">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-foreground">Monthly Income</div>
                <ArrowUpIcon className="h-4 w-4 text-neon-green" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neon-green">{summary?.monthlyIncome?.formatted || "Rp 0"}</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
            </PermoneyCard>

            <PermoneyCard className="glassmorphism p-6 slide-up stagger-3">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-foreground">Monthly Expenses</div>
                <ArrowDownIcon className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{summary?.monthlyExpenses?.formatted || "Rp 0"}</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
            </PermoneyCard>

            <PermoneyCard className="glassmorphism p-6 slide-up stagger-4">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-foreground">Monthly Savings</div>
                <TrendingUpIcon className="h-4 w-4 text-neon-green" />
              </div>
              <div>
                <div
                  className={`text-2xl font-bold ${(summary?.monthlySavings?.amount || 0) >= 0 ? "text-neon-green" : "text-red-500"}`}
                >
                  {summary?.monthlySavings?.formatted || "Rp 0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary?.savingsRate ? `${summary.savingsRate.toFixed(1)}% savings rate` : "This month"}
                </p>
              </div>
            </PermoneyCard>
          </div>

          {/* Net Worth Section with Graph - Full Width */}
          <PermoneyCard className="glassmorphism p-8 slide-up stagger-5">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <LineChart className="h-6 w-6 text-neon-green" />
                  <div className="text-3xl font-semibold leading-none tracking-tight text-foreground">
                    Net Worth Trend
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex space-x-1">
                    {["WTD", "7D", "MTD", "30D", "90D", "YTD", "365D", "5Y", "ALL"].map((period) => (
                      <Button
                        key={period}
                        variant={period === selectedNetWorthPeriod ? "default" : "outline"}
                        size="sm"
                        className={`h-8 px-3 text-xs ${
                          period === selectedNetWorthPeriod
                            ? "bg-neon-green text-black hover:bg-neon-green/90"
                            : "border-border/50 hover:bg-background/50"
                        }`}
                        onClick={() => handlePeriodChange(period, "networth")}
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Track your wealth growth over time</div>
            </div>

            {/* Net Worth Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-green">{summary?.netWorth?.formatted || "Rp 0"}</div>
                <div className="text-sm text-muted-foreground">Current Net Worth</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">{summary?.totalAssets?.formatted || "Rp 0"}</div>
                <div className="text-sm text-muted-foreground">Total Assets</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-500">
                  {summary?.totalLiabilities?.formatted || "Rp 0"}
                </div>
                <div className="text-sm text-muted-foreground">Total Liabilities</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">
                  {summary?.savingsRate ? `${summary.savingsRate.toFixed(1)}%` : "0%"}
                </div>
                <div className="text-sm text-muted-foreground">Savings Rate</div>
              </div>
            </div>

            {/* Graph Placeholder - Will be replaced with real chart */}
            <div className="bg-background/30 rounded-lg p-8 border border-border/50">
              <div className="flex items-center justify-center h-80">
                <div className="text-center">
                  <LineChart className="h-20 w-20 text-neon-green/50 mx-auto mb-4" />
                  <p className="text-xl font-medium text-foreground mb-2">Net Worth Growth Chart</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {data?.netWorthChart ? "Chart data loaded" : "Loading chart data..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Showing wealth progression over {selectedNetWorthPeriod}
                  </p>
                  <div className="mt-4 flex justify-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-0.5 bg-neon-green rounded"></div>
                      <span>Assets</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-0.5 bg-red-500 rounded"></div>
                      <span>Liabilities</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
                      <span>Net Worth</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PermoneyCard>

          {/* Assets Section - Full Width */}
          <PermoneyCard className="glassmorphism p-8 slide-up stagger-6">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <Building2Icon className="h-6 w-6 text-neon-green" />
                <div className="text-3xl font-semibold leading-none tracking-tight text-foreground">Assets</div>
              </div>
              <div className="text-sm text-muted-foreground">Your investment portfolio and valuable assets</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts && accounts.length > 0 ? (
                accounts
                  .filter((account: any) => account.type === "ASSET")
                  .map((account: any) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/20"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-neon-green/30" />
                        <div>
                          <p className="font-medium text-foreground">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.subtype || account.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{account.balance?.formatted || "Rp 0"}</p>
                        <p className="text-sm text-neon-green">Active</p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No asset accounts found</p>
                  <Button variant="outline" className="mt-2 bg-transparent">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Account
                  </Button>
                </div>
              )}
            </div>
          </PermoneyCard>

          {/* Liabilities Section - Full Width */}
          <PermoneyCard className="glassmorphism p-8 slide-up stagger-7">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <CreditCard className="h-6 w-6 text-red-500" />
                <div className="text-3xl font-semibold leading-none tracking-tight text-foreground">Liabilities</div>
              </div>
              <div className="text-sm text-muted-foreground">Your debts and financial obligations</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts && accounts.length > 0 ? (
                accounts
                  .filter((account: any) => account.type === "LIABILITY")
                  .map((account: any) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/20"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-red-500/30" />
                        <div>
                          <p className="font-medium text-foreground">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.subtype || account.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-500">{account.balance?.formatted || "Rp 0"}</p>
                        <p className="text-sm text-muted-foreground">Active</p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No liability accounts found</p>
                </div>
              )}
            </div>
          </PermoneyCard>

          {/* Cashflow Section with Sankey Chart - Full Width */}
          <PermoneyCard className="glassmorphism p-8 slide-up stagger-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-6 w-6 text-neon-green" />
                  <div className="text-3xl font-semibold leading-none tracking-tight text-foreground">
                    Cashflow Analysis
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex space-x-1">
                    {["WTD", "7D", "MTD", "30D", "90D", "YTD", "365D", "5Y", "ALL"].map((period) => (
                      <Button
                        key={period}
                        variant={period === selectedCashflowPeriod ? "default" : "outline"}
                        size="sm"
                        className={`h-8 px-3 text-xs ${
                          period === selectedCashflowPeriod
                            ? "bg-neon-green text-black hover:bg-neon-green/90"
                            : "border-border/50 hover:bg-background/50"
                        }`}
                        onClick={() => handlePeriodChange(period, "cashflow")}
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Visual representation of your money flow with real data
              </div>
            </div>

            {/* Sankey Chart Placeholder */}
            <div className="bg-background/30 rounded-lg p-8 border border-border/50 mb-6 relative">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 h-8 w-8 p-0 border-border/50 hover:bg-background/50 bg-transparent"
                onClick={() => setIsFullscreenSankey(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-neon-green/50 mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">Sankey Chart Visualization</p>
                  <p className="text-sm text-muted-foreground">
                    {data?.cashflowChart ? "Real cashflow data loaded" : "Loading cashflow data..."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Income → Expenses → Savings flow for {selectedCashflowPeriod}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center space-x-2">
                    <Maximize2 className="h-3 w-3" />
                    <span>Click expand for fullscreen view</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Cashflow Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <ArrowUpIcon className="h-5 w-5 text-neon-green mr-2" />
                  Income Sources
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/20 border border-border/30">
                    <span className="text-foreground">Total Income</span>
                    <span className="text-neon-green font-medium">
                      {data?.cashflowChart?.totalIncome?.formatted || summary?.monthlyIncome?.formatted || "Rp 0"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                  Expense Categories
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/20 border border-border/30">
                    <span className="text-foreground">Total Expenses</span>
                    <span className="text-red-500 font-medium">
                      {data?.cashflowChart?.totalExpenses?.formatted || summary?.monthlyExpenses?.formatted || "Rp 0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/20 border border-border/30">
                    <span className="text-foreground">Net Cashflow</span>
                    <span
                      className={`font-medium ${(data?.cashflowChart?.netCashflow?.amount || summary?.monthlySavings?.amount || 0) >= 0 ? "text-neon-green" : "text-red-500"}`}
                    >
                      {data?.cashflowChart?.netCashflow?.formatted || summary?.monthlySavings?.formatted || "Rp 0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </PermoneyCard>
        </div>

        {/* Fullscreen Sankey Chart Modal */}
        {isFullscreenSankey && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full h-full max-w-7xl max-h-[90vh] bg-background/95 backdrop-blur-md rounded-lg border border-border/50 relative">
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-6 w-6 text-neon-green" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    Cashflow Sankey Chart - {selectedCashflowPeriod}
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-border/50 hover:bg-background/50 bg-transparent"
                  onClick={() => setIsFullscreenSankey(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 h-[calc(100%-80px)]">
                <div className="bg-background/30 rounded-lg p-8 border border-border/50 h-full">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart3 className="h-24 w-24 text-neon-green/50 mx-auto mb-6" />
                      <p className="text-2xl font-medium text-foreground mb-4">Fullscreen Sankey Chart</p>
                      <p className="text-lg text-muted-foreground mb-4">
                        {data?.cashflowChart ? "Real-time cashflow visualization" : "Loading cashflow data..."}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Period: {selectedCashflowPeriod} | Income → Expenses → Savings flow
                      </p>
                      <div className="mt-8 flex justify-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-1 bg-neon-green rounded"></div>
                          <span>Income Flow</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-1 bg-red-500 rounded"></div>
                          <span>Expense Flow</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-1 bg-blue-500 rounded"></div>
                          <span>Savings Flow</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardPage>
    </DashboardLayout>
  )
}
