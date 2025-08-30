import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import type { RedisService } from "./redis.service"
import type { MetricsService } from "../common/metrics/metrics.service"

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
  compress?: boolean // Enable compression for large values
  serialize?: boolean // Auto serialize/deserialize objects
  namespace?: string // Cache namespace
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
  avgResponseTime: number
}

@Injectable()
export class CacheManagerService {
  private readonly logger = new Logger(CacheManagerService.name)
  private readonly defaultTTL = 3600 // 1 hour
  private readonly compressionThreshold = 1024 // 1KB
  private stats = new Map<string, CacheStats>()

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
  ) {}

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const startTime = Date.now()
    const fullKey = this.buildKey(key, options.namespace)

    try {
      const cached = await this.redis.get(fullKey)
      const responseTime = Date.now() - startTime

      if (cached) {
        this.recordHit(key, responseTime)
        this.metrics.setCacheHitRate("redis", this.getHitRate(key))

        let value = cached

        // Handle compression
        if (cached.startsWith("gzip:")) {
          value = await this.decompress(cached.substring(5))
        }

        // Handle serialization
        if (options.serialize !== false) {
          try {
            return JSON.parse(value) as T
          } catch {
            return value as T
          }
        }

        return value as T
      }

      this.recordMiss(key, responseTime)
      this.metrics.setCacheHitRate("redis", this.getHitRate(key))
      return null
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error)
      this.recordMiss(key, Date.now() - startTime)
      return null
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const startTime = Date.now()
    const fullKey = this.buildKey(key, options.namespace)
    const ttl = options.ttl || this.defaultTTL

    try {
      let serializedValue: string

      // Handle serialization
      if (options.serialize !== false && typeof value === "object") {
        serializedValue = JSON.stringify(value)
      } else {
        serializedValue = String(value)
      }

      // Handle compression
      if (options.compress || serializedValue.length > this.compressionThreshold) {
        serializedValue = `gzip:${await this.compress(serializedValue)}`
      }

      await this.redis.set(fullKey, serializedValue, ttl)

      // Store cache tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.storeCacheTags(fullKey, options.tags, ttl)
      }

      this.logger.debug(`Cached key ${key} with TTL ${ttl}s`)
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error)
    }
  }

  async del(key: string, namespace?: string): Promise<void> {
    const fullKey = this.buildKey(key, namespace)
    await this.redis.del(fullKey)
    await this.removeCacheTags(fullKey)
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    const startTime = Date.now()

    try {
      const keysToInvalidate = new Set<string>()

      for (const tag of tags) {
        const tagKey = `tag:${tag}`
        const keys = await this.redis.smembers(tagKey)
        keys.forEach((key) => keysToInvalidate.add(key))
      }

      if (keysToInvalidate.size > 0) {
        const pipeline = this.redis.getClient().pipeline()

        for (const key of keysToInvalidate) {
          pipeline.del(key)
        }

        // Clean up tag references
        for (const tag of tags) {
          pipeline.del(`tag:${tag}`)
        }

        await pipeline.exec()

        this.logger.log(`Invalidated ${keysToInvalidate.size} cache entries by tags: ${tags.join(", ")}`)
      }
    } catch (error) {
      this.logger.error(`Cache invalidation by tags error:`, error)
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options)
    if (cached !== null) {
      return cached
    }

    // Cache miss - execute factory function
    try {
      const value = await factory()

      // Cache the result
      await this.set(key, value, options)

      return value
    } catch (error) {
      this.logger.error(`Factory function error for key ${key}:`, error)
      throw error
    }
  }

  async mget<T>(keys: string[], namespace?: string): Promise<(T | null)[]> {
    const fullKeys = keys.map((key) => this.buildKey(key, namespace))

    try {
      const pipeline = this.redis.getClient().pipeline()
      fullKeys.forEach((key) => pipeline.get(key))

      const results = await pipeline.exec()

      return (
        results?.map((result, index) => {
          if (result && result[1]) {
            const value = result[1] as string
            try {
              return JSON.parse(value) as T
            } catch {
              return value as T
            }
          }
          return null
        }) || []
      )
    } catch (error) {
      this.logger.error(`Cache MGET error:`, error)
      return keys.map(() => null)
    }
  }

  async mset<T>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void> {
    try {
      const pipeline = this.redis.getClient().pipeline()

      for (const entry of entries) {
        const fullKey = this.buildKey(entry.key, entry.options?.namespace)
        const ttl = entry.options?.ttl || this.defaultTTL
        const serializedValue = JSON.stringify(entry.value)

        pipeline.setex(fullKey, ttl, serializedValue)
      }

      await pipeline.exec()
    } catch (error) {
      this.logger.error(`Cache MSET error:`, error)
    }
  }

  async warmCache(
    warmingStrategies: Array<{ key: string; factory: () => Promise<any>; options?: CacheOptions }>,
  ): Promise<void> {
    this.logger.log(`Starting cache warming for ${warmingStrategies.length} entries`)

    const promises = warmingStrategies.map(async (strategy) => {
      try {
        const exists = await this.redis.exists(this.buildKey(strategy.key, strategy.options?.namespace))
        if (!exists) {
          const value = await strategy.factory()
          await this.set(strategy.key, value, strategy.options)
          this.logger.debug(`Warmed cache for key: ${strategy.key}`)
        }
      } catch (error) {
        this.logger.error(`Cache warming error for key ${strategy.key}:`, error)
      }
    })

    await Promise.allSettled(promises)
    this.logger.log(`Cache warming completed`)
  }

  getCacheStats(key?: string): CacheStats | Map<string, CacheStats> {
    if (key) {
      return this.stats.get(key) || { hits: 0, misses: 0, hitRate: 0, totalRequests: 0, avgResponseTime: 0 }
    }
    return this.stats
  }

  async getRedisInfo(): Promise<any> {
    try {
      const info = await this.redis.getClient().info("memory")
      const lines = info.split("\r\n")
      const memoryInfo: any = {}

      lines.forEach((line) => {
        if (line.includes(":")) {
          const [key, value] = line.split(":")
          memoryInfo[key] = value
        }
      })

      return {
        usedMemory: memoryInfo.used_memory_human,
        usedMemoryPeak: memoryInfo.used_memory_peak_human,
        totalSystemMemory: memoryInfo.total_system_memory_human,
        usedMemoryRss: memoryInfo.used_memory_rss_human,
        memoryFragmentationRatio: memoryInfo.mem_fragmentation_ratio,
      }
    } catch (error) {
      this.logger.error("Failed to get Redis info:", error)
      return null
    }
  }

  // Private helper methods
  private buildKey(key: string, namespace?: string): string {
    const prefix = this.config.get("CACHE_PREFIX", "permoney")
    const ns = namespace || "default"
    return `${prefix}:${ns}:${key}`
  }

  private async storeCacheTags(key: string, tags: string[], ttl: number): Promise<void> {
    const pipeline = this.redis.getClient().pipeline()

    for (const tag of tags) {
      const tagKey = `tag:${tag}`
      pipeline.sadd(tagKey, key)
      pipeline.expire(tagKey, ttl + 60) // Tag expires slightly after cache entry
    }

    await pipeline.exec()
  }

  private async removeCacheTags(key: string): Promise<void> {
    // This would require storing reverse mapping, simplified for now
    // In production, you might want to maintain a reverse index
  }

  private async compress(data: string): Promise<string> {
    // Using built-in compression (simplified)
    // In production, you might want to use a proper compression library
    return Buffer.from(data).toString("base64")
  }

  private async decompress(data: string): Promise<string> {
    return Buffer.from(data, "base64").toString()
  }

  private recordHit(key: string, responseTime: number): void {
    const stats = this.stats.get(key) || { hits: 0, misses: 0, hitRate: 0, totalRequests: 0, avgResponseTime: 0 }
    stats.hits++
    stats.totalRequests++
    stats.hitRate = (stats.hits / stats.totalRequests) * 100
    stats.avgResponseTime = (stats.avgResponseTime * (stats.totalRequests - 1) + responseTime) / stats.totalRequests
    this.stats.set(key, stats)
  }

  private recordMiss(key: string, responseTime: number): void {
    const stats = this.stats.get(key) || { hits: 0, misses: 0, hitRate: 0, totalRequests: 0, avgResponseTime: 0 }
    stats.misses++
    stats.totalRequests++
    stats.hitRate = (stats.hits / stats.totalRequests) * 100
    stats.avgResponseTime = (stats.avgResponseTime * (stats.totalRequests - 1) + responseTime) / stats.totalRequests
    this.stats.set(key, stats)
  }

  private getHitRate(key: string): number {
    const stats = this.stats.get(key)
    return stats ? stats.hitRate : 0
  }
}
