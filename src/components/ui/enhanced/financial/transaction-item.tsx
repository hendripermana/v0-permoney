"use client"

import { ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatShortDate } from "@/lib/utils"

interface TransactionItemProps {
  id: string
  description: string
  amount: number
  type: "income" | "expense" | "transfer"
  date: Date | string
  category?: string
  account?: string
  currency?: string
  onClick?: () => void
  className?: string
}

/**
 * TransactionItem - Reusable transaction display component
 * Standardized transaction row with proper financial styling
 */
export function TransactionItem({
  description,
  amount,
  type,
  date,
  category = "Uncategorized",
  account,
  currency = "IDR",
  onClick,
  className,
}: TransactionItemProps) {
  const isIncome = type === "income"
  const isExpense = type === "expense"
  const isTransfer = type === "transfer"

  const formattedDate = typeof date === "string" ? date : formatShortDate(date)

  const iconConfig = {
    income: {
      Icon: ArrowUpRight,
      bg: "bg-green-50 dark:bg-green-950",
      color: "text-green-600 dark:text-green-400",
    },
    expense: {
      Icon: ArrowDownRight,
      bg: "bg-red-50 dark:bg-red-950",
      color: "text-red-600 dark:text-red-400",
    },
    transfer: {
      Icon: RefreshCw,
      bg: "bg-blue-50 dark:bg-blue-950",
      color: "text-blue-600 dark:text-blue-400",
    },
  }

  const config = iconConfig[type]
  const Icon = config.Icon

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border bg-card",
        "transition-all duration-normal hover:shadow-elevation-2 hover:scale-[1.01]",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={cn("p-2 rounded-full shrink-0", config.bg)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body font-medium truncate">{description}</p>
          <div className="flex items-center gap-2 text-body-sm text-muted-foreground flex-wrap">
            <span>{formattedDate}</span>
            {account && (
              <>
                <span>•</span>
                <span className="truncate">{account}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right ml-4 shrink-0">
        <p
          className={cn(
            "text-body-lg font-semibold",
            isIncome && "text-green-600 dark:text-green-400",
            isExpense && "text-red-600 dark:text-red-400",
            isTransfer && "text-blue-600 dark:text-blue-400"
          )}
        >
          {isIncome ? "+" : isExpense ? "" : ""}
          {formatCurrency(Math.abs(amount), currency)}
        </p>
        <Badge
          variant="secondary"
          className="mt-1 text-xs"
        >
          {category}
        </Badge>
      </div>
    </div>
  )
}
