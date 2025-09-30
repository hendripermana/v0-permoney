"use client"

import type { ReactNode } from "react"
import { useCallback, useMemo, useRef } from "react"

import {
  reducer,
  toast as primitiveToast,
  useToast as useToastStore,
} from "@/components/ui/use-toast"
import { ToastAction, type ToastProps } from "@/components/ui/toast"

type ToastVariant = NonNullable<ToastProps["variant"]>

type ToastActionConfig = {
  label: string
  onClick: () => void
}

interface BaseToastOptions {
  duration?: number
  action?: ToastActionConfig
  persistent?: boolean
  variant?: ToastVariant
  className?: string
}

interface ErrorToastOptions extends BaseToastOptions {
  retryable?: boolean
  onRetry?: () => void
}

type SyncStatus = "starting" | "progress" | "success" | "error"

interface SyncStatusOptions {
  toastId?: string
  message?: ReactNode
  progress?: number
  onRetry?: () => void
}

type ToastPayload = Parameters<typeof primitiveToast>[0]

type SyncToastEntry = {
  id: string
  update: ReturnType<typeof primitiveToast>["update"]
  dismiss: ReturnType<typeof primitiveToast>["dismiss"]
  lastPayload: ToastPayload
}

const buildActionElement = (action?: ToastActionConfig) => {
  if (!action) return undefined

  return (
    <ToastAction altText={action.label} onClick={action.onClick}>
      {action.label}
    </ToastAction>
  )
}

const persistentDuration = 60 * 60 * 1000 // 1 hour keeps the toast visible until manually dismissed

export function useToastActions() {
  const { toast: pushToast, dismiss } = useToastStore()
  const syncToastsRef = useRef<Map<string, SyncToastEntry>>(new Map())

  const showBaseToast = useCallback(
    (title: ReactNode, description?: ReactNode, options: BaseToastOptions = {}) => {
      const payload: ToastPayload = {
        title: (title ?? undefined) as ToastPayload["title"],
        description: (description ?? undefined) as ToastPayload["description"],
        variant: options.variant ?? "default",
        duration:
          typeof options.duration === "number"
            ? options.duration
            : options.persistent
              ? persistentDuration
              : undefined,
        className: options.className,
        action: buildActionElement(options.action),
      }

      const result = pushToast(payload)
      return result.id
    },
    [pushToast]
  )

  const showSuccess = useCallback(
    (title: ReactNode, description?: ReactNode, options: BaseToastOptions = {}) => {
      return showBaseToast(title, description, {
        ...options,
        variant: options.variant ?? "default",
      })
    },
    [showBaseToast]
  )

  const showWarning = useCallback(
    (title: ReactNode, description?: ReactNode, options: BaseToastOptions = {}) => {
      return showBaseToast(title, description, {
        ...options,
        className: options.className ?? "border-amber-200 bg-amber-50 text-amber-900",
      })
    },
    [showBaseToast]
  )

  const showError = useCallback(
    (title: ReactNode, description?: ReactNode, options: ErrorToastOptions = {}) => {
      const action = options.action ??
        (options.retryable && options.onRetry
          ? { label: "Retry", onClick: options.onRetry }
          : undefined)

      return showBaseToast(title, description, {
        ...options,
        action,
        variant: "destructive",
        persistent: options.persistent ?? options.retryable,
      })
    },
    [showBaseToast]
  )

  const showLoading = useCallback(
    (title: ReactNode, description?: ReactNode, options: BaseToastOptions = {}) => {
      return showBaseToast(title, description, {
        ...options,
        persistent: options.persistent ?? true,
        className:
          options.className ??
          "border-muted bg-muted text-muted-foreground [&>div]:flex [&>div]:items-center [&>div]:gap-2",
      })
    },
    [showBaseToast]
  )

  const syncStatusLabels: Record<SyncStatus, { title: string; defaultDescription: string; variant: ToastVariant }> = useMemo(
    () => ({
      starting: {
        title: "Sync in progress",
        defaultDescription: "We are syncing your latest changes...",
        variant: "default",
      },
      progress: {
        title: "Sync in progress",
        defaultDescription: "Synchronizing updates",
        variant: "default",
      },
      success: {
        title: "Sync completed",
        defaultDescription: "All data is up to date",
        variant: "default",
      },
      error: {
        title: "Sync failed",
        defaultDescription: "We could not sync your changes",
        variant: "destructive",
      },
    }),
    []
  )

  const showSyncStatus = useCallback(
    (status: SyncStatus, options: SyncStatusOptions = {}) => {
      const labels = syncStatusLabels[status]

      const parts: ReactNode[] = []
      if (options.message) {
        parts.push(options.message)
      } else {
        parts.push(labels.defaultDescription)
      }

      if (status === "progress" && typeof options.progress === "number") {
        parts.push(`Progress: ${Math.min(Math.max(options.progress, 0), 100)}%`)
      }

      const payload: ToastPayload = {
        title: labels.title,
        description: parts.length > 1 ? (
          <div className="space-y-1">
            {parts.map((part, index) => (
              <div key={index}>{part}</div>
            ))}
          </div>
        ) : (
          parts[0]
        ),
        variant: labels.variant,
        duration:
          status === "success"
            ? 2500
            : status === "error"
              ? 6000
              : persistentDuration,
        action:
          status === "error" && options.onRetry
            ? buildActionElement({ label: "Retry", onClick: options.onRetry })
            : undefined,
      }

      const existingId = options.toastId
      const existingEntry = existingId
        ? syncToastsRef.current.get(existingId)
        : undefined

      if (existingEntry) {
        existingEntry.update({ ...payload, id: existingEntry.id })
        existingEntry.lastPayload = payload

        if (status === "success" || status === "error") {
          const timeout = status === "success" ? 2500 : 6000
          window.setTimeout(() => {
            existingEntry.dismiss()
            syncToastsRef.current.delete(existingEntry.id)
          }, timeout)
        }

        return existingEntry.id
      }

      const result = pushToast(payload)

      syncToastsRef.current.set(result.id, {
        id: result.id,
        update: result.update,
        dismiss: result.dismiss,
        lastPayload: payload,
      })

      if (status === "success" || status === "error") {
        const timeout = status === "success" ? 2500 : 6000
        window.setTimeout(() => {
          result.dismiss()
          syncToastsRef.current.delete(result.id)
        }, timeout)
      }

      return result.id
    },
    [pushToast, syncStatusLabels]
  )

  return {
    showSuccess,
    showWarning,
    showError,
    showLoading,
    showSyncStatus,
    dismissToast: dismiss,
  }
}

export { useToastStore as useToast, primitiveToast as toast, reducer }
