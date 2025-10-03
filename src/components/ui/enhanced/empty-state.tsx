"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon, Plus } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  variant?: "default" | "minimal" | "card"
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const ActionIcon = action?.icon || Plus

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      variant === "minimal" ? "py-8" : "py-12",
      className
    )}>
      {Icon && (
        <div className={cn(
          "rounded-full bg-muted flex items-center justify-center mb-4",
          variant === "minimal" ? "p-3" : "p-4"
        )}>
          <Icon className={cn(
            "text-muted-foreground",
            variant === "minimal" ? "h-6 w-6" : "h-8 w-8"
          )} />
        </div>
      )}
      <h3 className={cn(
        "font-semibold",
        variant === "minimal" ? "text-base" : "text-lg"
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          "text-muted-foreground max-w-sm mt-2",
          variant === "minimal" ? "text-sm" : "text-base"
        )}>
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          size={variant === "minimal" ? "sm" : "default"}
          className="mt-4"
        >
          <ActionIcon className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  )

  if (variant === "card") {
    return (
      <Card className={className}>
        {content}
      </Card>
    )
  }

  return content
}
