import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, BarChart3, PieChart } from "lucide-react"

export default function AnalyticsPage() {
  const insights = [
    {
      title: "Spending Trend",
      description: "Your spending decreased by 15% this month",
      trend: "down",
      value: "15%",
      icon: TrendingDown,
      color: "text-green-600",
    },
    {
      title: "Income Growth",
      description: "Income increased compared to last month",
      trend: "up",
      value: "8%",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Budget Performance",
      description: "You're under budget in 4 out of 6 categories",
      trend: "neutral",
      value: "67%",
      icon: PieChart,
      color: "text-blue-600",
    },
  ]

  const categorySpending = [
    { category: "Food & Dining", amount: 3500000, percentage: 35 },
    { category: "Transportation", amount: 2000000, percentage: 20 },
    { category: "Shopping", amount: 1500000, percentage: 15 },
    { category: "Entertainment", amount: 1200000, percentage: 12 },
    { category: "Utilities", amount: 1000000, percentage: 10 },
    { category: "Others", amount: 800000, percentage: 8 },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Insights and analysis of your financial patterns</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, index) => {
          const IconComponent = insight.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${insight.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${insight.color}`}>
                  {insight.trend === "up" && "+"}
                  {insight.trend === "down" && "-"}
                  {insight.value}
                </div>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Your spending breakdown for this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categorySpending.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full" />
                  <span className="text-sm font-medium">{item.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{formatCurrency(item.amount)}</span>
                  <Badge variant="secondary">{item.percentage}%</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-800">Average Income</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(12500000)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-red-800">Average Expenses</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(10000000)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
