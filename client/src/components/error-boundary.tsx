"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to error reporting service
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem("userId") || "anonymous",
      sessionId: sessionStorage.getItem("sessionId") || "unknown",
    }

    if (process.env.NODE_ENV === "production") {
      // Send to backend error tracking endpoint
      fetch("/api/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      }).catch((err) => {
        console.error("Failed to log error to service:", err)
      })
    } else {
      console.error("Error details:", errorData)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  private handleGoHome = () => {
    window.location.href = "/"
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReportError = () => {
    const errorData = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      userDescription: prompt("Please describe what you were doing when this error occurred:"),
    }

    fetch("/api/errors/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorData),
    })
      .then(() => {
        alert("Thank you for reporting this error. We will investigate it.")
      })
      .catch(() => {
        alert("Failed to report error. Please try again later.")
      })
  }

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                We encountered an unexpected error. This has been logged and we&apos;ll look into it.
              </CardDescription>
              {this.state.errorId && (
                <div className="text-xs text-muted-foreground mt-2">Error ID: {this.state.errorId}</div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium mb-2">Error Details (Development)</summary>
                  <div className="bg-muted p-3 rounded-md overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="w-full bg-transparent">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                <Button onClick={this.handleReportError} variant="ghost" className="w-full">
                  <Bug className="w-4 h-4 mr-2" />
                  Report Error
                </Button>
                <Button onClick={this.handleReload} variant="ghost" className="w-full text-xs">
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error("Error caught by useErrorHandler:", error, errorInfo)

    const errorData = {
      errorId: `hook_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem("userId") || "anonymous",
      sessionId: sessionStorage.getItem("sessionId") || "unknown",
    }

    // Log to error service
    if (process.env.NODE_ENV === "production") {
      fetch("/api/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      }).catch((err) => {
        console.error("Failed to log error to service:", err)
      })
    } else {
      console.error("Error details:", errorData)
    }
  }
}
