import { Prisma, Transaction } from '@prisma/client';
import { BaseService } from './base.service';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

// Types
export interface CreateTransactionData {
  accountId: string;
  amountCents: number;
  currency: string;
  description: string;
  date: Date;
  categoryId?: string;
  transferAccountId?: string;
  merchant?: string;
  merchantId?: string;
  receiptUrl?: string;
  tags?: string[];
  splits?: TransactionSplitData[];
  metadata?: Record<string, any>;
  originalAmountCents?: number;
  originalCurrency?: string;
  exchangeRate?: number;
}

export interface UpdateTransactionData {
  accountId?: string;
  amountCents?: number;
  currency?: string;
  description?: string;
  date?: Date;
  categoryId?: string;
  transferAccountId?: string;
  merchant?: string;
  merchantId?: string;
  receiptUrl?: string;
  tags?: string[];
  splits?: TransactionSplitData[];
  metadata?: Record<string, any>;
}

export interface TransactionSplitData {
  categoryId: string;
  amountCents: number;
  description?: string;
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  merchant?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedTransactions {
  data: TransactionWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransactionWithDetails extends Transaction {
  category?: any;
  account: any;
  transferAccount?: any;
  tags: any[];
  splits: any[];
  creator: any;
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

export class TransactionsService extends BaseService {
  /**
   * Create a new transaction with ledger entries
   */
  async createTransaction(
    householdId: string,
    data: CreateTransactionData,
    userId: string
  ): Promise<TransactionWithDetails> {
    try {
      // Validate account belongs to household
      const account = await this.prisma.account.findFirst({
        where: { id: data.accountId, householdId },
      });

      if (!account) {
        throw new Error('Account not found or does not belong to household');
      }

      // If transfer, validate transfer account
      if (data.transferAccountId) {
        const transferAccount = await this.prisma.account.findFirst({
          where: { id: data.transferAccountId, householdId },
        });

        if (!transferAccount) {
          throw new Error('Transfer account not found or does not belong to household');
        }
      }

      const result = await this.prisma.$transaction(async (tx) => {
        // Create transaction
        const transaction = await tx.transaction.create({
          data: {
            householdId,
            accountId: data.accountId,
            amountCents: BigInt(data.amountCents),
            currency: data.currency,
            description: data.description,
            date: data.date,
            categoryId: data.categoryId,
            transferAccountId: data.transferAccountId,
            merchant: data.merchant,
            merchantId: data.merchantId,
            receiptUrl: data.receiptUrl,
            metadata: data.metadata || {},
            originalAmountCents: data.originalAmountCents ? BigInt(data.originalAmountCents) : null,
            originalCurrency: data.originalCurrency,
            exchangeRate: data.exchangeRate,
            createdBy: userId,
          },
          include: {
            category: true,
            account: true,
            transferAccount: true,
            creator: true,
          },
        });

        // Create ledger entries for double-entry bookkeeping
        const isIncome = data.amountCents > 0;
        const isExpense = data.amountCents < 0;

        if (data.transferAccountId) {
          // Transfer: debit target, credit source
          await tx.ledgerEntry.createMany({
            data: [
              {
                transactionId: transaction.id,
                accountId: data.transferAccountId,
                type: 'DEBIT',
                amountCents: BigInt(Math.abs(data.amountCents)),
                currency: data.currency,
              },
              {
                transactionId: transaction.id,
                accountId: data.accountId,
                type: 'CREDIT',
                amountCents: BigInt(Math.abs(data.amountCents)),
                currency: data.currency,
              },
            ],
          });
        } else if (isIncome) {
          // Income: debit account (increase)
          await tx.ledgerEntry.create({
            data: {
              transactionId: transaction.id,
              accountId: data.accountId,
              type: 'DEBIT',
              amountCents: BigInt(Math.abs(data.amountCents)),
              currency: data.currency,
            },
          });
        } else if (isExpense) {
          // Expense: credit account (decrease)
          await tx.ledgerEntry.create({
            data: {
              transactionId: transaction.id,
              accountId: data.accountId,
              type: 'CREDIT',
              amountCents: BigInt(Math.abs(data.amountCents)),
              currency: data.currency,
            },
          });
        }

        // Create tags if provided
        if (data.tags && data.tags.length > 0) {
          await tx.transactionTag.createMany({
            data: data.tags.map(tag => ({
              transactionId: transaction.id,
              tag,
            })),
          });
        }

        // Create splits if provided
        if (data.splits && data.splits.length > 0) {
          await tx.transactionSplit.createMany({
            data: data.splits.map(split => ({
              transactionId: transaction.id,
              categoryId: split.categoryId,
              amountCents: BigInt(split.amountCents),
              description: split.description,
            })),
          });
        }

        // Update account balance
        await tx.account.update({
          where: { id: data.accountId },
          data: {
            balanceCents: {
              increment: BigInt(data.amountCents),
            },
          },
        });

        // If transfer, update transfer account balance
        if (data.transferAccountId) {
          await tx.account.update({
            where: { id: data.transferAccountId },
            data: {
              balanceCents: {
                increment: BigInt(Math.abs(data.amountCents)),
              },
            },
          });
        }

        return transaction;
      });

      // Invalidate caches
      await this.invalidateCachePatterns(
        `transactions:${householdId}:*`,
        `dashboard:${householdId}`,
        `accounts:${householdId}`,
        `analytics:${householdId}:*`
      );

      // Fetch complete transaction with relations
      return this.getTransactionById(result.id, householdId);
    } catch (error) {
      return this.handleError(error, 'Failed to create transaction');
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(
    id: string,
    householdId: string
  ): Promise<TransactionWithDetails> {
    try {
      const transaction = await this.prisma.transaction.findFirst({
        where: { id, householdId },
        include: {
          category: true,
          account: true,
          transferAccount: true,
          tags: true,
          splits: {
            include: {
              category: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction as TransactionWithDetails;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch transaction');
    }
  }

  /**
   * Get transactions with filters and pagination
   */
  async getTransactions(
    householdId: string,
    filters: TransactionFilters = {}
  ): Promise<PaginatedTransactions> {
    try {
      const {
        page = 1,
        limit = 20,
        orderBy = 'date',
        orderDirection = 'desc',
        ...filterParams
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.TransactionWhereInput = {
        householdId,
        ...(filterParams.accountId && { accountId: filterParams.accountId }),
        ...(filterParams.categoryId && { categoryId: filterParams.categoryId }),
        ...(filterParams.startDate && {
          date: { gte: filterParams.startDate },
        }),
        ...(filterParams.endDate && {
          date: { lte: filterParams.endDate },
        }),
        ...(filterParams.minAmount && {
          amountCents: { gte: BigInt(filterParams.minAmount) },
        }),
        ...(filterParams.maxAmount && {
          amountCents: { lte: BigInt(filterParams.maxAmount) },
        }),
        ...(filterParams.merchant && {
          OR: [
            { merchant: { contains: filterParams.merchant, mode: 'insensitive' } },
            { merchantName: { contains: filterParams.merchant, mode: 'insensitive' } },
          ],
        }),
        ...(filterParams.search && {
          OR: [
            { description: { contains: filterParams.search, mode: 'insensitive' } },
            { merchant: { contains: filterParams.search, mode: 'insensitive' } },
            { merchantName: { contains: filterParams.search, mode: 'insensitive' } },
          ],
        }),
        ...(filterParams.tags && filterParams.tags.length > 0 && {
          tags: {
            some: {
              tag: { in: filterParams.tags },
            },
          },
        }),
      };

      // Fetch data in parallel
      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [orderBy]: orderDirection },
          include: {
            category: true,
            account: true,
            transferAccount: true,
            tags: true,
            splits: {
              include: {
                category: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.transaction.count({ where }),
      ]);

      return {
        data: transactions as TransactionWithDetails[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch transactions');
    }
  }

  /**
   * Update transaction
   */
  async updateTransaction(
    id: string,
    householdId: string,
    data: UpdateTransactionData
  ): Promise<TransactionWithDetails> {
    try {
      // Verify transaction exists and belongs to household
      const existing = await this.getTransactionById(id, householdId);

      const result = await this.prisma.$transaction(async (tx) => {
        // Calculate balance adjustment if amount changed
        if (data.amountCents !== undefined) {
          const oldAmount = Number(existing.amountCents);
          const newAmount = data.amountCents;
          const difference = newAmount - oldAmount;

          // Update account balance
          await tx.account.update({
            where: { id: existing.accountId },
            data: {
              balanceCents: {
                increment: BigInt(difference),
              },
            },
          });
        }

        // Update transaction
        const updated = await tx.transaction.update({
          where: { id },
          data: {
            ...(data.accountId && { accountId: data.accountId }),
            ...(data.amountCents !== undefined && { amountCents: BigInt(data.amountCents) }),
            ...(data.currency && { currency: data.currency }),
            ...(data.description && { description: data.description }),
            ...(data.date && { date: data.date }),
            ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
            ...(data.transferAccountId !== undefined && { transferAccountId: data.transferAccountId }),
            ...(data.merchant !== undefined && { merchant: data.merchant }),
            ...(data.merchantId !== undefined && { merchantId: data.merchantId }),
            ...(data.receiptUrl !== undefined && { receiptUrl: data.receiptUrl }),
            ...(data.metadata && { metadata: data.metadata }),
          },
        });

        // Update tags if provided
        if (data.tags !== undefined) {
          // Delete existing tags
          await tx.transactionTag.deleteMany({
            where: { transactionId: id },
          });

          // Create new tags
          if (data.tags.length > 0) {
            await tx.transactionTag.createMany({
              data: data.tags.map(tag => ({
                transactionId: id,
                tag,
              })),
            });
          }
        }

        // Update splits if provided
        if (data.splits !== undefined) {
          // Delete existing splits
          await tx.transactionSplit.deleteMany({
            where: { transactionId: id },
          });

          // Create new splits
          if (data.splits.length > 0) {
            await tx.transactionSplit.createMany({
              data: data.splits.map(split => ({
                transactionId: id,
                categoryId: split.categoryId,
                amountCents: BigInt(split.amountCents),
                description: split.description,
              })),
            });
          }
        }

        return updated;
      });

      // Invalidate caches
      await this.invalidateCachePatterns(
        `transactions:${householdId}:*`,
        `dashboard:${householdId}`,
        `accounts:${householdId}`,
        `analytics:${householdId}:*`
      );

      return this.getTransactionById(id, householdId);
    } catch (error) {
      return this.handleError(error, 'Failed to update transaction');
    }
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(id: string, householdId: string): Promise<void> {
    try {
      // Verify transaction exists
      const transaction = await this.getTransactionById(id, householdId);

      await this.prisma.$transaction(async (tx) => {
        // Reverse account balance
        await tx.account.update({
          where: { id: transaction.accountId },
          data: {
            balanceCents: {
              decrement: transaction.amountCents,
            },
          },
        });

        // If transfer, reverse transfer account balance
        if (transaction.transferAccountId) {
          await tx.account.update({
            where: { id: transaction.transferAccountId },
            data: {
              balanceCents: {
                decrement: BigInt(Math.abs(Number(transaction.amountCents))),
              },
            },
          });
        }

        // Delete transaction (cascade will delete tags, splits, ledger entries)
        await tx.transaction.delete({
          where: { id },
        });
      });

      // Invalidate caches
      await this.invalidateCachePatterns(
        `transactions:${householdId}:*`,
        `dashboard:${householdId}`,
        `accounts:${householdId}`,
        `analytics:${householdId}:*`
      );
    } catch (error) {
      return this.handleError(error, 'Failed to delete transaction');
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(
    householdId: string,
    filters?: Partial<TransactionFilters>
  ): Promise<TransactionStats> {
    try {
      const cacheKey = CACHE_KEYS.analytics(householdId, `stats-${JSON.stringify(filters || {})}`);

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const { data: transactions } = await this.getTransactions(householdId, {
            ...filters,
            limit: 10000,
          });

          const totalTransactions = transactions.length;
          const totalIncome = transactions
            .filter(t => Number(t.amountCents) > 0)
            .reduce((sum, t) => sum + Number(t.amountCents), 0);
          const totalExpenses = Math.abs(
            transactions
              .filter(t => Number(t.amountCents) < 0)
              .reduce((sum, t) => sum + Number(t.amountCents), 0)
          );
          const totalTransfers = transactions.filter(t => t.transferAccountId).length;
          const averageTransactionAmount =
            totalTransactions > 0
              ? transactions.reduce((sum, t) => sum + Math.abs(Number(t.amountCents)), 0) / totalTransactions
              : 0;
          const categoriesUsed = new Set(transactions.map(t => t.categoryId).filter(Boolean)).size;
          const merchantsUsed = new Set(
            transactions.map(t => t.merchant || t.merchantName).filter(Boolean)
          ).size;

          return {
            totalTransactions,
            totalIncome,
            totalExpenses,
            totalTransfers,
            averageTransactionAmount,
            categoriesUsed,
            merchantsUsed,
          };
        },
        CACHE_TTL.MEDIUM
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch transaction stats');
    }
  }

  /**
   * Get category breakdown
   */
  async getCategoryBreakdown(
    householdId: string,
    filters?: Partial<TransactionFilters>
  ): Promise<CategoryBreakdown[]> {
    try {
      const cacheKey = CACHE_KEYS.analytics(householdId, `category-breakdown-${JSON.stringify(filters || {})}`);

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const { data: transactions } = await this.getTransactions(householdId, {
            ...filters,
            limit: 10000,
          });

          // Group by category
          const categoryMap = new Map<string, { amount: number; count: number; name: string }>();

          transactions.forEach(transaction => {
            const categoryId = transaction.categoryId || 'uncategorized';
            const categoryName = transaction.category?.name || 'Uncategorized';
            const amount = Math.abs(Number(transaction.amountCents));

            const existing = categoryMap.get(categoryId) || { amount: 0, count: 0, name: categoryName };
            categoryMap.set(categoryId, {
              amount: existing.amount + amount,
              count: existing.count + 1,
              name: categoryName,
            });
          });

          const totalAmount = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.amount, 0);

          return Array.from(categoryMap.entries())
            .map(([categoryId, data]) => ({
              categoryId,
              categoryName: data.name,
              totalAmount: data.amount,
              transactionCount: data.count,
              percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount);
        },
        CACHE_TTL.MEDIUM
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch category breakdown');
    }
  }
}

// Export singleton instance
export const transactionsService = new TransactionsService();
