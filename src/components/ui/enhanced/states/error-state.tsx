"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
  variant?: "default" | "card" | "inline"
  fullPage?: boolean
}

/**
 * ErrorState - Unified error display component
 * Provides consistent error UI across the app
 */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
  variant = "default",
  fullPage = false,
}: ErrorStateProps) {
  const content = (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="rounded-full bg-red-50 dark:bg-red-950 p-3">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-h4 font-semibold">{title}</h3>
        <p className="text-body-sm text-muted-foreground max-w-md mx-auto">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  )

  if (variant === "card") {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {onRetry && (
          <CardContent>
            <Button onClick={onRetry} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        )}
      </Card>
    )
  }

  if (variant === "inline") {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{message}</span>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="ml-4">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (fullPage) {
    return (
      <div className={cn("flex min-h-[400px] items-center justify-center", className)}>
        {content}
      </div>
    )
  }

  return (
    <div className={cn("py-12", className)}>
      {content}
    </div>
  )
}
