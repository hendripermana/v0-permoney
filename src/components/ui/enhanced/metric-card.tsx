"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  subtitle?: string
  change?: {
    value: number
    isPositive?: boolean
    label?: string
  }
  sparkline?: number[]
  color?: "green" | "red" | "blue" | "purple" | "orange"
  size?: "sm" | "md" | "lg"
  className?: string
}

const colorStyles = {
  green: "text-green-600 bg-green-50 dark:bg-green-950",
  red: "text-red-600 bg-red-50 dark:bg-red-950",
  blue: "text-blue-600 bg-blue-50 dark:bg-blue-950",
  purple: "text-purple-600 bg-purple-50 dark:bg-purple-950",
  orange: "text-orange-600 bg-orange-50 dark:bg-orange-950",
}

const sizeStyles = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
}

const valueSizeStyles = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
  change,
  sparkline,
  color = "blue",
  size = "md",
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("transition-all hover:shadow-elevation-2", className)}>
      <CardHeader className={cn("flex flex-row items-center justify-between space-y-0", sizeStyles[size])}>
        <div className="space-y-1 flex-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={cn("font-bold", valueSizeStyles[size])}>
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {change && (
            <div className={cn(
              "text-xs font-medium inline-flex items-center gap-1",
              change.isPositive ? "text-green-600" : "text-red-600"
            )}>
              <span>{change.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(change.value)}%</span>
              {change.label && (
                <span className="text-muted-foreground">{change.label}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-full", colorStyles[color])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardHeader>
      {sparkline && sparkline.length > 0 && (
        <CardContent className="pb-4">
          <div className="flex items-end gap-1 h-12">
            {sparkline.map((value, index) => {
              const maxValue = Math.max(...sparkline)
              const height = (value / maxValue) * 100
              return (
                <div
                  key={index}
                  className={cn("flex-1 rounded-sm transition-all", colorStyles[color])}
                  style={{ height: `${height}%` }}
                />
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
