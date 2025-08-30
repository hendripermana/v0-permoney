export const environment = {
  production: false,
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/permoney_dev',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  app: {
    port: parseInt(process.env.PORT || '3001', 10),
    globalPrefix: 'api',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes
  },
};
