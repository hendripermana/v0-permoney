/**
 * Hook to manage dashboard layout state and persistence
 */

import { useState, useEffect, useCallback } from 'react'
import {
  DashboardLayout,
  GridLayout,
  WidgetConfig,
  loadLayout,
  saveLayout,
  resetLayout as resetStoredLayout,
  getDefaultLayout,
} from '@/lib/layout/layout-storage'

export function useDashboardLayout(userId: string) {
  const [layout, setLayout] = useState<DashboardLayout>(() => getDefaultLayout())
  const [isEditing, setIsEditing] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load layout on mount
  useEffect(() => {
    if (userId) {
      const loaded = loadLayout(userId)
      setLayout({ ...loaded, userId })
      setMounted(true)
    }
  }, [userId])

  // Save layout when it changes (debounced)
  useEffect(() => {
    if (!mounted || !userId) return

    const timeoutId = setTimeout(() => {
      saveLayout(layout)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [layout, userId, mounted])

  const handleLayoutChange = useCallback(
    (newLayouts: { [key: string]: GridLayout[] }) => {
      setLayout((prev) => ({
        ...prev,
        layouts: {
          lg: newLayouts.lg || prev.layouts.lg,
          md: newLayouts.md || prev.layouts.md,
          sm: newLayouts.sm || prev.layouts.sm,
        },
      }))
    },
    []
  )

  const toggleWidget = useCallback((widgetId: string) => {
    setLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.map((widget) =>
        widget.id === widgetId
          ? { ...widget, visible: !widget.visible }
          : widget
      ),
    }))
  }, [])

  const updateWidgetSettings = useCallback(
    (widgetId: string, settings: Record<string, any>) => {
      setLayout((prev) => ({
        ...prev,
        widgets: prev.widgets.map((widget) =>
          widget.id === widgetId
            ? { ...widget, settings: { ...widget.settings, ...settings } }
            : widget
        ),
      }))
    },
    []
  )

  const resetLayout = useCallback(() => {
    if (userId) {
      resetStoredLayout(userId)
      const defaultLayout = getDefaultLayout()
      setLayout({ ...defaultLayout, userId })
    }
  }, [userId])

  const toggleEditMode = useCallback(() => {
    setIsEditing((prev) => !prev)
  }, [])

  return {
    layout,
    isEditing,
    mounted,
    visibleWidgets: layout.widgets.filter((w) => w.visible),
    handleLayoutChange,
    toggleWidget,
    updateWidgetSettings,
    resetLayout,
    toggleEditMode,
  }
}
