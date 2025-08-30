// Application constants

export const SUPPORTED_CURRENCIES = [
  'IDR',
  'USD',
  'EUR',
  'SGD',
  'MYR',
  'JPY',
] as const;

export const DEFAULT_CURRENCY = 'IDR';

export const HOUSEHOLD_ROLES = {
  ADMIN: 'ADMIN',
  PARTNER: 'PARTNER',
  FINANCE_STAFF: 'FINANCE_STAFF',
} as const;

export const API_ENDPOINTS = {
  AUTH: '/api/v1/auth',
  HOUSEHOLDS: '/api/v1/households',
  ACCOUNTS: '/api/v1/accounts',
  TRANSACTIONS: '/api/v1/transactions',
  DEBTS: '/api/v1/debts',
  BUDGETS: '/api/v1/budgets',
  REPORTS: '/api/v1/reports',
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
