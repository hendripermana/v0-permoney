// Common types used across frontend and backend

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Household {
  id: string;
  name: string;
  baseCurrency: Currency;
  members: HouseholdMember[];
  settings: HouseholdSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface HouseholdMember {
  id: string;
  userId: string;
  householdId: string;
  role: HouseholdRole;
  permissions: Permission[];
  joinedAt: Date;
}

export type HouseholdRole = 'ADMIN' | 'PARTNER' | 'FINANCE_STAFF';

export type Currency = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'MYR' | 'JPY';

export interface Money {
  amount: number;
  currency: Currency;
}

export interface HouseholdSettings {
  baseCurrency: Currency;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
