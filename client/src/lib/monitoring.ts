interface PerformanceMetric {
  name: string
  value: number
  timestamp: Date
  tags?: Record<string, string>
}

class ClientMonitoring {
  private metrics: PerformanceMetric[] = []
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.NODE_ENV === "production"
    this.setupPerformanceObserver()
    this.setupErrorTracking()
  }

  private setupPerformanceObserver() {
    if (!this.isEnabled || !("PerformanceObserver" in window)) return

    // Monitor navigation timing
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "navigation") {
          const navEntry = entry as PerformanceNavigationTiming
          this.recordMetric("page_load_time", navEntry.loadEventEnd - navEntry.fetchStart)
          this.recordMetric("dom_content_loaded", navEntry.domContentLoadedEventEnd - navEntry.fetchStart)
          this.recordMetric("first_byte", navEntry.responseStart - navEntry.fetchStart)
        }
      }
    })

    navObserver.observe({ entryTypes: ["navigation"] })

    // Monitor resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "resource") {
          const resourceEntry = entry as PerformanceResourceTiming
          this.recordMetric("resource_load_time", resourceEntry.responseEnd - resourceEntry.fetchStart, {
            resource_type: resourceEntry.initiatorType,
            resource_name: resourceEntry.name,
          })
        }
      }
    })

    resourceObserver.observe({ entryTypes: ["resource"] })

    // Monitor largest contentful paint
    const lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric("largest_contentful_paint", entry.startTime)
      }
    })

    lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })

    // Monitor first input delay
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric("first_input_delay", entry.processingStart - entry.startTime)
      }
    })

    fidObserver.observe({ entryTypes: ["first-input"] })
  }

  private setupErrorTracking() {
    if (!this.isEnabled) return

    // Track unhandled errors
    window.addEventListener("error", (event) => {
      this.recordError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      })
    })

    // Track unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.recordError({
        message: "Unhandled Promise Rejection",
        error: event.reason,
      })
    })
  }

  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      tags,
    }

    this.metrics.push(metric)

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Send to backend periodically
    this.sendMetricsToBackend([metric])
  }

  recordError(errorData: any) {
    fetch("/api/errors/client", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...errorData,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: localStorage.getItem("userId"),
      }),
    }).catch((err) => {
      console.error("Failed to send error to backend:", err)
    })
  }

  private sendMetricsToBackend(metrics: PerformanceMetric[]) {
    if (!this.isEnabled) return

    fetch("/api/metrics/client", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ metrics }),
    }).catch((err) => {
      console.error("Failed to send metrics to backend:", err)
    })
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  clearMetrics() {
    this.metrics = []
  }
}

export const clientMonitoring = new ClientMonitoring()

// Utility functions for manual performance tracking
export function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  return fn().finally(() => {
    const duration = performance.now() - start
    clientMonitoring.recordMetric(name, duration)
  })
}

export function measureSync<T>(name: string, fn: () => T): T {
  const start = performance.now()
  try {
    return fn()
  } finally {
    const duration = performance.now() - start
    clientMonitoring.recordMetric(name, duration)
  }
}
