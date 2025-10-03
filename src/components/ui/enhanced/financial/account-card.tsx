"use client"

import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

interface AccountCardProps {
  id: string
  name: string
  type: string
  subtype?: string
  balance: number
  currency?: string
  isActive?: boolean
  icon: LucideIcon
  actions?: React.ReactNode
  onClick?: () => void
  className?: string
}

/**
 * AccountCard - Reusable account card component
 * Standardized account display with financial styling
 */
export function AccountCard({
  name,
  type,
  subtype,
  balance,
  currency = "IDR",
  isActive = true,
  icon: Icon,
  actions,
  onClick,
  className,
}: AccountCardProps) {
  const isAsset = type === "ASSET"
  const isPositive = balance >= 0

  return (
    <Card
      className={cn(
        "transition-all duration-normal hover:shadow-elevation-3",
        onClick && "cursor-pointer hover:scale-[1.01]",
        className
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className={cn(
                "p-3 rounded-lg shrink-0",
                isAsset
                  ? "bg-green-50 dark:bg-green-950"
                  : "bg-red-50 dark:bg-red-950"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  isAsset
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-body-lg truncate">{name}</CardTitle>
              <CardDescription>
                {subtype || type} • {currency}
              </CardDescription>
            </div>
          </div>
          <Badge variant={isActive ? "default" : "secondary"} className="shrink-0 ml-2">
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p
              className={cn(
                "text-h3 font-bold",
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {formatCurrency(balance, currency)}
            </p>
            <p className="text-body-sm text-muted-foreground">Current Balance</p>
          </div>
          {actions && <div className="flex gap-2 ml-4">{actions}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
