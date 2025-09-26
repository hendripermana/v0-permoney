import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const LOCALE_ID = "id-ID"
const DEFAULT_CURRENCY = "IDR"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeNumber(value: number | null | undefined, fallback = 0): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback
  }
  return value
}

export function fromCents(value: number | null | undefined): number {
  return safeNumber(value, 0) / 100
}

export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  options?: Intl.NumberFormatOptions
): string {
  const formatter = new Intl.NumberFormat(LOCALE_ID, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  })

  return formatter.format(amount)
}

export function formatCurrencyFromCents(
  cents: number | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  options?: Intl.NumberFormatOptions
): string {
  return formatCurrency(fromCents(cents), currency, options)
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(LOCALE_ID, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj)
}

export function formatShortDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(LOCALE_ID, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(dateObj)
}

export function formatMonthDay(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(LOCALE_ID, {
    month: "short",
    day: "2-digit",
  }).format(dateObj)
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat(LOCALE_ID, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function getTrendColor(trend: "up" | "down" | "neutral"): string {
  switch (trend) {
    case "up":
      return "text-green-600"
    case "down":
      return "text-red-600"
    default:
      return "text-gray-600"
  }
}

export function getTrendDirection(current: number, previous: number): "up" | "down" | "neutral" {
  if (current > previous) return "up"
  if (current < previous) return "down"
  return "neutral"
}

const DEFAULT_COLOR_PALETTE = [
  "#16a34a",
  "#0ea5e9",
  "#f97316",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
  "#facc15",
  "#2563eb",
  "#d946ef",
]

export function getDeterministicColor(label: string, palette: string[] = DEFAULT_COLOR_PALETTE): string {
  if (!label) {
    return palette[0]
  }

  const hash = label
    .split("")
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 0xffffffff, 7)

  return palette[hash % palette.length]
}

export function formatDistanceToNow(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return "Hari ini"
  if (diffInDays === 1) return "Kemarin"
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} minggu yang lalu`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} bulan yang lalu`
  return `${Math.floor(diffInDays / 365)} tahun yang lalu`
}
