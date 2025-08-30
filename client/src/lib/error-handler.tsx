"use client"

import React from "react"

export interface ErrorContext {
  userId?: string
  householdId?: string
  component?: string
  action?: string
  timestamp: Date
  userAgent: string
  url: string
  metadata?: Record<string, any>
}

export interface ErrorRecoveryStrategy {
  canRecover: (error: Error) => boolean
  recover: (error: Error, context: ErrorContext) => Promise<boolean>
  maxRetries: number
  backoffMs: number
}

export class ClientErrorHandler {
  private static instance: ClientErrorHandler
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = []
  private recoveryStrategies: ErrorRecoveryStrategy[] = []
  private isOnline = navigator.onLine
  private retryAttempts = new Map<string, number>()

  private constructor() {
    this.initializeErrorHandling()
    this.setupRecoveryStrategies()
    this.startErrorProcessing()
  }

  public static getInstance(): ClientErrorHandler {
    if (!ClientErrorHandler.instance) {
      ClientErrorHandler.instance = new ClientErrorHandler()
    }
    return ClientErrorHandler.instance
  }

  private initializeErrorHandling(): void {
    // Global error handlers
    window.addEventListener("error", (event) => {
      this.handleError(new Error(event.message), {
        component: "global",
        action: "script_error",
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    })

    window.addEventListener("unhandledrejection", (event) => {
      this.handleError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
        component: "global",
        action: "unhandled_promise_rejection",
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
    })

    // Network status monitoring
    window.addEventListener("online", () => {
      this.isOnline = true
      this.processQueuedErrors()
    })

    window.addEventListener("offline", () => {
      this.isOnline = false
    })

    // React error boundary integration
    this.setupReactErrorBoundary()
  }

  private setupRecoveryStrategies(): void {
    // Network error recovery
    this.recoveryStrategies.push({
      canRecover: (error) =>
        error.message.includes("fetch") || error.message.includes("network") || error.message.includes("timeout"),
      recover: async (error, context) => {
        if (!this.isOnline) return false

        const retryKey = `${context.component}-${context.action}`
        const attempts = this.retryAttempts.get(retryKey) || 0

        if (attempts >= 3) return false

        this.retryAttempts.set(retryKey, attempts + 1)

        // Exponential backoff
        await this.delay(Math.pow(2, attempts) * 1000)

        return true
      },
      maxRetries: 3,
      backoffMs: 1000,
    })

    // Authentication error recovery
    this.recoveryStrategies.push({
      canRecover: (error) => error.message.includes("401") || error.message.includes("unauthorized"),
      recover: async (error, context) => {
        try {
          // Attempt to refresh token
          const response = await fetch("/api/v1/auth/refresh", {
            method: "POST",
            credentials: "include",
          })

          if (response.ok) {
            // Clear retry attempts for this context
            const retryKey = `${context.component}-${context.action}`
            this.retryAttempts.delete(retryKey)
            return true
          }

          // Redirect to login if refresh fails
          window.location.href = "/login?reason=session-expired"
          return false
        } catch {
          return false
        }
      },
      maxRetries: 1,
      backoffMs: 0,
    })

    // Data validation error recovery
    this.recoveryStrategies.push({
      canRecover: (error) => error.message.includes("validation") || error.message.includes("invalid"),
      recover: async (error, context) => {
        // Show user-friendly validation error
        this.showUserFriendlyError(error, context)
        return false // Don't retry validation errors
      },
      maxRetries: 0,
      backoffMs: 0,
    })
  }

  private setupReactErrorBoundary(): void {
    // This would be used with a React Error Boundary component
    ;(window as any).__REACT_ERROR_HANDLER__ = (error: Error, errorInfo: any) => {
      this.handleError(error, {
        component: errorInfo.componentStack?.split("\n")[1]?.trim() || "unknown",
        action: "render_error",
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        metadata: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      })
    }
  }

  public async handleError(error: Error, context: ErrorContext): Promise<void> {
    // Enhance context with user info if available
    const enhancedContext = {
      ...context,
      userId: this.getCurrentUserId(),
      householdId: this.getCurrentHouseholdId(),
    }

    // Try recovery strategies
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error)) {
        try {
          const recovered = await strategy.recover(error, enhancedContext)
          if (recovered) {
            console.log("Error recovered successfully:", error.message)
            return
          }
        } catch (recoveryError) {
          console.error("Recovery strategy failed:", recoveryError)
        }
        break
      }
    }

