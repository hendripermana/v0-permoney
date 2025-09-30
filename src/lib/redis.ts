import Redis from 'ioredis';

// Redis client singleton
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
  }

  return redis;
}

// Cache utilities
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    await client.connect().catch(() => {}); // Ensure connected
    
    const value = await client.get(key);
    if (!value) return null;
    
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> {
  try {
    const client = getRedisClient();
    await client.connect().catch(() => {});
    
    const serialized = JSON.stringify(value);
    
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.connect().catch(() => {});
    
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error('Redis invalidate error:', error);
  }
}

export async function deleteCached(key: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.connect().catch(() => {});
    
    await client.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

// Cache key generators
export const CACHE_KEYS = {
  user: (userId: string) => `user:${userId}`,
  household: (householdId: string) => `household:${householdId}`,
  transactions: (householdId: string, filters: string) => 
    `transactions:${householdId}:${filters}`,
  dashboard: (householdId: string) => `dashboard:${householdId}`,
  analytics: (householdId: string, period: string) => 
    `analytics:${householdId}:${period}`,
  accounts: (householdId: string) => `accounts:${householdId}`,
  budgets: (householdId: string) => `budgets:${householdId}`,
  exchangeRates: (date: string) => `exchange-rates:${date}`,
  budgetProgress: (budgetId: string) => `budget:${budgetId}:progress`,
  netWorth: (householdId: string, currency: string) => 
    `net-worth:${householdId}:${currency}`,
  categories: (householdId: string) => `categories:${householdId}`,
  gratitude: (householdId: string) => `gratitude:${householdId}`,
  zakat: (householdId: string, year: number) => `zakat:${householdId}:${year}`,
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
};

export default getRedisClient;
