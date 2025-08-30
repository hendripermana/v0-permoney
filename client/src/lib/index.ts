/**
 * Library Index - Central export point for all utilities and configurations
 * This file provides a single import point for all utility functions
 */

// Utility functions
export { cn } from './utils';

// Design system configurations
export { componentStyles } from './design-system';

// React Query configuration
export { queryClient } from './queryClient';

/**
 * Usage Examples:
 *
 * // Import utilities
 * import { cn, componentStyles } from '@/lib'
 *
 * // Import specific utilities
 * import { queryClient } from '@/lib'
 *
 * // Import everything
 * import * as lib from '@/lib'
 */
