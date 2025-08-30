import { SetMetadata } from "@nestjs/common"

export const PERFORMANCE_MONITOR_KEY = "performance_monitor"
export const CACHE_WARM_KEY = "cache_warm"

export const PerformanceMonitor = (label?: string) => SetMetadata(PERFORMANCE_MONITOR_KEY, label)

export const CacheWarm = (keys: string[]) => SetMetadata(CACHE_WARM_KEY, keys)

export function Measure(label?: string) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value
    const measureLabel = label || `${target.constructor.name}.${propertyName}`

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()

      try {
        const result = await method.apply(this, args)
        const duration = Date.now() - startTime

        // Log performance metric
        if (this.logger) {
          this.logger.logPerformanceMetric(measureLabel, duration, "ms", {
            operation: "method_execution",
            resource: target.constructor.name,
            method: propertyName,
          })
        }

        return result
      } catch (error) {
        const duration = Date.now() - startTime

        if (this.logger) {
          this.logger.error(`Method ${measureLabel} failed`, error.stack, {
            operation: "method_execution_error",
            resource: target.constructor.name,
            method: propertyName,
            duration,
          })
        }

        throw error
      }
    }

    return descriptor
  }
}
