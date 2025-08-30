import type { ConfigService } from "@nestjs/config"

export const createVercelConfig = (configService: ConfigService) => ({
  // Database configuration for Vercel
  database: {
    url: configService.get<string>("DATABASE_URL"),
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    maxConnections: 1, // Serverless limitation
    connectionTimeoutMillis: 5000,
  },

  // Redis configuration for Vercel
  redis: {
    url: configService.get<string>("REDIS_URL"),
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  },

  // CORS configuration for Vercel
  cors: {
    origin: [configService.get<string>("FRONTEND_URL"), /\.vercel\.app$/, /\.v0\.app$/],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  },

  // Security headers for Vercel
  security: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "wss:"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },
})
