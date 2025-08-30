"use client"

import type React from "react"

import { useState, useRef, useCallback, useMemo } from "react"
import { throttle } from "lodash"

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
  className?: string
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  onLoadMore,
  hasMore = false,
  loading = false,
  className = "",
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  const { startIndex, endIndex, offsetY, totalHeight } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(items.length - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan)
    const offsetY = startIndex * itemHeight
    const totalHeight = items.length * itemHeight

    return { startIndex, endIndex, offsetY, totalHeight }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop
      setScrollTop(newScrollTop)

      // Load more when near bottom
      if (onLoadMore && hasMore && !loading && newScrollTop + containerHeight >= totalHeight - itemHeight * 3) {
        onLoadMore()
      }
    }, 16), // ~60fps
    [onLoadMore, hasMore, loading, totalHeight, containerHeight, itemHeight],
  )

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }))
  }, [items, startIndex, endIndex])

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
        {loading && (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  )
}
