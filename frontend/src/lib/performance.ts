'use client';

/**
 * Performance optimization utilities for Permoney
 * Implements comprehensive performance monitoring and optimization
 */

// Performance metrics collection
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static observers: Map<string, PerformanceObserver> = new Map();

  static startTiming(label: string): void {
    performance.mark(`${label}-start`);
  }

  static endTiming(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label, 'measure')[0];
    const duration = measure?.duration || 0;
    
    // Store metric
    const existing = this.metrics.get(label) || [];
    existing.push(duration);
    this.metrics.set(label, existing.slice(-100)); // Keep last 100 measurements
    
    return duration;
  }

  static getAverageTime(label: string): number {
    const times = this.metrics.get(label) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  static observeLCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    }
  }

  static observeFID(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as any; // FID entries have processingStart property
          if (fidEntry.processingStart) {
            console.log('FID:', fidEntry.processingStart - entry.startTime);
          }
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    }
  }

  static observeCLS(): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log('CLS:', clsValue);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    }
  }

  static disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Memory usage monitoring
export class MemoryMonitor {
  static getMemoryUsage(): any {
    if ('memory' in performance) {
      return {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  static logMemoryUsage(label: string): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      console.log(`Memory ${label}:`, {
        used: `${(memory.used / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.total / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.limit / 1024 / 1024).toFixed(2)} MB`,
      });
    }
  }
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading utility
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

// Bundle size analyzer
export class BundleAnalyzer {
  static logBundleSize(): void {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      console.log('Network info:', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      });
    }
  }

  static measureResourceTiming(): void {
    const resources = performance.getEntriesByType('resource');
    const totalSize = resources.reduce((total: number, resource: any) => {
      return total + (resource.transferSize || 0);
    }, 0);
    
    console.log('Total resource size:', `${(totalSize / 1024).toFixed(2)} KB`);
    
    // Log largest resources
    const sortedResources = resources
      .filter((resource: any) => resource.transferSize > 0)
      .sort((a: any, b: any) => b.transferSize - a.transferSize)
      .slice(0, 10);
    
    console.log('Largest resources:', sortedResources.map((resource: any) => ({
      name: resource.name.split('/').pop(),
      size: `${(resource.transferSize / 1024).toFixed(2)} KB`,
      duration: `${resource.duration.toFixed(2)} ms`,
    })));
  }
}

// Image optimization utilities
export function createOptimizedImageUrl(
  src: string,
  width?: number,
  height?: number,
  quality: number = 75
): string {
  if (!src) return '';
  
  // For Next.js Image optimization
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  
  return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
}

// Virtual scrolling helper
export class VirtualScrollManager {
  private containerHeight: number;
  private itemHeight: number;
  private scrollTop: number = 0;
  private totalItems: number;

  constructor(containerHeight: number, itemHeight: number, totalItems: number) {
    this.containerHeight = containerHeight;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
  }

  updateScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }

  getVisibleRange(): { start: number; end: number; offsetY: number } {
    const start = Math.floor(this.scrollTop / this.itemHeight);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const end = Math.min(start + visibleCount + 1, this.totalItems);
    const offsetY = start * this.itemHeight;

    return { start, end, offsetY };
  }

  getTotalHeight(): number {
    return this.totalItems * this.itemHeight;
  }
}

// Web Worker utilities
export function createWebWorker(workerFunction: Function): Worker | null {
  if (typeof Worker === 'undefined') {
    return null;
  }

  const blob = new Blob([`(${workerFunction.toString()})()`], {
    type: 'application/javascript',
  });
  
  return new Worker(URL.createObjectURL(blob));
}

// Service Worker registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

// Performance budget checker
export class PerformanceBudget {
  private static budgets = {
    lcp: 2500, // 2.5s
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1
    ttfb: 600, // 600ms
  };

  static checkBudget(metric: keyof typeof PerformanceBudget.budgets, value: number): boolean {
    const budget = this.budgets[metric];
    const passed = value <= budget;
    
    if (!passed) {
      console.warn(`Performance budget exceeded for ${metric}: ${value} > ${budget}`);
    }
    
    return passed;
  }

  static setBudget(metric: keyof typeof PerformanceBudget.budgets, value: number): void {
    this.budgets[metric] = value;
  }
}
