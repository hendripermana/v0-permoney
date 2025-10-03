"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GripVertical, Eye, EyeOff, Settings } from "lucide-react"

interface WidgetWrapperProps {
  id: string
  title: string
  children: React.ReactNode
  isEditing?: boolean
  onToggleVisibility?: (id: string) => void
  onSettings?: (id: string) => void
  className?: string
}

export function WidgetWrapper({
  id,
  title,
  children,
  isEditing = false,
  onToggleVisibility,
  onSettings,
  className,
}: WidgetWrapperProps) {
  return (
    <Card className={cn(
      "h-full flex flex-col overflow-hidden transition-all",
      isEditing && "ring-2 ring-primary/20",
      className
    )}>
      {/* Widget Header */}
      {isEditing && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            {onSettings && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onSettings(id)}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            )}
            {onToggleVisibility && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onToggleVisibility(id)}
              >
                <EyeOff className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Widget Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </Card>
  )
}
