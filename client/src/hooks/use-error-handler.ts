"use client"

import { useCallback } from "react"
import { toast } from "react-hot-toast"

export interface ApiError {
  statusCode: number
  message: string
  details?: any
  timestamp?: string
  path?: string
}

export interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  retryable?: boolean
  onRetry?: () => void
}

export function useErrorHandler() {
  const handleError = useCallback((error: unknown, options: ErrorHandlerOptions = {}) => {
    const { showToast = true, logError = true, retryable = false, onRetry } = options

    const errorInfo = parseError(error)

    // Log error
    if (logError) {
      console.error("Error handled:", errorInfo, error)
    }

    // Show user-friendly toast notification
    if (showToast) {
      const message = getUserFriendlyMessage(errorInfo)

      if (retryable && onRetry) {
        toast.error(message, {
          action: {
            label: "Retry",
            onClick: onRetry,
          },
        })
      } else {
        toast.error(message)
      }
    }

    return errorInfo
  }, [])

  const handleApiError = useCallback(
    (error: unknown, options?: ErrorHandlerOptions) => {
      return handleError(error, {
        ...options,
        showToast: true,
      })
    },
    [handleError],
  )

  const handleValidationError = useCallback(
    (error: unknown, options?: ErrorHandlerOptions) => {
      return handleError(error, {
        ...options,
        showToast: true,
        logError: false, // Validation errors are expected
      })
    },
    [handleError],
  )

  const handleNetworkError = useCallback(
    (error: unknown, options?: ErrorHandlerOptions) => {
      return handleError(error, {
        ...options,
        showToast: true,
        retryable: true,
      })
    },
    [handleError],
  )

  const handleSyncError = useCallback(
    (error: unknown, options?: ErrorHandlerOptions) => {
      return handleError(error, {
        ...options,
        showToast: true,
        retryable: true,
      })
    },
    [handleError],
  )

  // Wrapper for async functions
  const withErrorHandling = useCallback(
    <T extends any[], R>(fn: (...args: T) => Promise<R>, options?: ErrorHandlerOptions) => {
      return async (...args: T): Promise<R | null> => {
        try {
          return await fn(...args)
        } catch (error) {
          handleError(error, options)
          return null
        }
      }
    },
    [handleError],
  )

  // React Query error handler
  const createQueryErrorHandler = useCallback(
    (options?: ErrorHandlerOptions) => {
      return (error: unknown) => {
        handleApiError(error, options)
      }
    },
    [handleApiError],
  )

  return {
    handleError,
    handleApiError,
    handleValidationError,
    handleNetworkError,
    handleSyncError,
    withErrorHandling,
    createQueryErrorHandler,
  }
}

function parseError(error: unknown): ApiError {
  // Handle API errors
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as any).response
    if (response?.data) {
      return {
        statusCode: response.status || 500,
        message: response.data.message || "An error occurred",
        details: response.data.details,
        timestamp: response.data.timestamp,
        path: response.data.path,
      }
    }
  }

  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      statusCode: 0,
      message: "Network error - please check your connection",
      details: { type: "network_error" },
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      statusCode: 500,
      message: error.message,
      details: { type: "javascript_error", stack: error.stack },
    }
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      statusCode: 500,
      message: error,
      details: { type: "string_error" },
    }
  }

  // Handle unknown errors
  return {
    statusCode: 500,
    message: "An unknown error occurred",
    details: { type: "unknown_error", error: String(error) },
  }
}

function getUserFriendlyMessage(errorInfo: ApiError): string {
  const { statusCode, message, details } = errorInfo

  // Network errors
  if (statusCode === 0) {
    return "Unable to connect. Please check your internet connection."
  }

  // Client errors
  if (statusCode >= 400 && statusCode < 500) {
    switch (statusCode) {
      case 400:
        return details?.type === "validation_error"
          ? "Please check your input and try again."
          : message || "Invalid request. Please check your input."
      case 401:
        return "Please sign in to continue."
      case 403:
        return "You don't have permission to perform this action."
      case 404:
        return "The requested resource was not found."
      case 409:
        return "This data already exists. Please try with different information."
      case 422:
        return message || "Unable to process your request. Please check your input."
      case 429:
        return "Too many requests. Please wait a moment and try again."
      default:
        return message || "Something went wrong with your request."
    }
  }

  // Server errors
  if (statusCode >= 500) {
    switch (statusCode) {
      case 500:
        return "Server error. Please try again later."
      case 502:
        return "Service temporarily unavailable. Please try again."
      case 503:
        return "Service is currently under maintenance. Please try again later."
      case 504:
        return "Request timed out. Please try again."
      default:
        return "Server error. Please try again later."
    }
  }

  return message || "An unexpected error occurred."
}
