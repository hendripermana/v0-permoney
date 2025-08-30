/**
 * Pages Index - Central export point for all page components
 * This file provides a single import point for all pages
 */

// Main pages
export { default as Home } from './home';
export { default as Dashboard } from './dashboard';
export { default as NotFound } from './not-found';
export { DesignShowcase } from './design-showcase';

// Feature pages
export { default as IslamicFinance } from './islamic-finance';
export { default as Subscriptions } from './subscriptions';

// Authentication pages
export { default as Login } from './auth/login';
export { default as Register } from './auth/register';

/**
 * Usage Examples:
 *
 * // Import multiple pages
 * import { Home, Dashboard, Login } from '@/pages'
 *
 * // Import specific pages
 * import { Login, Register } from '@/pages'
 *
 * // Use in routing
 * import { Dashboard } from '@/pages'
 * <Route path="/dashboard" component={Dashboard} />
 */
