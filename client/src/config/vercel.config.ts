// Vercel-specific configuration for the frontend
export const vercelConfig = {
  // API configuration
  api: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
    timeout: 10000,
    retries: 3,
  },

  // Authentication configuration
  auth: {
    tokenKey: "auth_token",
    refreshTokenKey: "refresh_token",
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Cache configuration
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
  },

  // Feature flags
  features: {
    enablePWA: true,
    enableOfflineMode: true,
    enableAnalytics: process.env.NODE_ENV === "production",
  },
}

// Environment validation
export const validateEnvironment = () => {
  const requiredEnvVars = ["NEXT_PUBLIC_API_URL"]

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`)
  }
}
