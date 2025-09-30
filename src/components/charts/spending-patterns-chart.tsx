"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter,
  Download,
  Maximize2,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react"

interface SpendingData {
  category: string
  amount: number
  percentage: number
  transactions: number
  trend: "up" | "down" | "stable"
  color: string
}

interface TimeSeriesData {
  date: string
  amount: number
  category?: string
}

interface SpendingPatternsChartProps {
  data: SpendingData[]
  timeSeriesData?: TimeSeriesData[]
  period?: "week" | "month" | "quarter" | "year"
  onPeriodChange?: (period: string) => void
  loading?: boolean
  className?: string
}

const CHART_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f59e0b", // amber
]

const chartConfig = {
  amount: {
    label: "Amount",
  },
  transactions: {
    label: "Transactions",
  },
}

export function SpendingPatternsChart({
  data,
  timeSeriesData = [],
  period = "month",
  onPeriodChange,
  loading = false,
  className,
}: SpendingPatternsChartProps) {
  const [chartType, setChartType] = useState<"pie" | "bar" | "trend">("pie")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const totalSpending = data.reduce((sum, item) => sum + item.amount, 0)
  const topCategory = data.length > 0 ? data[0] : null

  const pieData = data.map((item, index) => ({
    ...item,
    fill: item.color || CHART_COLORS[index % CHART_COLORS.length],
  }))

  const barData = data.map((item) => ({
    category: item.category.length > 12 ? item.category.substring(0, 12) + "..." : item.category,
    fullCategory: item.category,
    amount: item.amount,
    transactions: item.transactions,
    fill: item.color || CHART_COLORS[data.indexOf(item) % CHART_COLORS.length],
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.fullCategory || data.category}</p>
          <p className="text-sm text-muted-foreground">
            Amount: <span className="font-medium text-foreground">{formatCurrency(data.amount)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Transactions: <span className="font-medium text-foreground">{data.transactions}</span>
          </p>
          {data.percentage && (
            <p className="text-sm text-muted-foreground">
              Percentage: <span className="font-medium text-foreground">{data.percentage.toFixed(1)}%</span>
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Activity className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">No spending data available</p>
          <p className="text-sm">Start adding transactions to see your spending patterns</p>
        </div>
      )
    }

    switch (chartType) {
      case "pie":
        return (
          <ChartContainer config={chartConfig} className="h-64">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="amount"
                onMouseEnter={(_, index) => setSelectedCategory(data[index]?.category || null)}
                onMouseLeave={() => setSelectedCategory(null)}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    stroke={selectedCategory === entry.category ? "#000" : "none"}
                    strokeWidth={selectedCategory === entry.category ? 2 : 0}
                  />
                ))}
              </Pie>
              <ChartTooltip content={<CustomTooltip />} />
            </PieChart>
          </ChartContainer>
        )

      case "bar":
        return (
          <ChartContainer config={chartConfig} className="h-64">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="category" 
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
                dataKey="amount" 
                radius={[4, 4, 0, 0]}
                onMouseEnter={(_, index) => setSelectedCategory(barData[index]?.fullCategory || null)}
                onMouseLeave={() => setSelectedCategory(null)}
              />
            </BarChart>
          </ChartContainer>
        )

      case "trend":
        return (
          <ChartContainer config={chartConfig} className="h-64">
            <AreaChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                className="text-xs"
                tickFormatter={(value) => formatCurrency(value).replace(/[^\d.,]/g, '').slice(0, -3) + 'K'}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{label ? new Date(label).toLocaleDateString('id-ID') : 'Unknown Date'}</p>
                        <p className="text-sm text-muted-foreground">
                          Amount: <span className="font-medium text-foreground">{formatCurrency(payload[0].value as number)}</span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Spending Patterns
            </CardTitle>
            <CardDescription>
              Analyze your spending habits across different categories
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="flex items-center gap-2">
          <Button
            variant={chartType === "pie" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("pie")}
          >
            <PieChartIcon className="h-4 w-4 mr-1" />
            Pie
          </Button>
          <Button
            variant={chartType === "bar" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("bar")}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Bar
          </Button>
          <Button
            variant={chartType === "trend" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("trend")}
            disabled={timeSeriesData.length === 0}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Trend
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalSpending)}</p>
            <p className="text-xs text-muted-foreground">Total Spending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{data.length}</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {data.reduce((sum, item) => sum + item.transactions, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </div>
          <div className="text-center">
            {topCategory && (
              <>
                <p className="text-2xl font-bold">{topCategory.percentage.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Top Category</p>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {renderChart()}

        {/* Category Legend */}
        {data.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Categories</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.slice(0, 8).map((item, index) => (
                <div 
                  key={item.category}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    selectedCategory === item.category 
                      ? "bg-muted border-primary" 
                      : "hover:bg-muted/50"
                  }`}
                  onMouseEnter={() => setSelectedCategory(item.category)}
                  onMouseLeave={() => setSelectedCategory(null)}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{item.category}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-muted-foreground">{item.transactions} transactions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}