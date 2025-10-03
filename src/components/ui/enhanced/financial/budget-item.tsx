"use client"

import { Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"

interface BudgetItemProps {
  id: string
  category: string
  spent: number
  budgeted: number
  remaining: number
  percentage: number
  transactions?: number
  currency?: string
  onClick?: () => void
  className?: string
}

/**
 * BudgetItem - Reusable budget card component
 * Standardized budget display with progress tracking
 */
export function BudgetItem({
  category,
  spent,
  budgeted,
  remaining,
  percentage,
  transactions = 0,
  currency = "IDR",
  onClick,
  className,
}: BudgetItemProps) {
  const status = percentage >= 90 ? "danger" : percentage >= 75 ? "warning" : "success"
  
  const statusConfig = {
    success: {
      bg: "bg-green-50 dark:bg-green-950",
      color: "text-green-600 dark:text-green-400",
      badge: "default" as const,
      badgeClassName: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
      label: "On track",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-950",
      color: "text-yellow-600 dark:text-yellow-400",
      badge: "default" as const,
      badgeClassName: "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
      label: "Monitor usage",
    },
    danger: {
      bg: "bg-red-50 dark:bg-red-950",
      color: "text-red-600 dark:text-red-400",
      badge: "destructive" as const,
      badgeClassName: "",
      label: "Over target",
    },
  }

  const config = statusConfig[status]

  return (
    <Card
      className={cn(
        "transition-all duration-normal hover:shadow-elevation-3",
        onClick && "cursor-pointer hover:scale-[1.01]",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-body-lg truncate">{category}</CardTitle>
          <CardDescription>
            {transactions} transaction{transactions !== 1 ? "s" : ""} this period
          </CardDescription>
        </div>
        <div className={cn("p-2 rounded-full shrink-0 ml-4", config.bg)}>
          <Target className={cn("h-5 w-5", config.color)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center text-body-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">
            {formatCurrency(spent, currency)} / {formatCurrency(budgeted, currency)}
          </span>
        </div>

        <Progress value={Math.min(percentage, 100)} className="h-2" />

        <div className="flex justify-between items-center">
          <Badge variant={config.badge} className={config.badgeClassName}>
            {percentage.toFixed(1)}% used
          </Badge>
          <span className={cn("text-xs font-medium", config.color)}>
            {config.label}
          </span>
        </div>

        <div className="pt-2 border-t flex justify-between items-center">
          <span className="text-body-sm text-muted-foreground">Remaining</span>
          <span className={cn(
            "text-body font-semibold",
            remaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {formatCurrency(remaining, currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
