export enum NotificationType {
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  BUDGET_WARNING = 'BUDGET_WARNING',
  DEBT_PAYMENT_DUE = 'DEBT_PAYMENT_DUE',
  ZAKAT_REMINDER = 'ZAKAT_REMINDER',
  PRICE_ALERT = 'PRICE_ALERT',
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  ACCOUNT_BALANCE_LOW = 'ACCOUNT_BALANCE_LOW',
  RECURRING_TRANSACTION_FAILED = 'RECURRING_TRANSACTION_FAILED',
  MONTHLY_REPORT_READY = 'MONTHLY_REPORT_READY',
  SECURITY_ALERT = 'SECURITY_ALERT',
  HOUSEHOLD_INVITATION = 'HOUSEHOLD_INVITATION',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export interface NotificationData {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  budgetAlerts: {
    enabled: boolean;
    channels: NotificationChannel[];
    threshold: number; // percentage
  };
  debtReminders: {
    enabled: boolean;
    channels: NotificationChannel[];
    daysBefore: number;
  };
  zakatReminders: {
    enabled: boolean;
    channels: NotificationChannel[];
    daysBefore: number;
  };
  priceAlerts: {
    enabled: boolean;
    channels: NotificationChannel[];
    priceDropPercentage: number;
  };
  transactionAlerts: {
    enabled: boolean;
    channels: NotificationChannel[];
    largeAmountThreshold: number;
  };
  monthlyReports: {
    enabled: boolean;
    channels: NotificationChannel[];
    dayOfMonth: number;
  };
  securityAlerts: {
    enabled: boolean;
    channels: NotificationChannel[];
  };
}

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
  variables?: Record<string, string>;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  householdId: string;
  type: NotificationType;
  scheduledAt: Date;
  data: NotificationData;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  recurring?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval: number;
    endDate?: Date;
  };
}
