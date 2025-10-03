"use client"

import { useState, useCallback, useMemo } from "react"
import { Responsive, WidthProvider, Layout } from "react-grid-layout"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Settings, RotateCcw, Eye, EyeOff } from "lucide-react"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const ResponsiveGridLayout = WidthProvider(Responsive)

export interface GridLayoutConfig {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

interface DashboardGridProps {
  children: React.ReactNode
  layouts: {
    lg: GridLayoutConfig[]
    md: GridLayoutConfig[]
    sm: GridLayoutConfig[]
  }
  onLayoutChange?: (layouts: { [key: string]: GridLayoutConfig[] }) => void
  onResetLayout?: () => void
  isEditing?: boolean
  onToggleEdit?: () => void
  className?: string
}

export function DashboardGrid({
  children,
  layouts,
  onLayoutChange,
  onResetLayout,
  isEditing = false,
  onToggleEdit,
  className,
}: DashboardGridProps) {
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useMemo(() => {
    setMounted(true)
  }, [])

  const handleLayoutChange = useCallback(
    (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
      if (!isEditing || !onLayoutChange) return
      onLayoutChange(allLayouts as any)
    },
    [isEditing, onLayoutChange]
  )

  if (!mounted) {
    return (
      <div className={cn("space-y-6", className)}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Edit Mode Controls */}
      {onToggleEdit && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleEdit}
            className={cn(isEditing && "border-primary bg-primary/10")}
          >
            {isEditing ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Exit Edit Mode
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Customize Layout
              </>
            )}
          </Button>
          {isEditing && onResetLayout && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetLayout}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Layout
            </Button>
          )}
        </div>
      )}

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className={cn(
          "layout",
          isEditing && "editing-mode"
        )}
        layouts={layouts}
        breakpoints={{ lg: 1024, md: 768, sm: 640 }}
        cols={{ lg: 12, md: 8, sm: 4 }}
        rowHeight={60}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={handleLayoutChange}
        containerPadding={[0, 0]}
        margin={[16, 16]}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
      >
        {children}
      </ResponsiveGridLayout>

      {/* Edit Mode Overlay Hint */}
      {isEditing && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-elevation-3">
            Drag and resize widgets to customize your dashboard
          </div>
        </div>
      )}

      <style jsx global>{`
        .react-grid-layout {
          position: relative;
          transition: height 200ms ease;
        }
        
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }
        
        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }
        
        .react-grid-item.editing-mode .react-grid-item > .react-resizable-handle {
          display: block;
        }
        
        .react-grid-item > .react-resizable-handle {
          display: none;
        }
        
        .editing-mode .react-grid-item {
          cursor: move;
          border: 2px dashed hsl(var(--primary) / 0.3);
          border-radius: 0.5rem;
        }
        
        .editing-mode .react-grid-item:hover {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1);
        }
        
        .react-grid-item.react-grid-placeholder {
          background: hsl(var(--primary) / 0.1);
          opacity: 0.5;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 0.5rem;
          border: 2px dashed hsl(var(--primary));
        }
        
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
        }
        
        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 8px;
          height: 8px;
          border-right: 2px solid hsl(var(--primary));
          border-bottom: 2px solid hsl(var(--primary));
          border-radius: 0 0 4px 0;
        }
        
        .react-resizable-hide > .react-resizable-handle {
          display: none;
        }
      `}</style>
    </div>
  )
}
