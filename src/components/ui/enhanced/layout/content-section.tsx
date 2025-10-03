"use client"

import { cn } from "@/lib/utils"
import { type ReactNode } from "react"

interface ContentSectionProps {
  children: ReactNode
  className?: string
  spacing?: "sm" | "md" | "lg" | "xl"
}

const spacingStyles = {
  sm: "space-y-4",
  md: "space-y-6",
  lg: "space-y-8",
  xl: "space-y-12",
}

/**
 * ContentSection - Wrapper for content sections
 * Provides consistent spacing between sections
 */
export function ContentSection({
  children,
  className,
  spacing = "lg",
}: ContentSectionProps) {
  return (
    <div className={cn(spacingStyles[spacing], className)}>
      {children}
    </div>
  )
}
