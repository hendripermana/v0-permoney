/**
 * Component Variants
 * Standardized variants for common component patterns
 */

import { type VariantProps, cva } from "class-variance-authority"

/**
 * Card Variants for different use cases
 */
export const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-normal",
  {
    variants: {
      variant: {
        default: "",
        elevated: "shadow-elevation-2 hover:shadow-elevation-3",
        flat: "shadow-none border-0 bg-muted/50",
        interactive: "cursor-pointer hover:shadow-elevation-3 hover:scale-[1.01]",
        stat: "border-l-4",
        chart: "p-0 overflow-hidden",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
)

/**
 * Button Financial Variants
 */
export const buttonFinancialVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        income: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
        expense: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        neutral: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
)

/**
 * Badge Financial Variants
 */
export const badgeFinancialVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        income: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
        expense: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
        neutral: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        success: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
        warning: "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        danger: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
        info: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

/**
 * Alert Variants
 */
export const alertVariants = cva(
  "relative w-full rounded-lg border p-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        success: "bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800",
        warning: "bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800",
        danger: "bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800",
        info: "bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export type CardVariants = VariantProps<typeof cardVariants>
export type ButtonFinancialVariants = VariantProps<typeof buttonFinancialVariants>
export type BadgeFinancialVariants = VariantProps<typeof badgeFinancialVariants>
export type AlertVariants = VariantProps<typeof alertVariants>
