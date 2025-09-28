const BASE_URL_CANDIDATES = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_CF_WORKER_URL,
  process.env.NEXT_PUBLIC_ORACLE_API_URL,
  process.env.API_URL,
]
  .filter((value): value is string => Boolean(value && value.trim()))
  .map((value) => value.replace(/\/$/, ""))

export const API_BASE_URL = BASE_URL_CANDIDATES[0] ?? "/api"

export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000

export const isBrowser = typeof window !== "undefined"

export const STORAGE_KEYS = {
  authToken: "auth_token",
} as const

