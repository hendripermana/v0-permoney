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
} from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Download,
  Maximize2,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"

interface NetWorthData {
  date: string
  assets: number
  liabilities: number
  netWorth: number
  change?: number
  changePercentage?: number
}

interface NetWorthChartProps {
  data: NetWorthData[]
  period?: "7d" | "30d" | "90d" | "1y" | "all"
  onPeriodChange?: (period: string) => void
  loading?: boolean
  className?: string
  showBreakdown?: boolean
}

const chartConfig = {
  assets: {
    label: "Assets",
  },
  liabilities: {
    label: "Liabilities",
  },
  netWorth: {
    label: "Net Worth",
  },
}

const PERIOD_LABELS = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 3 Months",
  "1y": "Last Year",
  "all": "All Time",
}

export function NetWorthChart({
  data,
  period = "30d",
  onPeriodChange,
  loading = false,
  className,
  showBreakdown = true,
}: NetWorthChartProps) {
  const [chartType, setChartType] = useState<"line" | "area" | "composed">("area")
  const [selectedDataPoint, setSelectedDataPoint] = useState<NetWorthData | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { 
      month: 'short', 
      day: 'numeric',
      year: period === "1y" || period === "all" ? 'numeric' : undefined
    })
  }

  const currentNetWorth = data.length > 0 ? data[data.length - 1].netWorth : 0
  const previousNetWorth = data.length > 1 ? data[data.length - 2].netWorth : currentNetWorth
  const netWorthChange = currentNetWorth - previousNetWorth
  const netWorthChangePercentage = previousNetWorth !== 0 ? (netWorthChange / previousNetWorth) * 100 : 0

  const currentAssets = data.length > 0 ? data[data.length - 1].assets : 0
  const currentLiabilities = data.length > 0 ? data[data.length - 1].liabilities : 0

  const minNetWorth = Math.min(...data.map(d => d.netWorth))
  const maxNetWorth = Math.max(...data.map(d => d.netWorth))
  const totalChange = data.length > 1 ? data[data.length - 1].netWorth - data[0].netWorth : 0
  const totalChangePercentage = data.length > 1 && data[0].netWorth !== 0 
    ? (totalChange / data[0].netWorth) * 100 
    : 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{formatDate(label)}</p>
          <div className="space-y-1 mt-2">
            {showBreakdown && (
              <>
                <p className="text-sm text-muted-foreground">
                  Assets: <span className="font-medium text-green-600">{formatCurrency(data.assets)}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Liabilities: <span className="font-medium text-red-600">{formatCurrency(data.liabilities)}</span>
                </p>
              </>
            )}
            <p className="text-sm text-muted-foreground">
              Net Worth: <span className="font-medium text-foreground">{formatCurrency(data.netWorth)}</span>
            </p>
            {data.change !== undefined && (
              <div className="flex items-center gap-1">
                {data.change > 0 ? (
                  <ArrowUp className="h-3 w-3 text-green-600" />
                ) : data.change < 0 ? (
                  <ArrowDown className="h-3 w-3 text-red-600" />
                ) : (
                  <Minus className="h-3 w-3 text-gray-600" />
                )}
                <span className={`text-sm font-medium ${
                  data.change > 0 ? "text-green-600" : 
                  data.change < 0 ? "text-red-600" : "text-gray-600"
                }`}>
                  {formatCurrency(Math.abs(data.change))}
                  {data.changePercentage !== undefined && (
                    <span className="ml-1">({data.changePercentage.toFixed(2)}%)</span>
                  )}
                </span>
              </div>
            )}
          </div>
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
          <p className="text-lg font-medium">No net worth data available</p>
          <p className="text-sm">Add accounts and transactions to track your net worth</p>
        </div>
      )
    }

    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    }

    switch (chartType) {
      case "line":
        return (
          <ChartContainer config={chartConfig} className="h-64">
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={formatDate}
              />
              <YAxis 
                className="text-xs"
                tickFormatter={(value) => formatCurrency(value).replace(/[^\d.,]/g, '').slice(0, -3) + 'K'}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
              />
            </LineChart>
          </ChartContainer>
        )

      case "area":
        return (
          <ChartContainer config={chartConfig} className="h-64">
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={formatDate}
              />
              <YAxis 
                className="text-xs"
                tickFormatter={(value) => formatCurrency(value).replace(/[^\d.,]/g, '').slice(0, -3) + 'K'}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )

      case "composed":
        return (
          <ChartContainer config={chartConfig} className="h-64">
            <ComposedChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={formatDate}
              />
              <YAxis 
                className="text-xs"
                tickFormatter={(value) => formatCurrency(value).replace(/[^\d.,]/g, '').slice(0, -3) + 'K'}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Bar dataKey="assets" fill="#22c55e" fillOpacity={0.6} />
              <Bar dataKey="liabilities" fill="#ef4444" fillOpacity={0.6} />
              <Line 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
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
              <TrendingUp className="h-5 w-5" />
              Net Worth Trend
            </CardTitle>
            <CardDescription>
              Track your financial progress over {PERIOD_LABELS[period]}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">3 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
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
            variant={chartType === "area" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("area")}
          >
            <Activity className="h-4 w-4 mr-1" />
            Area
          </Button>
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Line
          </Button>
          {showBreakdown && (
            <Button
              variant={chartType === "composed" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("composed")}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Breakdown
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              currentNetWorth >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {formatCurrency(currentNetWorth)}
            </p>
            <p className="text-xs text-muted-foreground">Current Net Worth</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {netWorthChange > 0 ? (
                <ArrowUp className="h-4 w-4 text-green-600" />
              ) : netWorthChange < 0 ? (
                <ArrowDown className="h-4 w-4 text-red-600" />
              ) : (
                <Minus className="h-4 w-4 text-gray-600" />
              )}
              <p className={`text-2xl font-bold ${
                netWorthChange > 0 ? "text-green-600" : 
                netWorthChange < 0 ? "text-red-600" : "text-gray-600"
              }`}>
                {formatCurrency(Math.abs(netWorthChange))}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Recent Change ({netWorthChangePercentage.toFixed(2)}%)
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(currentAssets)}</p>
            <p className="text-xs text-muted-foreground">Total Assets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{formatCurrency(currentLiabilities)}</p>
            <p className="text-xs text-muted-foreground">Total Liabilities</p>
          </div>
        </div>

        {/* Period Summary */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-sm font-medium">{formatCurrency(minNetWorth)}</p>
              <p className="text-xs text-muted-foreground">Period Low</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{formatCurrency(maxNetWorth)}</p>
              <p className="text-xs text-muted-foreground">Period High</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              {totalChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : totalChange < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <Minus className="h-4 w-4 text-gray-600" />
              )}
              <span className={`text-sm font-medium ${
                totalChange > 0 ? "text-green-600" : 
                totalChange < 0 ? "text-red-600" : "text-gray-600"
              }`}>
                {formatCurrency(Math.abs(totalChange))} ({totalChangePercentage.toFixed(2)}%)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Total Period Change</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  )
}