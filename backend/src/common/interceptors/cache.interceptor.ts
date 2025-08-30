import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from "@nestjs/common"
import { type Observable, of } from "rxjs"
import { tap } from "rxjs/operators"
import { Reflector } from "@nestjs/core"
import type { CacheService } from "../../cache/cache.service"
import type { StructuredLoggerService } from "../logging/logger.service"

export const CACHE_KEY_METADATA = "cache_key"
export const CACHE_TTL_METADATA = "cache_ttl"

export const CacheKey = (key: string) => Reflector.createDecorator<string>({ key })
export const CacheTTL = (ttl: number) => Reflector.createDecorator<number>({ ttl })

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
    private logger: StructuredLoggerService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheKey = this.reflector.get(CACHE_KEY_METADATA, context.getHandler())
    const cacheTTL = this.reflector.get(CACHE_TTL_METADATA, context.getHandler()) || 300

    if (!cacheKey) {
      return next.handle()
    }

    const request = context.switchToHttp().getRequest()
    const dynamicKey = this.buildDynamicCacheKey(cacheKey, request)

    try {
      // Check cache first
      const cachedResult = await this.cacheService.get(dynamicKey)
      if (cachedResult !== null) {
        this.logger.log("Cache hit for interceptor", {
          operation: "cache_interceptor_hit",
          resource: "cache",
          cacheKey: dynamicKey,
        })
        return of(cachedResult)
      }

      // Execute handler and cache result
      return next.handle().pipe(
        tap(async (result) => {
          if (result !== null && result !== undefined) {
            await this.cacheService.set(dynamicKey, result, cacheTTL)
            this.logger.log("Result cached by interceptor", {
              operation: "cache_interceptor_set",
              resource: "cache",
              cacheKey: dynamicKey,
              ttl: cacheTTL,
            })
          }
        }),
      )
    } catch (error) {
      this.logger.error("Cache interceptor error", error.stack, {
        operation: "cache_interceptor_error",
        resource: "cache",
        cacheKey: dynamicKey,
      })
      return next.handle()
    }
  }

  private buildDynamicCacheKey(baseKey: string, request: any): string {
    const userId = request.user?.id || "anonymous"
    const householdId = request.user?.householdId || "none"
    const queryParams = JSON.stringify(request.query || {})

    return `${baseKey}:${userId}:${householdId}:${Buffer.from(queryParams).toString("base64")}`
  }
}
