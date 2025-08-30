import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj)
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("id-ID", {
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
