import { Prisma } from '@prisma/client';

// Comprehensive transaction type with all relations
export type TransactionWithDetails = Prisma.TransactionGetPayload<{
  include: {
    account: {
      select: {
        id: true;
        name: true;
        type: true;
        currency: true;
      };
    };
    transferAccount: {
      select: {
        id: true;
        name: true;
        type: true;
        currency: true;
      };
    };
    category: {
      select: {
        id: true;
        name: true;
        color: true;
        icon: true;
      };
    };
    merchantData: {
      select: {
        id: true;
        name: true;
        logoUrl: true;
        color: true;
      };
    };
    tags: {
      select: {
        tag: true;
      };
    };
    splits: {
      select: {
        id: true;
        categoryId: true;
        amountCents: true;
        description: true;
        category: {
          select: {
            id: true;
            name: true;
            color: true;
            icon: true;
          };
        };
      };
    };
    ledgerEntries: {
      select: {
        id: true;
        type: true;
        amountCents: true;
        currency: true;
      };
    };
  };
}>;

// Simplified transaction type for listings
export type TransactionSummary = Prisma.TransactionGetPayload<{
  include: {
    account: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
    category: {
      select: {
        id: true;
        name: true;
        color: true;
        icon: true;
      };
    };
    merchantData: {
      select: {
        id: true;
        name: true;
        logoUrl: true;
      };
    };
  };
}>;

// Transaction filters with proper Prisma types
export type TransactionWhereInput = Prisma.TransactionWhereInput;
export type TransactionOrderByInput = Prisma.TransactionOrderByWithRelationInput;

// Helper type for transaction creation
export type TransactionCreateInput = Prisma.TransactionCreateInput;
export type TransactionUpdateInput = Prisma.TransactionUpdateInput;

// Utility types for handling BigInt conversion
export interface TransactionAmounts {
  amountCents: number;
  originalAmountCents?: number;
}

export interface TransactionWithAmounts extends Omit<TransactionWithDetails, 'amountCents' | 'originalAmountCents'> {
  amountCents: number;
  originalAmountCents?: number;
}

// Type guards and converters
export function convertBigIntToNumber(value: bigint | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export function convertTransactionAmounts(transaction: TransactionWithDetails): TransactionWithAmounts {
  return {
    ...transaction,
    amountCents: convertBigIntToNumber(transaction.amountCents),
    originalAmountCents: transaction.originalAmountCents ? convertBigIntToNumber(transaction.originalAmountCents) : undefined,
  };
}

// Validation helpers
export function isValidTransactionAmount(amountCents: number): boolean {
  return Number.isInteger(amountCents) && amountCents !== 0;
}

export function formatTransactionAmount(amountCents: number, currency = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
  }).format(amountCents / 100);
}
