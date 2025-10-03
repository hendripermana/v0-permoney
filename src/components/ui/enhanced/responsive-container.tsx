"use client"

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface ResponsiveContainerProps {
  children: ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  padding?: boolean
  className?: string
}

const sizeStyles = {
  sm: "max-w-container-sm",
  md: "max-w-container-md",
  lg: "max-w-container-lg",
  xl: "max-w-container-xl",
  full: "max-w-none",
}

export function ResponsiveContainer({
  children,
  size = "lg",
  padding = true,
  className,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        sizeStyles[size],
        padding && "px-4 md:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  )
}
