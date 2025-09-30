"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

// Debounce hook for performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttle hook for performance optimization
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options, hasIntersected])

  return { isIntersecting, hasIntersected }
}

// Virtual scrolling hook for large lists
export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  itemCount: number
  itemHeight: number
  containerHeight: number
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = useMemo(() => {
    const items = []
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        offsetTop: i * itemHeight,
      })
    }
    return items
  }, [startIndex, endIndex, itemHeight])

  const totalHeight = itemCount * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    startIndex,
    endIndex,
  }
}

// Memoized component wrapper
export function memo<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return React.memo(Component, propsAreEqual)
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTiming(label: string): void {
    if (typeof window !== "undefined" && window.performance) {
      performance.mark(`${label}-start`)
    }
  }

  endTiming(label: string): number | null {
    if (typeof window !== "undefined" && window.performance) {
      performance.mark(`${label}-end`)
      performance.measure(label, `${label}-start`, `${label}-end`)
      
      const measure = performance.getEntriesByName(label, "measure")[0]
      const duration = measure?.duration || 0
      
      // Store metric
      const existing = this.metrics.get(label) || []
      existing.push(duration)
      this.metrics.set(label, existing.slice(-100)) // Keep last 100 measurements
      
      // Clean up
      performance.clearMarks(`${label}-start`)
      performance.clearMarks(`${label}-end`)
      performance.clearMeasures(label)
      
      return duration
    }
    return null
  }

  getMetrics(label: string): { avg: number; min: number; max: number; count: number } | null {
    const measurements = this.metrics.get(label)
    if (!measurements || measurements.length === 0) return null

    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length
    const min = Math.min(...measurements)
    const max = Math.max(...measurements)
    
    return { avg, min, max, count: measurements.length }
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {}
    for (const [label] of this.metrics) {
      const metrics = this.getMetrics(label)
      if (metrics) {
        result[label] = metrics
      }
    }
    return result
  }

  clearMetrics(label?: string): void {
    if (label) {
      this.metrics.delete(label)
    } else {
      this.metrics.clear()
    }
  }
}

// Performance timing hook
export function usePerformanceTiming(label: string) {
  const monitor = PerformanceMonitor.getInstance()
  
  const startTiming = useCallback(() => {
    monitor.startTiming(label)
  }, [monitor, label])
  
  const endTiming = useCallback(() => {
    return monitor.endTiming(label)
  }, [monitor, label])
  
  const getMetrics = useCallback(() => {
    return monitor.getMetrics(label)
  }, [monitor, label])
  
  return { startTiming, endTiming, getMetrics }
}

// Image lazy loading hook
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const { hasIntersected } = useIntersectionObserver(imgRef as React.RefObject<Element>)

  useEffect(() => {
    if (hasIntersected && src) {
      const img = new Image()
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
      }
      img.onerror = () => {
        setIsError(true)
      }
      img.src = src
    }
  }, [hasIntersected, src])

  return { imageSrc, isLoaded, isError, imgRef }
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return
  
  const scripts = Array.from(document.querySelectorAll('script[src]'))
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
  
  console.group('Bundle Analysis')
  console.log('Scripts:', scripts.length)
  console.log('Stylesheets:', styles.length)
  
  // Estimate bundle sizes (rough approximation)
  scripts.forEach((script: any) => {
    if (script.src.includes('/_next/static/')) {
      console.log(`Script: ${script.src.split('/').pop()}`)
    }
  })
  
  console.groupEnd()
}

// Memory usage monitoring
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null)
  
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory)
      }
    }
    
    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000) // Update every 5 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  return memoryInfo
}

// Component render tracking
export function useRenderTracking(componentName: string) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(Date.now())
  
  useEffect(() => {
    renderCount.current += 1
    const now = Date.now()
    const timeSinceLastRender = now - lastRenderTime.current
    lastRenderTime.current = now
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times. Time since last render: ${timeSinceLastRender}ms`)
    }
  })
  
  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
  }
}

// Optimized search hook
export function useOptimizedSearch<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  debounceMs: number = 300
) {
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs)
  
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return items
    
    const lowercaseSearch = debouncedSearchTerm.toLowerCase()
    
    return items.filter(item => 
      searchFields.some(field => {
        const value = item[field]
        return value && 
          String(value).toLowerCase().includes(lowercaseSearch)
      })
    )
  }, [items, debouncedSearchTerm, searchFields])
  
  return filteredItems
}

// Cache utilities
export class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>()
  
  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
  
  size(): number {
    return this.cache.size
  }
}

// Global cache instance
export const globalCache = new SimpleCache()