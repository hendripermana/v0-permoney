import { SetMetadata } from "@nestjs/common"

export const CACHE_KEY = "cache"
export const CACHE_TTL_KEY = "cache_ttl"
export const CACHE_TAGS_KEY = "cache_tags"

export interface CacheDecoratorOptions {
  ttl?: number
  tags?: string[]
  keyGenerator?: (...args: any[]) => string
  condition?: (...args: any[]) => boolean
}

export const Cache = (options: CacheDecoratorOptions = {}) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY, true)(target, propertyName, descriptor)
    SetMetadata(CACHE_TTL_KEY, options.ttl || 3600)(target, propertyName, descriptor)
    SetMetadata(CACHE_TAGS_KEY, options.tags || [])(target, propertyName, descriptor)

    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // Check condition if provided
      if (options.condition && !options.condition(...args)) {
        return originalMethod.apply(this, args)
      }

      // Generate cache key
      const cacheKey = options.keyGenerator
        ? options.keyGenerator(...args)
        : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`

      // Try to get from cache
      const cacheManager = this.cacheManager || global.cacheManager
      if (cacheManager) {
        const cached = await cacheManager.get(cacheKey, {
          ttl: options.ttl,
          tags: options.tags,
        })

        if (cached !== null) {
          return cached
        }
      }

      // Execute original method
      const result = await originalMethod.apply(this, args)

      // Cache the result
      if (cacheManager && result !== undefined) {
        await cacheManager.set(cacheKey, result, {
          ttl: options.ttl,
          tags: options.tags,
        })
      }

      return result
    }

    return descriptor
  }
}

export const CacheEvict = (tags: string[]) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args)

      // Invalidate cache by tags
      const cacheManager = this.cacheManager || global.cacheManager
      if (cacheManager) {
        await cacheManager.invalidateByTags(tags)
      }

      return result
    }

    return descriptor
  }
}
