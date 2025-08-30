import { Injectable, Logger } from "@nestjs/common"
import type { CacheService } from "./cache.service"
import type { StructuredLoggerService } from "../common/logging/logger.service"

interface QueryCacheOptions {
  ttl?: number
  tags?: string[]
  invalidateOnMutation?: boolean
}

@Injectable()
export class QueryCacheService {
  private readonly logger = new Logger(QueryCacheService.name)
  private readonly taggedKeys = new Map<string, Set<string>>()

  constructor(
    private cacheService: CacheService,
    private structuredLogger: StructuredLoggerService,
  ) {}

  async cacheQuery<T>(key: string, queryFn: () => Promise<T>, options: QueryCacheOptions = {}): Promise<T> {
    const { ttl = 300, tags = [], invalidateOnMutation = false } = options

    try {
      // Check cache first
      const cached = await this.cacheService.get<T>(key)
      if (cached !== null) {
        this.structuredLogger.log("Query cache hit", {
          operation: "query_cache_hit",
          resource: "cache",
          cacheKey: key,
        })
        return cached
      }

      // Execute query and cache result
      const startTime = Date.now()
      const result = await queryFn()
      const duration = Date.now() - startTime

      await this.cacheService.set(key, result, ttl)

      // Track tags for invalidation
      if (tags.length > 0) {
        this.trackTags(key, tags)
      }

      this.structuredLogger.log("Query cached", {
        operation: "query_cache_set",
        resource: "cache",
        cacheKey: key,
        duration,
        tags,
      })

      return result
    } catch (error) {
      this.logger.error(`Query cache error for key ${key}:`, error)
      // Fallback to direct query execution
      return await queryFn()
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToInvalidate = new Set<string>()

    for (const tag of tags) {
      const taggedKeys = this.taggedKeys.get(tag)
      if (taggedKeys) {
        taggedKeys.forEach((key) => keysToInvalidate.add(key))
      }
    }

    const invalidationPromises = Array.from(keysToInvalidate).map((key) => this.cacheService.del(key))

    await Promise.all(invalidationPromises)

    // Clean up tag tracking
    for (const tag of tags) {
      this.taggedKeys.delete(tag)
    }

    this.structuredLogger.log("Cache invalidated by tags", {
      operation: "cache_invalidation",
      resource: "cache",
      tags,
      keysInvalidated: keysToInvalidate.size,
    })
  }

  private trackTags(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.taggedKeys.has(tag)) {
        this.taggedKeys.set(tag, new Set())
      }
      this.taggedKeys.get(tag)!.add(key)
    }
  }

  async cacheUserData<T>(userId: string, dataType: string, queryFn: () => Promise<T>, ttl = 600): Promise<T> {
    const key = this.cacheService.buildUserCacheKey(userId, dataType)
    return this.cacheQuery(key, queryFn, {
      ttl,
      tags: [`user:${userId}`, `data_type:${dataType}`],
    })
  }

  async cacheHouseholdData<T>(householdId: string, dataType: string, queryFn: () => Promise<T>, ttl = 300): Promise<T> {
    const key = this.cacheService.buildHouseholdCacheKey(householdId, dataType)
    return this.cacheQuery(key, queryFn, {
      ttl,
      tags: [`household:${householdId}`, `data_type:${dataType}`],
    })
  }

  async cacheAnalyticsData<T>(
    householdId: string,
    period: string,
    queryFn: () => Promise<T>,
    ttl = 1800, // 30 minutes for analytics
  ): Promise<T> {
    const key = `analytics:${householdId}:${period}`
    return this.cacheQuery(key, queryFn, {
      ttl,
      tags: [`household:${householdId}`, "analytics", `period:${period}`],
    })
  }

  async warmCache(warmingTasks: Array<{ key: string; queryFn: () => Promise<any>; ttl?: number }>): Promise<void> {
    const startTime = Date.now()

    const warmingPromises = warmingTasks.map(async ({ key, queryFn, ttl = 300 }) => {
      try {
        const result = await queryFn()
        await this.cacheService.set(key, result, ttl)
        return { key, success: true }
      } catch (error) {
        this.logger.error(`Cache warming failed for key ${key}:`, error)
        return { key, success: false, error: error.message }
      }
    })

    const results = await Promise.allSettled(warmingPromises)
    const duration = Date.now() - startTime

    const successful = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    this.structuredLogger.log("Cache warming completed", {
      operation: "cache_warming",
      resource: "cache",
      duration,
      totalTasks: warmingTasks.length,
      successful,
      failed,
    })
  }
}