    // Queue error for reporting
    this.errorQueue.push({ error, context: enhancedContext })

    // Process immediately if online, otherwise queue for later
    if (this.isOnline) {
      this.processQueuedErrors()
    }

    // Show user notification for critical errors
    if (this.isCriticalError(error)) {
      this.showCriticalErrorNotification(error, enhancedContext)
    }
  }

  private async processQueuedErrors(): Promise<void> {
    if (!this.isOnline || this.errorQueue.length === 0) return

    const errorsToProcess = [...this.errorQueue]
    this.errorQueue = []

    for (const { error, context } of errorsToProcess) {
      try {
        await this.reportError(error, context)
      } catch (reportError) {
        // Re-queue if reporting fails
        this.errorQueue.push({ error, context })
        console.error("Failed to report error:", reportError)
      }
    }
  }

  private async reportError(error: Error, context: ErrorContext): Promise<void> {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      fingerprint: this.generateErrorFingerprint(error, context),
      severity: this.determineSeverity(error, context),
      tags: this.generateTags(error, context),
    }

    await fetch("/api/v1/errors/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(errorReport),
    })
  }

  private generateErrorFingerprint(error: Error, context: ErrorContext): string {
    const key = `${error.name}-${error.message}-${context.component}-${context.action}`
    return btoa(key).substring(0, 16)
  }

  private determineSeverity(error: Error, context: ErrorContext): "low" | "medium" | "high" | "critical" {
    if (context.component === "global" || error.message.includes("ChunkLoadError")) {
      return "critical"
    }

    if (error.message.includes("network") || error.message.includes("fetch")) {
      return "medium"
    }

    if (error.message.includes("validation")) {
      return "low"
    }

    return "medium"
  }

  private generateTags(error: Error, context: ErrorContext): string[] {
    const tags = [`component:${context.component}`, `action:${context.action}`, `error_type:${error.name}`]

    if (context.userId) tags.push(`user:${context.userId}`)
    if (context.householdId) tags.push(`household:${context.householdId}`)

    return tags
  }

  private isCriticalError(error: Error): boolean {
    return (
      error.message.includes("ChunkLoadError") ||
      error.message.includes("Loading chunk") ||
      error.name === "ChunkLoadError" ||
      error.message.includes("Script error")
    )
  }

  private showCriticalErrorNotification(error: Error, context: ErrorContext): void {
    // This would integrate with your notification system
    console.error("Critical error occurred:", error.message)

    // Show user-friendly message
    if (error.message.includes("ChunkLoadError")) {
      this.showReloadPrompt()
    }
  }

  private showUserFriendlyError(error: Error, context: ErrorContext): void {
    // This would integrate with your toast/notification system
    console.warn("User-friendly error:", error.message)
  }

  private showReloadPrompt(): void {
    if (confirm("The application needs to be reloaded to fix a loading issue. Reload now?")) {
      window.location.reload()
    }
  }

  private startErrorProcessing(): void {
    // Process queued errors every 30 seconds
    setInterval(() => {
      this.processQueuedErrors()
    }, 30000)

    // Clean up old retry attempts every 5 minutes
    setInterval(() => {
      this.retryAttempts.clear()
    }, 300000)
  }

  private getCurrentUserId(): string | undefined {
    // Extract from localStorage, context, or auth state
    return localStorage.getItem("userId") || undefined
  }

  private getCurrentHouseholdId(): string | undefined {
    // Extract from localStorage, context, or auth state
    return localStorage.getItem("householdId") || undefined
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Public API for manual error reporting
  public reportManualError(error: Error, component: string, action: string, metadata?: Record<string, any>): void {
    this.handleError(error, {
      component,
      action,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata,
    })
  }

  // Get error statistics
  public getErrorStats(): { queuedErrors: number; isOnline: boolean; retryAttempts: number } {
    return {
      queuedErrors: this.errorQueue.length,
      isOnline: this.isOnline,
      retryAttempts: this.retryAttempts.size,
    }
  }
}

// Initialize global error handler
export const errorHandler = ClientErrorHandler.getInstance()

// React Error Boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorHandler.reportManualError(error, "ErrorBoundary", "componentDidCatch", {
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} />
    }

    return this.props.children
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-800">Something went wrong</h3>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-4">
        We've encountered an unexpected error. Our team has been notified and is working on a fix.
      </div>
      <div className="flex space-x-3">
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Reload Page
        </button>
        <button
          onClick={() => window.history.back()}
          className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
)
