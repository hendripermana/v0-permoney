"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface LoadingStateProps {
  message?: string
  fullPage?: boolean
  className?: string
  variant?: "default" | "card" | "inline"
}

/**
 * LoadingState - Unified loading component
 * Provides consistent loading UI across the app
 */
export function LoadingState({
  message = "Loading...",
  fullPage = false,
  className,
  variant = "default",
}: LoadingStateProps) {
  const content = (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="text-body text-muted-foreground">{message}</span>
    </div>
  )

  if (variant === "card") {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          {content}
        </CardContent>
      </Card>
    )
  }

  if (variant === "inline") {
    return content
  }

  if (fullPage) {
    return (
      <div className={cn("flex min-h-[400px] items-center justify-center", className)}>
        {content}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      {content}
    </div>
  )
}

/**
 * LoadingSkeleton - For card-based loading states
 */
export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="py-6">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
