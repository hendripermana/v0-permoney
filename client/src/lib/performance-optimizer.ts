import { debounce, throttle } from "./performance"

export class PerformanceOptimizer {
  private static imageCache = new Map<string, HTMLImageElement>()
  private static componentCache = new Map<string, any>()
  private static queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  // Image optimization and caching
  static async preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.imageCache.set(src, img)
        resolve(img)
      }
      img.onerror = reject
      img.src = src
    })
  }

  // Component memoization
  static memoizeComponent<T>(key: string, factory: () => T, ttl = 300000): T {
    const cached = this.componentCache.get(key)
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.component
    }

    const component = factory()
    this.componentCache.set(key, {
      component,
      timestamp: Date.now(),
    })

    return component
  }

  // Query result caching
  static cacheQuery<T>(key: string, data: T, ttl = 300000): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  static getCachedQuery<T>(key: string): T | null {
    const cached = this.queryCache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.queryCache.delete(key)
      return null
    }

    return cached.data
  }

  // Bundle splitting utilities
  static async loadChunk(chunkName: string): Promise<any> {
    try {
      switch (chunkName) {
        case "dashboard":
          return await import("../pages/dashboard")
        case "transactions":
          return await import("../components/transactions/transaction-list")
        case "budgets":
          return await import("../components/budgets/budget-overview")
        case "analytics":
          return await import("../components/analytics/analytics-dashboard")
        default:
          throw new Error(`Unknown chunk: ${chunkName}`)
      }
    } catch (error) {
      console.error(`Failed to load chunk ${chunkName}:`, error)
      throw error
    }
  }

  // Resource preloading
  static preloadResources(resources: string[]): void {
    resources.forEach((resource) => {
      const link = document.createElement("link")
      link.rel = "preload"

      if (resource.endsWith(".js")) {
        link.as = "script"
      } else if (resource.endsWith(".css")) {
        link.as = "style"
      } else if (resource.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
        link.as = "image"
      }

      link.href = resource
      document.head.appendChild(link)
    })
  }

  // Critical CSS inlining
  static inlineCriticalCSS(css: string): void {
    const style = document.createElement("style")
    style.textContent = css
    document.head.appendChild(style)
  }

  // Lazy loading with intersection observer
  static createLazyLoader(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {},
  ): IntersectionObserver | null {
    if (!("IntersectionObserver" in window)) {
      // Fallback for browsers without IntersectionObserver
      setTimeout(() => callback([]), 0)
      return null
    }

    return new IntersectionObserver(callback, {
      rootMargin: "50px",
      threshold: 0.1,
      ...options,
    })
  }

  // Performance monitoring
  static measureRender(componentName: string, renderFn: () => void): void {
    const startTime = performance.now()
    renderFn()
    const endTime = performance.now()

    console.log(`${componentName} render time: ${endTime - startTime}ms`)

    // Send to analytics if needed
    if (endTime - startTime > 100) {
      console.warn(`Slow render detected for ${componentName}: ${endTime - startTime}ms`)
    }
  }

  // Memory cleanup
  static cleanup(): void {
    // Clear old cache entries
    const now = Date.now()

    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.queryCache.delete(key)
      }
    }

    // Clear component cache if too large
    if (this.componentCache.size > 100) {
      this.componentCache.clear()
    }

    // Clear image cache if too large
    if (this.imageCache.size > 50) {
      this.imageCache.clear()
    }
  }

  // Network optimization
  static optimizeNetworkRequests = debounce((requests: (() => Promise<any>)[]) => {
    return Promise.all(requests.map((request) => request()))
  }, 100)

  // Scroll optimization
  static optimizeScroll = throttle((callback: () => void) => {
    callback()
  }, 16) // 60fps
}

// React hook for performance optimization
export function usePerformanceOptimizer() {
  return {
    preloadImage: PerformanceOptimizer.preloadImage,
    memoizeComponent: PerformanceOptimizer.memoizeComponent,
    cacheQuery: PerformanceOptimizer.cacheQuery,
    getCachedQuery: PerformanceOptimizer.getCachedQuery,
    loadChunk: PerformanceOptimizer.loadChunk,
    measureRender: PerformanceOptimizer.measureRender,
  }
}
