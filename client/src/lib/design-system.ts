// Design System for Permoney
// Consistent colors, spacing, and styling across the application

export const colors = {
  // Primary brand colors (matching landing page)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main brand blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Secondary colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Success colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Error colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Warning colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
};

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
  '4xl': '6rem', // 96px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// Component styles that match the landing page
export const componentStyles = {
  button: {
    primary: `
      bg-gradient-to-r from-blue-600 to-purple-600 
      hover:from-blue-700 hover:to-purple-700 
      text-white font-semibold 
      px-6 py-3 rounded-lg 
      transition-all duration-200 
      shadow-lg hover:shadow-xl
    `,
    secondary: `
      bg-white/10 backdrop-blur-sm 
      border border-white/20 
      text-white hover:bg-white/20 
      px-6 py-3 rounded-lg 
      transition-all duration-200
    `,
    ghost: `
      text-white hover:bg-white/10 
      px-4 py-2 rounded-md 
      transition-all duration-200
    `,
  },

  input: {
    default: `
      bg-white/10 backdrop-blur-sm 
      border border-white/20 
      text-white placeholder:text-slate-400 
      px-4 py-3 rounded-lg 
      focus:ring-2 focus:ring-blue-500 focus:border-transparent 
      transition-all duration-200
    `,
  },

  card: {
    default: `
      bg-white/10 backdrop-blur-sm 
      border border-white/20 
      rounded-xl shadow-xl
    `,
    glass: `
      bg-white/5 backdrop-blur-md 
      border border-white/10 
      rounded-2xl shadow-2xl
    `,
  },
};

// Utility functions
export const getColorValue = (color: string, shade = 500) => {
  const colorMap: any = { ...colors };
  const [colorName] = color.split('-');
  return colorMap[colorName]?.[shade] || color;
};

export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};
