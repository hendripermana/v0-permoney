export interface Transaction {
  id: string;
  householdId: string;
  amountCents: number;
  currency: string;
  originalAmountCents?: number;
  originalCurrency?: string;
  exchangeRate?: number;
  description: string;
  merchant?: string;
  merchantName?: string;
  date: string;
  accountId: string;
  transferAccountId?: string;
  categoryId?: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  account: {
    id: string;
    name: string;
    type: string;
    currency: string;
  };
  transferAccount?: {
    id: string;
    name: string;
    type: string;
    currency: string;
  };
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  merchantData?: {
    id: string;
    name: string;
    logoUrl?: string;
    color?: string;
  };
  tags: Array<{
    tag: string;
  }>;
  splits: Array<{
    id: string;
    categoryId: string;
    amountCents: number;
    description?: string;
    category: {
      id: string;
      name: string;
      color: string;
      icon: string;
    };
  }>;
  ledgerEntries: Array<{
    id: string;
    type: 'DEBIT' | 'CREDIT';
    amountCents: number;
    currency: string;
  }>;
}

export interface CreateTransactionData {
  amountCents: number;
  currency?: string;
  originalAmountCents?: number;
  originalCurrency?: string;
  exchangeRate?: number;
  description: string;
  categoryId?: string;
  merchant?: string;
  merchantId?: string;
  date: string;
  accountId: string;
  transferAccountId?: string;
  receiptUrl?: string;
  tags?: string[];
  splits?: Array<{
    categoryId: string;
    amountCents: number;
    description?: string;
  }>;
  metadata?: Record<string, any>;
}

export type UpdateTransactionData = Partial<CreateTransactionData>

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  merchant?: string;
  tags?: string[];
  includeTransfers?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'amount' | 'description' | 'merchant' | 'category' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'amount' | 'description' | 'merchant' | 'category' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionStats {
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  averageTransactionAmount: number;
  categoriesUsed: number;
  merchantsUsed: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  subtype: string;
  currency: string;
  balance: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  parentId?: string;
}

export interface AISuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reason: string;
}
