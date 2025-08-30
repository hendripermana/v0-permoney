// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private observers: Map<string, PerformanceObserver> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Core Web Vitals monitoring
  initCoreWebVitals() {
    if (typeof window === "undefined") return

    // Largest Contentful Paint (LCP)
    this.observeMetric("largest-contentful-paint", (entries) => {
      const lcpEntry = entries[entries.length - 1]
      this.recordMetric("LCP", lcpEntry.startTime)
    })

    // First Input Delay (FID)
    this.observeMetric("first-input", (entries) => {
      const fidEntry = entries[0]
      this.recordMetric("FID", fidEntry.processingStart - fidEntry.startTime)
    })

    // Cumulative Layout Shift (CLS)
    this.observeMetric("layout-shift", (entries) => {
      let clsValue = 0
      for (const entry of entries) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
      this.recordMetric("CLS", clsValue)
    })
  }

  private observeMetric(type: string, callback: (entries: any[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      observer.observe({ type, buffered: true })
      this.observers.set(type, observer)
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error)
    }
  }

  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)

    // Report to analytics service
    this.reportMetric(name, value)
  }

  private reportMetric(name: string, value: number) {
    // Send to analytics service
    if (typeof window !== "undefined" && "gtag" in window) {
      ;(window as any).gtag("event", "web_vital", {
        name,
        value: Math.round(value),
        event_category: "performance",
      })
    }
  }

  // Memory monitoring
  getMemoryUsage() {
    if (typeof window === "undefined" || !("memory" in performance)) {
      return null
    }

    const memory = (performance as any).memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    }
  }

  // Performance timing
  startTiming(label: string) {
    if (typeof window !== "undefined") {
      performance.mark(`${label}-start`)
    }
  }

  endTiming(label: string) {
    if (typeof window !== "undefined") {
      performance.mark(`${label}-end`)
      performance.measure(label, `${label}-start`, `${label}-end`)

      const measure = performance.getEntriesByName(label)[0]
      this.recordMetric(label, measure.duration)
    }
  }

  // Get all metrics
  getMetrics() {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {}

    for (const [name, values] of this.metrics.entries()) {
      summary[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      }
    }

    return summary
  }

  // Cleanup
  disconnect() {
    for (const observer of this.observers.values()) {
      observer.disconnect()
    }
    this.observers.clear()
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Lazy loading with Intersection Observer
export class LazyLoader {
  private observer: IntersectionObserver | null = null
  private elements: Set<Element> = new Set()

  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window === "undefined") return

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadElement(entry.target)
            this.observer?.unobserve(entry.target)
            this.elements.delete(entry.target)
          }
        })
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
        ...options,
      },
    )
  }

  observe(element: Element) {
    if (this.observer && !this.elements.has(element)) {
      this.observer.observe(element)
      this.elements.add(element)
    }
  }

  private loadElement(element: Element) {
    if (element instanceof HTMLImageElement) {
      const src = element.dataset.src
      if (src) {
        element.src = src
        element.removeAttribute("data-src")
      }
    }

    // Trigger custom load event
    element.dispatchEvent(new CustomEvent("lazy-loaded"))
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
      this.elements.clear()
    }
  }
}

// Virtual scrolling for large lists
export class VirtualScrollManager {
  private container: HTMLElement
  private itemHeight: number
  private visibleCount: number
  private totalCount: number
  private scrollTop = 0
  private renderCallback: (startIndex: number, endIndex: number) => void

  constructor(
    container: HTMLElement,
    itemHeight: number,
    visibleCount: number,
    totalCount: number,
    renderCallback: (startIndex: number, endIndex: number) => void,
  ) {
    this.container = container
    this.itemHeight = itemHeight
    this.visibleCount = visibleCount
    this.totalCount = totalCount
    this.renderCallback = renderCallback

    this.setupScrollListener()
    this.updateVisibleItems()
  }

  private setupScrollListener() {
    const throttledScroll = throttle(() => {
      this.scrollTop = this.container.scrollTop
      this.updateVisibleItems()
    }, 16) // ~60fps

    this.container.addEventListener("scroll", throttledScroll)
  }

  private updateVisibleItems() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight)
    const endIndex = Math.min(startIndex + this.visibleCount, this.totalCount - 1)

    this.renderCallback(startIndex, endIndex)
  }

  updateTotalCount(count: number) {
    this.totalCount = count
    this.updateVisibleItems()
  }
}

// Web Worker utilities
export class WebWorkerManager {
  private workers: Map<string, Worker> = new Map()

  createWorker(name: string, script: string): Worker | null {
    if (typeof window === "undefined") return null

    try {
      const blob = new Blob([script], { type: "application/javascript" })
      const worker = new Worker(URL.createObjectURL(blob))

      this.workers.set(name, worker)
      return worker
    } catch (error) {
      console.error(`Failed to create worker ${name}:`, error)
      return null
    }
  }

  getWorker(name: string): Worker | undefined {
    return this.workers.get(name)
  }

  terminateWorker(name: string) {
    const worker = this.workers.get(name)
    if (worker) {
      worker.terminate()
      this.workers.delete(name)
    }
  }

  terminateAll() {
    for (const [name, worker] of this.workers.entries()) {
      worker.terminate()
    }
    this.workers.clear()
  }
}

// Service Worker registration
export async function registerServiceWorker(swPath = "/sw.js"): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath)
    console.log("Service Worker registered:", registration)
    return registration
  } catch (error) {
    console.error("Service Worker registration failed:", error)
    return null
  }
}

// Performance budget checker
export class PerformanceBudget {
  private budgets: Map<string, number> = new Map()

  setBudget(metric: string, threshold: number) {
    this.budgets.set(metric, threshold)
  }

  checkBudget(metric: string, value: number): boolean {
    const budget = this.budgets.get(metric)
    if (!budget) return true

    const withinBudget = value <= budget
    if (!withinBudget) {
      console.warn(`Performance budget exceeded for ${metric}: ${value} > ${budget}`)
    }

    return withinBudget
  }

  checkAllBudgets(metrics: Record<string, number>): Record<string, boolean> {
    const results: Record<string, boolean> = {}

    for (const [metric, value] of Object.entries(metrics)) {
      results[metric] = this.checkBudget(metric, value)
    }

    return results
  }
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  const monitor = PerformanceMonitor.getInstance()
  monitor.initCoreWebVitals()

  // Set up performance budgets
  const budget = new PerformanceBudget()
  budget.setBudget("LCP", 2500) // 2.5s
  budget.setBudget("FID", 100) // 100ms
  budget.setBudget("CLS", 0.1) // 0.1

  return { monitor, budget }
}
