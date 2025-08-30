"use client"

import { useState, useCallback } from "react"

interface ErrorLog {
  id: string
  message: string
  stack?: string
  timestamp: Date
  userId?: string
  url: string
  userAgent: string
  severity: "low" | "medium" | "high" | "critical"
}

export function useErrorTracking() {
  const [errors, setErrors] = useState<ErrorLog[]>([])

  const logError = useCallback((error: Error, severity: "low" | "medium" | "high" | "critical" = "medium") => {
    const errorLog: ErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      userId: localStorage.getItem("userId") || undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity,
    }

    setErrors((prev) => [errorLog, ...prev.slice(0, 99)]) // Keep last 100 errors

    fetch("/api/errors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorLog),
    }).catch((err) => {
      console.error("Failed to log error to backend:", err)
    })

    return errorLog.id
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const getErrorsBySeverity = useCallback(
    (severity: "low" | "medium" | "high" | "critical") => {
      return errors.filter((error) => error.severity === severity)
    },
    [errors],
  )

  return {
    errors,
    logError,
    clearErrors,
    getErrorsBySeverity,
  }
}
