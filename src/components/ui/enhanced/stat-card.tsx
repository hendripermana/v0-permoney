"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
    direction?: "up" | "down" | "neutral"
  }
  badge?: {
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  variant?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
  isLoading?: boolean
}

const variantStyles = {
  default: "border-border",
  success: "border-success bg-success/5",
  warning: "border-warning bg-warning/5",
  danger: "border-danger bg-danger/5",
  info: "border-info bg-info/5",
}

const trendStyles = {
  up: "text-success",
  down: "text-danger",
  neutral: "text-neutral",
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  badge,
  variant = "default",
  className,
  isLoading = false,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    switch (trend.direction) {
      case "up":
        return <TrendingUp className="h-3 w-3" />
      case "down":
        return <TrendingDown className="h-3 w-3" />
      default:
        return <Minus className="h-3 w-3" />
    }
  }

  const trendDirection = trend?.direction || "neutral"

  if (isLoading) {
    return (
      <Card className={cn(variantStyles[variant], className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          {Icon && (
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          )}
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-3 w-40 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(variantStyles[variant], "transition-all hover:shadow-elevation-2", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon className={cn(
            "h-4 w-4",
            variant !== "default" && `text-${variant}`
          )} />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {badge && (
            <Badge variant={badge.variant || "secondary"} className="text-xs">
              {badge.label}
            </Badge>
          )}
        </div>
        {(description || trend) && (
          <div className="flex items-center justify-between mt-1">
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", trendStyles[trendDirection])}>
                {getTrendIcon()}
                <span>{Math.abs(trend.value)}%</span>
                {trend.label && (
                  <span className="text-muted-foreground ml-1">{trend.label}</span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
