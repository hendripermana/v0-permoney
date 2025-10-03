"use client"

import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/enhanced/stat-card"
import { DataGrid } from "@/components/ui/enhanced/data-grid"
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface AccountSummaryWidgetProps {
  data: {
    totalBalance: number
    monthlyIncome: number
    monthlyExpenses: number
    netWorth: number
    activeAccounts?: number
  }
  isLoading?: boolean
}

export function AccountSummaryWidget({ data, isLoading }: AccountSummaryWidgetProps) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Account Summary</h3>
        <p className="text-sm text-muted-foreground">Overview of your financial accounts</p>
      </div>
      
      <DataGrid columns={2} gap="md">
        <StatCard
          title="Total Balance"
          value={formatCurrency(data.totalBalance)}
          description={`${data.activeAccounts || 0} active accounts`}
          icon={DollarSign}
          variant="success"
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(data.monthlyIncome)}
          description="From recent transactions"
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(data.monthlyExpenses)}
          description="From recent transactions"
          icon={TrendingDown}
          variant="danger"
          isLoading={isLoading}
        />
        <StatCard
          title="Net Worth"
          value={formatCurrency(data.netWorth)}
          description="Assets minus liabilities"
          icon={PiggyBank}
          variant="info"
          isLoading={isLoading}
        />
      </DataGrid>
    </div>
  )
}
