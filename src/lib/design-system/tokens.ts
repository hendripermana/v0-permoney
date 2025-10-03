/**
 * Design System Tokens
 * Central source of truth for design values
 */

export const designTokens = {
  // Spacing Scale
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },

  // Typography Scale
  typography: {
    display: 'text-display',
    h1: 'text-h1',
    h2: 'text-h2',
    h3: 'text-h3',
    h4: 'text-h4',
    bodyLg: 'text-body-lg',
    body: 'text-body',
    bodySm: 'text-body-sm',
    caption: 'text-caption',
  },

  // Container Sizes
  container: {
    sm: 'max-w-container-sm',   // 896px
    md: 'max-w-container-md',   // 1152px
    lg: 'max-w-container-lg',   // 1280px
    xl: 'max-w-container-xl',   // 1440px
    full: 'max-w-none',
  },

  // Financial Semantic Colors
  financial: {
    positive: {
      bg: 'bg-green-50 dark:bg-green-950',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600',
    },
    negative: {
      bg: 'bg-red-50 dark:bg-red-950',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600',
    },
    neutral: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600',
    },
  },

  // Status Colors
  status: {
    success: {
      bg: 'bg-green-50 dark:bg-green-950',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      solid: 'bg-green-600 text-white',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800',
      solid: 'bg-yellow-600 text-white',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      solid: 'bg-red-600 text-white',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      solid: 'bg-blue-600 text-white',
    },
  },

  // Elevation / Shadows
  elevation: {
    none: 'shadow-none',
    1: 'shadow-elevation-1',
    2: 'shadow-elevation-2',
    3: 'shadow-elevation-3',
    4: 'shadow-elevation-4',
    5: 'shadow-elevation-5',
  },

  // Border Radius
  radius: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  },

  // Transitions
  transition: {
    fast: 'transition-all duration-fast',
    normal: 'transition-all duration-normal',
    slow: 'transition-all duration-slow',
  },
} as const

// Helper type for autocomplete
export type DesignTokens = typeof designTokens
