"use client"

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface DataGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: "sm" | "md" | "lg"
  responsive?: boolean
  className?: string
}

const columnStyles = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
}

const gapStyles = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
}

export function DataGrid({
  children,
  columns = 3,
  gap = "md",
  responsive = true,
  className,
}: DataGridProps) {
  return (
    <div
      className={cn(
        "w-full grid",
        responsive ? columnStyles[columns] : `grid-cols-${columns}`,
        gapStyles[gap],
        className
      )}
    >
      {children}
    </div>
  )
}
