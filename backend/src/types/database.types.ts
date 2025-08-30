// Database types and enums to resolve Prisma import issues
// This file provides local definitions for all database-related types

// Account Types
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY'
}

export enum InstitutionType {
  BANK = 'BANK',
  FINTECH = 'FINTECH',
  INVESTMENT = 'INVESTMENT',
  CRYPTO = 'CRYPTO'
}

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  DEBT = 'DEBT',
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  INVESTMENT = 'INVESTMENT',
  OTHER = 'OTHER'
}

export enum LedgerType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT'
}

export enum DebtType {
  PERSONAL = 'PERSONAL',
  CONVENTIONAL = 'CONVENTIONAL',
  ISLAMIC = 'ISLAMIC'
}

export enum BudgetPeriod {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export enum GratitudeType {
  TREAT = 'TREAT',
  HELP = 'HELP',
  GIFT = 'GIFT'
}

export enum InsightPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM'
}

export enum RecurringTransactionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum DocumentType {
  RECEIPT = 'RECEIPT',
  BANK_STATEMENT = 'BANK_STATEMENT',
  INVOICE = 'INVOICE',
  OTHER = 'OTHER'
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REQUIRES_REVIEW = 'REQUIRES_REVIEW'
}

export enum HouseholdRole {
  ADMIN = 'ADMIN',
  PARTNER = 'PARTNER',
  FINANCE_STAFF = 'FINANCE_STAFF'
}

export enum ZakatAssetType {
  CASH = 'CASH',
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  BUSINESS_ASSETS = 'BUSINESS_ASSETS',
  INVESTMENT = 'INVESTMENT',
  SAVINGS = 'SAVINGS',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY'
}

export enum ZakatReminderType {
  ANNUAL_CALCULATION = 'ANNUAL_CALCULATION',
  PAYMENT_DUE = 'PAYMENT_DUE',
  HAUL_COMPLETION = 'HAUL_COMPLETION',
  NISAB_THRESHOLD_MET = 'NISAB_THRESHOLD_MET'
}

export enum ShariaComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  QUESTIONABLE = 'QUESTIONABLE'
}

export enum IslamicReportType {
  ZAKAT_CALCULATION = 'ZAKAT_CALCULATION',
  SHARIA_COMPLIANCE = 'SHARIA_COMPLIANCE',
  ISLAMIC_DEBT_SUMMARY = 'ISLAMIC_DEBT_SUMMARY',
  HALAAL_INCOME_ANALYSIS = 'HALAAL_INCOME_ANALYSIS',
  COMPREHENSIVE = 'COMPREHENSIVE'
}

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
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE'
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

// Basic model interfaces
export interface Account {
  id: string;
  householdId: string;
  name: string;
  type: AccountType;
  subtype: string;
  currency: string;
  institutionId?: string;
  accountNumber?: string;
  balanceCents: bigint;
  isActive: boolean;
  ownerId?: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  householdId: string;
  amountCents: bigint;
  currency: string;
  originalAmountCents?: bigint;
  originalCurrency?: string;
  exchangeRate?: number;
  description: string;
  categoryId?: string;
  merchant?: string;
  merchantId?: string;
  merchantName?: string;
  merchantLogoUrl?: string;
  merchantColor?: string;
  date: Date;
  accountId: string;
  transferAccountId?: string;
  receiptUrl?: string;
  metadata: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  type: CategoryType;
  parentId?: string;
  householdId?: string;
  isActive: boolean;
  isEditable: boolean;
  isArchived: boolean;
  sortOrder?: number;
  createdAt: Date;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  type: LedgerType;
  amountCents: bigint;
  currency: string;
  createdAt: Date;
}

export interface Budget {
  id: string;
  householdId: string;
  name: string;
  period: BudgetPeriod;
  totalAllocatedCents: bigint;
  currency: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Debt {
  id: string;
  householdId: string;
  type: DebtType;
  name: string;
  creditor: string;
  principalAmountCents: bigint;
  currentBalanceCents: bigint;
  currency: string;
  interestRate?: number;
  marginRate?: number;
  startDate: Date;
  maturityDate?: Date;
  isActive: boolean;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialInsight {
  id: string;
  householdId: string;
  insightType: string;
  title: string;
  description: string;
  data: any;
  priority: InsightPriority;
  isActionable: boolean;
  isDismissed: boolean;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringTransaction {
  id: string;
  householdId: string;
  name: string;
  description: string;
  amountCents: bigint;
  currency: string;
  accountId: string;
  transferAccountId?: string;
  categoryId?: string;
  merchant?: string;
  frequency: RecurrenceFrequency;
  intervalValue: number;
  startDate: Date;
  endDate?: Date;
  nextExecutionDate: Date;
  lastExecutionDate?: Date;
  executionCount: number;
  maxExecutions?: number;
  status: RecurringTransactionStatus;
  metadata: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringTransactionExecution {
  id: string;
  recurringTransactionId: string;
  transactionId?: string;
  scheduledDate: Date;
  executedDate?: Date;
  status: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Input/Output types
export interface AccountWhereInput {
  id?: string;
  householdId?: string;
  type?: AccountType;
  isActive?: boolean;
  // Add other filter properties as needed
}

export interface AccountCreateInput {
  householdId: string;
  name: string;
  type: AccountType;
  subtype: string;
  currency?: string;
  institutionId?: string;
  accountNumber?: string;
  balanceCents?: bigint;
  isActive?: boolean;
  ownerId?: string;
  metadata?: any;
}

export interface AccountUpdateInput {
  name?: string;
  type?: AccountType;
  subtype?: string;
  currency?: string;
  institutionId?: string;
  accountNumber?: string;
  balanceCents?: bigint;
  isActive?: boolean;
  ownerId?: string;
  metadata?: any;
}

export interface TransactionWhereInput {
  id?: string;
  householdId?: string;
  accountId?: string;
  categoryId?: string;
  merchant?: string;
  // Add other filter properties as needed
}

export interface TransactionCreateInput {
  householdId: string;
  amountCents: bigint;
  currency?: string;
  description: string;
  categoryId?: string;
  merchant?: string;
  date: Date;
  accountId: string;
  transferAccountId?: string;
  receiptUrl?: string;
  metadata?: any;
  createdBy: string;
}

export interface TransactionUpdateInput {
  amountCents?: bigint;
  currency?: string;
  description?: string;
  categoryId?: string;
  merchant?: string;
  date?: Date;
  accountId?: string;
  transferAccountId?: string;
  receiptUrl?: string;
  metadata?: any;
}

export interface TransactionInclude {
  account?: boolean;
  category?: boolean;
  transferAccount?: boolean;
  tags?: boolean;
  splits?: boolean;
  ledgerEntries?: boolean;
}

export interface TransactionOrderByWithRelationInput {
  date?: 'asc' | 'desc';
  amountCents?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  // Add other ordering options as needed
}

// Utility types
export type TransactionGetPayload<T> = Transaction & {
  account?: T extends { include: { account: true } } ? Account : never;
  category?: T extends { include: { category: true } } ? Category : never;
};

export interface TransactionClient {
  findMany: (args?: any) => Promise<Transaction[]>;
  findFirst: (args?: any) => Promise<Transaction | null>;
  create: (args: any) => Promise<Transaction>;
  update: (args: any) => Promise<Transaction>;
  delete: (args: any) => Promise<Transaction>;
  count: (args?: any) => Promise<number>;
}