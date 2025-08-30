export const environment = {
  production: true,
  database: {
    url: process.env.DATABASE_URL!,
  },
  redis: {
    url: process.env.REDIS_URL!,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    globalPrefix: 'api',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10), // 1 hour
  },
};
