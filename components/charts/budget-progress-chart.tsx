"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Filter
} from "lucide-react"

interface BudgetData {
  category: string
  budgeted: number
  spent: number
  remaining: number
  percentage: number
  status: "on-track" | "warning" | "over-budget" | "completed"
  daysLeft?: number
  transactions: number
}

interface BudgetProgressChartProps {
  data: BudgetData[]
  period?: string
  loading?: boolean
  className?: string
  onCategoryClick?: (category: string) => void
}

const chartConfig = {
  budgeted: {
    label: "Budgeted",
  },
  spent: {
    label: "Spent",
  },
  remaining: {
    label: "Remaining",
  },
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "on-track":
      return "#22c55e" // green
    case "warning":
      return "#eab308" // yellow
    case "over-budget":
      return "#ef4444" // red
    case "completed":
      return "#3b82f6" // blue
    default:
      return "#6b7280" // gray
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "on-track":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "warning":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "over-budget":
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    case "completed":
      return <Target className="h-4 w-4 text-blue-600" />
    default:
      return <Target className="h-4 w-4 text-gray-600" />
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "on-track":
      return "On Track"
    case "warning":
      return "Warning"
    case "over-budget":
      return "Over Budget"
    case "completed":
      return "Completed"
    default:
      return "Unknown"
  }
}

export function BudgetProgressChart({
  data,
  period = "This Month",
  loading = false,
  className,
  onCategoryClick,
}: BudgetProgressChartProps) {
  const [viewMode, setViewMode] = useState<"chart" | "list">("chart")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const totalBudgeted = data.reduce((sum, item) => sum + item.budgeted, 0)
  const totalSpent = data.reduce((sum, item) => sum + item.spent, 0)
  const totalRemaining = totalBudgeted - totalSpent
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  const chartData = data.map((item) => ({
    ...item,
    categoryShort: item.category.length > 10 ? item.category.substring(0, 10) + "..." : item.category,
    fill: getStatusColor(item.status),
  }))

  const overBudgetCategories = data.filter(item => item.status === "over-budget")
  const warningCategories = data.filter(item => item.status === "warning")
  const onTrackCategories = data.filter(item => item.status === "on-track")

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.category}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-muted-foreground">
              Budgeted: <span className="font-medium text-foreground">{formatCurrency(data.budgeted)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Spent: <span className="font-medium text-foreground">{formatCurrency(data.spent)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Remaining: <span className="font-medium text-foreground">{formatCurrency(data.remaining)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Progress: <span className="font-medium text-foreground">{data.percentage.toFixed(1)}%</span>
            </p>
            <div className="flex items-center gap-1 mt-1">
              {getStatusIcon(data.status)}
              <span className="text-sm font-medium">{getStatusLabel(data.status)}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-muted rounded w-48"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Budget Progress
            </CardTitle>
            <CardDescription>
              Track your spending against budgets for {period}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "chart" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("chart")}
            >
              Chart
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalBudgeted)}</p>
            <p className="text-xs text-muted-foreground">Total Budget</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              totalRemaining >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {formatCurrency(Math.abs(totalRemaining))}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalRemaining >= 0 ? "Remaining" : "Over Budget"}
            </p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              overallProgress <= 80 ? "text-green-600" : 
              overallProgress <= 100 ? "text-yellow-600" : "text-red-600"
            }`}>
              {overallProgress.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Overall Progress</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Budget Progress</span>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
            </span>
          </div>
          <Progress 
            value={Math.min(overallProgress, 100)} 
            className={`h-3 ${
              overallProgress <= 80 ? "" : 
              overallProgress <= 100 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
            }`}
          />
        </div>
      </CardHeader>

      <CardContent>
        {/* Alerts */}
        {overBudgetCategories.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {overBudgetCategories.length} {overBudgetCategories.length === 1 ? 'category is' : 'categories are'} over budget: {' '}
              {overBudgetCategories.map(cat => cat.category).join(", ")}
            </AlertDescription>
          </Alert>
        )}

        {warningCategories.length > 0 && (
          <Alert className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {warningCategories.length} {warningCategories.length === 1 ? 'category needs' : 'categories need'} attention: {' '}
              {warningCategories.map(cat => cat.category).join(", ")}
            </AlertDescription>
          </Alert>
        )}

        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Target className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No budget data available</p>
            <p className="text-sm">Create budgets to track your spending progress</p>
          </div>
        ) : viewMode === "chart" ? (
          <ChartContainer config={chartConfig} className="h-64">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="categoryShort" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                className="text-xs"
                tickFormatter={(value) => formatCurrency(value).replace(/[^\d.,]/g, '').slice(0, -3) + 'K'}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="spent" 
                radius={[4, 4, 0, 0]}
                onClick={(data) => {
                  if (data && data.payload) {
                    setSelectedCategory(data.payload.category)
                    onCategoryClick?.(data.payload.category)
                  }
                }}
                className="cursor-pointer"
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <div 
                key={item.category}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedCategory === item.category 
                    ? "bg-muted border-primary" 
                    : "hover:bg-muted/50"
                }`}
                onClick={() => {
                  setSelectedCategory(item.category)
                  onCategoryClick?.(item.category)
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{item.category}</h4>
                    <Badge 
                      variant={item.status === "over-budget" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className={`text-sm font-medium ${
                      item.percentage <= 80 ? "text-green-600" : 
                      item.percentage <= 100 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {formatCurrency(item.spent)} / {formatCurrency(item.budgeted)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(item.percentage, 100)} 
                    className={`h-2 ${
                      item.percentage <= 80 ? "" : 
                      item.percentage <= 100 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
                    }`}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.transactions} transactions</span>
                    <span className={item.remaining >= 0 ? "text-green-600" : "text-red-600"}>
                      {item.remaining >= 0 ? "" : "Over by "}
                      {formatCurrency(Math.abs(item.remaining))}
                      {item.remaining >= 0 ? " remaining" : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}