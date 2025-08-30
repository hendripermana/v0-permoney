export enum EventType {
  // Authentication Events
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  PASSKEY_CREATED = 'PASSKEY_CREATED',
  PASSKEY_USED = 'PASSKEY_USED',

  // Transaction Events
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_UPDATED = 'TRANSACTION_UPDATED',
  TRANSACTION_DELETED = 'TRANSACTION_DELETED',
  TRANSACTION_CATEGORIZED = 'TRANSACTION_CATEGORIZED',
  TRANSACTION_SPLIT = 'TRANSACTION_SPLIT',

  // Account Events
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_UPDATED = 'ACCOUNT_UPDATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  ACCOUNT_BALANCE_CHECKED = 'ACCOUNT_BALANCE_CHECKED',

  // Budget Events
  BUDGET_CREATED = 'BUDGET_CREATED',
  BUDGET_UPDATED = 'BUDGET_UPDATED',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  BUDGET_PROGRESS_CHECKED = 'BUDGET_PROGRESS_CHECKED',

  // Debt Events
  DEBT_CREATED = 'DEBT_CREATED',
  DEBT_PAYMENT_MADE = 'DEBT_PAYMENT_MADE',
  DEBT_UPDATED = 'DEBT_UPDATED',

  // Wishlist Events
  WISHLIST_ITEM_ADDED = 'WISHLIST_ITEM_ADDED',
  WISHLIST_ITEM_PURCHASED = 'WISHLIST_ITEM_PURCHASED',
  PRICE_ALERT_TRIGGERED = 'PRICE_ALERT_TRIGGERED',

  // Household Events
  HOUSEHOLD_CREATED = 'HOUSEHOLD_CREATED',
  HOUSEHOLD_MEMBER_INVITED = 'HOUSEHOLD_MEMBER_INVITED',
  HOUSEHOLD_MEMBER_JOINED = 'HOUSEHOLD_MEMBER_JOINED',
  HOUSEHOLD_SETTINGS_UPDATED = 'HOUSEHOLD_SETTINGS_UPDATED',

  // UI/UX Events
  PAGE_VIEWED = 'PAGE_VIEWED',
  FEATURE_USED = 'FEATURE_USED',
  SEARCH_PERFORMED = 'SEARCH_PERFORMED',
  FILTER_APPLIED = 'FILTER_APPLIED',
  EXPORT_REQUESTED = 'EXPORT_REQUESTED',

  // Analytics Events
  INSIGHT_GENERATED = 'INSIGHT_GENERATED',
  INSIGHT_VIEWED = 'INSIGHT_VIEWED',
  INSIGHT_DISMISSED = 'INSIGHT_DISMISSED',
  REPORT_GENERATED = 'REPORT_GENERATED',

  // Error Events
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface EventData {
  [key: string]: any;
}

export interface UserEventPayload {
  userId: string;
  householdId: string;
  eventType: EventType | string;
  eventData?: EventData;
  resourceType?: string;
  resourceId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

export interface SpendingPatternData {
  householdId: string;
  userId?: string;
  patternType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASONAL';
  categoryId?: string;
  merchant?: string;
  dayOfWeek?: number;
  hourOfDay?: number;
  month?: number;
  averageAmountCents: number;
  frequency: number;
  confidenceScore: number;
}

export interface BehaviorInsight {
  type: string;
  title: string;
  description: string;
  data: Record<string, any>;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isActionable: boolean;
  validUntil?: Date;
}
