import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props}>
      <div className="p-6 space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
      </div>
    </div>
  )
}

function SkeletonText({ className, lines = 3, ...props }: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

type SkeletonAvatarSize = "sm" | "md" | "lg"

function SkeletonAvatar({
  className,
  size = "md",
  showText = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: SkeletonAvatarSize; showText?: boolean }) {
  const avatarSizes: Record<SkeletonAvatarSize, string> = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  return (
    <div className={cn("flex items-center space-x-4", className)} {...props}>
      <Skeleton className={cn("rounded-full", avatarSizes[size])} />
      {showText && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      )}
    </div>
  )
}

function SkeletonTable({ className, rows = 5, columns = 4, ...props }: React.HTMLAttributes<HTMLDivElement> & { rows?: number; columns?: number }) {
  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="rounded-md border">
        <div className="border-b bg-muted/50 p-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="p-4">
              <div className="flex space-x-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-4 flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SkeletonChart({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props}>
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-2">
            <div className="flex items-end space-x-2 h-32">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={cn(
                    "flex-1 rounded-t",
                    `h-${Math.floor(Math.random() * 20) + 8}`
                  )}
                  style={{ height: `${Math.floor(Math.random() * 80) + 20}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-sm">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-8" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonText, SkeletonAvatar, SkeletonTable, SkeletonChart }
