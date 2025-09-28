// Re-export all types from Prisma Client
export * from '@prisma/client';

// Additional custom types for the application
export interface AccountWithBalance {
  id: string;
  householdId: string;
  name: string;
  type: any; // Will use Prisma's AccountType
  subtype: string;
  currency: string;
  institutionId?: string | null;
  accountNumber?: string | null;
  balanceCents: bigint;
  isActive: boolean;
  ownerId?: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  calculatedBalance?: bigint;
  institution?: any;
}

export interface TransactionWithDetails {
  id: string;
  householdId: string;
  amountCents: bigint;
  currency: string;
  description: string;
  date: Date;
  accountId: string;
  categoryId?: string | null;
  merchant?: string | null;
  account?: any;
  category?: any;
  transferAccount?: any;
  tags?: any[];
  splits?: any[];
  createdAt: Date;
  updatedAt: Date;
}

// Simplified types for DTOs
export interface CreateAccountData {
  householdId: string;
  name: string;
  type: string;
  subtype: string;
  currency?: string;
  institutionId?: string;
  accountNumber?: string;
  balanceCents?: bigint;
  isActive?: boolean;
  ownerId?: string;
  metadata?: any;
}

export interface UpdateAccountData {
  name?: string;
  type?: string;
  subtype?: string;
  currency?: string;
  institutionId?: string;
  accountNumber?: string;
  balanceCents?: bigint;
  isActive?: boolean;
  ownerId?: string;
  metadata?: any;
}

export interface CreateTransactionData {
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

export interface UpdateTransactionData {
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