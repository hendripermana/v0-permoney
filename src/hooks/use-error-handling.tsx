"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "@/hooks/use-toast"

// Error types
export interface AppError {
  message: string
  code?: string
  status?: number
  details?: any
  timestamp: Date
  context?: string
}

// Error severity levels
export type ErrorSeverity = "low" | "medium" | "high" | "critical"

// Error handling configuration
interface ErrorHandlingConfig {
  showToast?: boolean
  logToConsole?: boolean
  reportToService?: boolean
  severity?: ErrorSeverity
  context?: string
}

// Default configuration
const DEFAULT_CONFIG: ErrorHandlingConfig = {
  showToast: true,
  logToConsole: true,
  reportToService: false,
  severity: "medium",
}

// Error classification
export function classifyError(error: any): { type: string; severity: ErrorSeverity; userMessage: string } {
  // Network errors
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return {
      type: "network",
      severity: "high",
      userMessage: "Unable to connect to the server. Please check your internet connection.",
    }
  }

  // Authentication errors
  if (error.status === 401 || error.code === "UNAUTHORIZED") {
    return {
      type: "auth",
      severity: "high",
      userMessage: "Your session has expired. Please log in again.",
    }
  }

  // Permission errors
  if (error.status === 403 || error.code === "FORBIDDEN") {
    return {
      type: "permission",
      severity: "medium",
      userMessage: "You don't have permission to perform this action.",
    }
  }

  // Not found errors
  if (error.status === 404 || error.code === "NOT_FOUND") {
    return {
      type: "not_found",
      severity: "low",
      userMessage: "The requested resource was not found.",
    }
  }

  // Validation errors
  if (error.status === 400 || error.code === "VALIDATION_ERROR") {
    return {
      type: "validation",
      severity: "low",
      userMessage: error.message || "Please check your input and try again.",
    }
  }

  // Server errors
  if (error.status >= 500 || error.code === "INTERNAL_ERROR") {
    return {
      type: "server",
      severity: "critical",
      userMessage: "A server error occurred. Our team has been notified.",
    }
  }

  // Rate limiting
  if (error.status === 429 || error.code === "RATE_LIMIT") {
    return {
      type: "rate_limit",
      severity: "medium",
      userMessage: "Too many requests. Please wait a moment and try again.",
    }
  }

  // Chunk loading errors (common in SPAs)
  if (error.name === "ChunkLoadError" || error.message.includes("Loading chunk")) {
    return {
      type: "chunk_load",
      severity: "medium",
      userMessage: "The application has been updated. Please refresh the page.",
    }
  }

  // Generic errors
  return {
    type: "generic",
    severity: "medium",
    userMessage: error.message || "An unexpected error occurred. Please try again.",
  }
}

// Error reporting service (mock implementation)
function reportError(error: AppError, config: ErrorHandlingConfig) {
  if (!config.reportToService) return

  // In a real application, this would send to a service like Sentry, LogRocket, etc.
  console.log("Reporting error to service:", {
    message: error.message,
    code: error.code,
    status: error.status,
    context: error.context,
    severity: config.severity,
    timestamp: error.timestamp,
    userAgent: navigator.userAgent,
    url: window.location.href,
  })
}

// Main error handling hook
export function useErrorHandling(defaultConfig?: Partial<ErrorHandlingConfig>) {
  const [errors, setErrors] = useState<AppError[]>([])
  const [isRetrying, setIsRetrying] = useState(false)

  const config = { ...DEFAULT_CONFIG, ...defaultConfig }

  const handleError = useCallback(
    (error: any, customConfig?: Partial<ErrorHandlingConfig>) => {
      const finalConfig = { ...config, ...customConfig }
      const classification = classifyError(error)
      
      const appError: AppError = {
        message: error.message || "Unknown error",
        code: error.code,
        status: error.status,
        details: error,
        timestamp: new Date(),
        context: finalConfig.context,
      }

      // Add to errors list
      setErrors(prev => [appError, ...prev.slice(0, 9)]) // Keep last 10 errors

      // Log to console
      if (finalConfig.logToConsole) {
        console.error(`[${classification.severity.toUpperCase()}] ${classification.type}:`, appError)
      }

      // Show toast notification
      if (finalConfig.showToast) {
        toast({
          title: "Error",
          description: classification.userMessage,
          variant: "destructive",
        })
      }

      // Report to error service
      reportError(appError, { ...finalConfig, severity: classification.severity })

      return appError
    },
    [config]
  )

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const removeError = useCallback((timestamp: Date) => {
    setErrors(prev => prev.filter(error => error.timestamp !== timestamp))
  }, [])

  const retry = useCallback(async (operation: () => Promise<any>, maxRetries = 3) => {
    setIsRetrying(true)
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation()
        setIsRetrying(false)
        return result
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries) {
          handleError(error, { context: `Failed after ${maxRetries} attempts` })
          break
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    setIsRetrying(false)
    throw lastError
  }, [handleError])

  return {
    errors,
    handleError,
    clearErrors,
    removeError,
    retry,
    isRetrying,
  }
}

// Async operation wrapper with error handling
export function useAsyncOperation<T = any>() {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const { handleError, retry } = useErrorHandling()

  const execute = useCallback(
    async (operation: () => Promise<T>, config?: Partial<ErrorHandlingConfig>) => {
      setLoading(true)
      setError(null)

      try {
        const result = await operation()
        setData(result)
        return result
      } catch (err) {
        const appError = handleError(err, config)
        setError(appError)
        throw appError
      } finally {
        setLoading(false)
      }
    },
    [handleError]
  )

  const retryOperation = useCallback(
    async (operation: () => Promise<T>, maxRetries = 3) => {
      setLoading(true)
      setError(null)

      try {
        const result = await retry(operation, maxRetries)
        setData(result)
        return result
      } catch (err) {
        const appError = handleError(err)
        setError(appError)
        throw appError
      } finally {
        setLoading(false)
      }
    },
    [retry, handleError]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    retryOperation,
    reset,
  }
}

// Network status hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<string | undefined>()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Get connection info if available
    if ("connection" in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection?.effectiveType)

      const handleConnectionChange = () => {
        setConnectionType(connection?.effectiveType)
      }

      connection?.addEventListener("change", handleConnectionChange)

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
        connection?.removeEventListener("change", handleConnectionChange)
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return { isOnline, connectionType }
}

// Error boundary hook for functional components
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null)

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  const captureError = useCallback((error: Error) => {
    setError(error)
  }, [])

  useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

// Utility functions
export const errorUtils = {
  isNetworkError: (error: any) => {
    return error.name === "TypeError" && error.message.includes("fetch")
  },

  isAuthError: (error: any) => {
    return error.status === 401 || error.code === "UNAUTHORIZED"
  },

  isValidationError: (error: any) => {
    return error.status === 400 || error.code === "VALIDATION_ERROR"
  },

  isServerError: (error: any) => {
    return error.status >= 500 || error.code === "INTERNAL_ERROR"
  },

  formatErrorMessage: (error: any) => {
    const classification = classifyError(error)
    return classification.userMessage
  },
}