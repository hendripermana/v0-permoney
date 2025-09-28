import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  private store = new Map<string, { value: any; expiresAt?: number }>();

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async reset(): Promise<void> {
    this.store.clear();
  }

  buildExchangeRateCacheKey(from: string, toOrScope: string, date?: string): string {
    return date
      ? `fx:${from.toUpperCase()}:${toOrScope.toUpperCase()}:${date}`
      : `fx:${from.toUpperCase()}:${toOrScope}`;
  }
}


