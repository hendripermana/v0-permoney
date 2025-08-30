interface ErrorReport {
  id: string
  timestamp: Date
  error: {
    name: string
    message: string
    stack?: string
  }
  context: {
    url: string
    userAgent: string
    userId?: string
    sessionId: string
    component?: string
    action?: string
  }
  severity: "low" | "medium" | "high" | "critical"
  fingerprint: string
  metadata: Record<string, any>
}

class ErrorTrackingService {
  private errors: ErrorReport[] = []
  private sessionId: string
  private maxErrors = 100

  constructor() {
    this.sessionId = this.generateSessionId()
    this.setupGlobalHandlers()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.captureError(event.reason, {
        component: "Global",
        action: "unhandledrejection",
        severity: "high",
      })
    })

    // Handle global JavaScript errors
    window.addEventListener("error", (event) => {
      this.captureError(event.error || new Error(event.message), {
        component: "Global",
        action: "javascript_error",
        severity: "medium",
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    })

    // Handle React error boundaries
    window.addEventListener("react-error", (event: any) => {
      this.captureError(event.detail.error, {
        component: event.detail.componentStack?.split("\n")[1]?.trim(),
        action: "react_error",
        severity: "high",
        metadata: {
          componentStack: event.detail.componentStack,
        },
      })
    })
  }

  captureError(
    error: Error | string,
    options: {
      component?: string
      action?: string
      severity?: "low" | "medium" | "high" | "critical"
      metadata?: Record<string, any>
      userId?: string
    } = {},
  ): string {
    const errorObj = typeof error === "string" ? new Error(error) : error
    const fingerprint = this.generateFingerprint(errorObj, options.component)

    const report: ErrorReport = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      error: {
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: options.userId || this.getUserId(),
        sessionId: this.sessionId,
        component: options.component,
        action: options.action,
      },
      severity: options.severity || this.determineSeverity(errorObj),
      fingerprint,
      metadata: {
        timestamp: Date.now(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        connection: (navigator as any).connection
          ? {
              effectiveType: (navigator as any).connection.effectiveType,
              downlink: (navigator as any).connection.downlink,
            }
          : null,
        ...options.metadata,
      },
    }

    this.addError(report)
    this.sendToServer(report)

    return report.id
  }

  private generateFingerprint(error: Error, component?: string): string {
    const key = `${error.name}-${error.message}-${component || "unknown"}`
    return btoa(key)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substr(0, 16)
  }

  private determineSeverity(error: Error): "low" | "medium" | "high" | "critical" {
    if (error.name === "ChunkLoadError" || error.message.includes("Loading chunk")) {
      return "low"
    }
    if (error.name === "NetworkError" || error.message.includes("fetch")) {
      return "medium"
    }
    if (error.name === "TypeError" || error.name === "ReferenceError") {
      return "high"
    }
    return "medium"
  }

  private getUserId(): string | undefined {
    // Get user ID from localStorage, cookies, or context
    return localStorage.getItem("userId") || undefined
  }

  private addError(report: ErrorReport) {
    this.errors.unshift(report)

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem("error-reports", JSON.stringify(this.errors.slice(0, 10)))
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private async sendToServer(report: ErrorReport) {
    try {
      await fetch("/api/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      })
    } catch (error) {
      console.warn("Failed to send error report to server:", error)
    }
  }

  // Public API
  getErrors(): ErrorReport[] {
    return [...this.errors]
  }

  getErrorsByFingerprint(fingerprint: string): ErrorReport[] {
    return this.errors.filter((error) => error.fingerprint === fingerprint)
  }

  clearErrors(): void {
    this.errors = []
    localStorage.removeItem("error-reports")
  }

  // Performance monitoring
  measurePerformance<T>(
    name: string,
    fn: () => T | Promise<T>,
    options: { component?: string; metadata?: Record<string, any> } = {},
  ): T | Promise<T> {
    const start = performance.now()

    try {
      const result = fn()

      if (result instanceof Promise) {
        return result
          .then((value) => {
            this.recordPerformance(name, performance.now() - start, options)
            return value
          })
          .catch((error) => {
            this.recordPerformance(name, performance.now() - start, options, error)
            throw error
          })
      } else {
        this.recordPerformance(name, performance.now() - start, options)
        return result
      }
    } catch (error) {
      this.recordPerformance(name, performance.now() - start, options, error)
      throw error
    }
  }

  private recordPerformance(
    name: string,
    duration: number,
    options: { component?: string; metadata?: Record<string, any> },
    error?: Error,
  ) {
    const performanceData = {
      name,
      duration,
      timestamp: Date.now(),
      component: options.component,
      metadata: options.metadata,
      error: error
        ? {
            name: error.name,
            message: error.message,
          }
        : null,
    }

    // Send performance data to server
    fetch("/api/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(performanceData),
    }).catch(() => {
      // Ignore errors when sending performance data
    })
  }
}

// Export singleton instance
export const errorTracking = new ErrorTrackingService()

// React hook for error tracking
export function useErrorTracking() {
  return {
    captureError: errorTracking.captureError.bind(errorTracking),
    measurePerformance: errorTracking.measurePerformance.bind(errorTracking),
    getErrors: errorTracking.getErrors.bind(errorTracking),
  }
}
