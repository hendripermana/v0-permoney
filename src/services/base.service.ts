import { prisma } from '@/lib/prisma';
import { getCached, setCached, invalidateCache, CACHE_TTL } from '@/lib/redis';

export class BaseService {
  protected prisma = prisma;

  /**
   * Get cached data or fetch from database
   */
  protected async getCachedOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    ttl: number = CACHE_TTL.SHORT
  ): Promise<T> {
    // Try cache first
    const cached = await getCached<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch from database
    const data = await fetchFn();

    // Cache the result
    await setCached(cacheKey, data, ttl);

    return data;
  }

  /**
   * Invalidate cache patterns
   */
  protected async invalidateCachePatterns(...patterns: string[]): Promise<void> {
    await Promise.all(patterns.map(pattern => invalidateCache(pattern)));
  }

  /**
   * Handle service errors
   */
  protected handleError(error: unknown, message: string): never {
    console.error(`${message}:`, error);
    
    if (error instanceof Error) {
      throw new Error(`${message}: ${error.message}`);
    }
    
    throw new Error(message);
  }

  /**
   * Validate required fields
   */
  protected validateRequired<T extends Record<string, any>>(
    data: T,
    requiredFields: (keyof T)[]
  ): void {
    const missing = requiredFields.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Verify resource ownership
   */
  protected async verifyHouseholdAccess(
    resourceHouseholdId: string,
    userHouseholdId: string
  ): Promise<void> {
    if (resourceHouseholdId !== userHouseholdId) {
      throw new Error('Unauthorized: Resource does not belong to your household');
    }
  }
}
