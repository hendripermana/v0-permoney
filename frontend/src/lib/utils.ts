import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow as fnsFormatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting utility
export function formatCurrency(
  amount: number | bigint,
  currency: string = "IDR",
  locale: string = "id-ID"
): string {
  const numericAmount = typeof amount === 'bigint' ? Number(amount) / 100 : amount / 100;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

// Percentage formatting utility
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Date formatting utility
export function formatDate(date: Date | string, format: string = "MMM dd, yyyy"): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Simple date formatting - you might want to use date-fns for more complex formatting
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return dateObj.toLocaleDateString('en-US', options);
}

// Distance to now formatting (re-export from date-fns)
export function formatDistanceToNow(date: Date | string, options?: { addSuffix?: boolean }): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return fnsFormatDistanceToNow(dateObj, options);
}

// Trend direction utility
export function getTrendDirection(current: number, previous: number): 'up' | 'down' | 'neutral' {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'neutral';
}

// Trend color utility
export function getTrendColor(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}
