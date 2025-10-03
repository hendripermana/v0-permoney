"use client"

import { cn } from "@/lib/utils"
import { type ReactNode } from "react"

interface PageContainerProps {
  children: ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  className?: string
  noPadding?: boolean
}

const sizeStyles = {
  sm: "max-w-container-sm",
  md: "max-w-container-md",
  lg: "max-w-container-lg",
  xl: "max-w-none", // Changed from max-w-container-xl to use full width
  full: "max-w-none",
}

/**
 * PageContainer - Standard container for all pages
 * Provides consistent max-width, padding, and responsive behavior
 * Fixes deadspace issues by ensuring full-width usage
 */
export function PageContainer({
  children,
  size = "xl",
  className,
  noPadding = false,
}: PageContainerProps) {
  // For xl and full sizes, don't use mx-auto as it can cause centering issues
  const shouldCenter = size !== "xl" && size !== "full"
  
  return (
    <div
      className={cn(
        "w-full",
        shouldCenter && "mx-auto",
        sizeStyles[size],
        !noPadding && "p-4 md:p-6 lg:p-8",
        className
      )}
    >
      {children}
    </div>
  )
}
