import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../node_modules/.prisma/client';
import { CreateTransactionDto, UpdateTransactionDto, TransactionFiltersDto, TransactionSearchDto } from './dto';
import {
  TransactionWithDetails,
  TransactionSummary,
  TransactionWhereInput,
  TransactionOrderByInput,
  convertBigIntToNumber,
} from './types/transaction.types';

export interface PaginatedTransactions {
  transactions: TransactionWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AccountingValidation {
  isValid: boolean;
  totalDebits: number;
  totalCredits: number;
  errors: string[];
}

@Injectable()
export class TransactionsRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a transaction with automatic ledger entry generation
   */
  async create(
    householdId: string,
    data: CreateTransactionDto,
    createdBy: string,
  ): Promise<any> {
      const transaction = await this.prisma.$transaction(async (tx) => {
      // Validate accounts exist and belong to household
      const account = await tx.account.findFirst({
        where: { id: data.accountId, householdId },
        select: { id: true, type: true, currency: true },
      });

      if (!account) {
        throw new Error(`Account ${data.accountId} not found or doesn't belong to household`);
      }

      // Validate transfer account if provided
      if (data.transferAccountId) {
        const transferAccount = await tx.account.findFirst({
          where: { id: data.transferAccountId, householdId },
          select: { id: true, type: true, currency: true },
        });

        if (!transferAccount) {
          throw new Error(`Transfer account ${data.transferAccountId} not found or doesn't belong to household`);
        }
      }

      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          householdId,
          amountCents: BigInt(data.amountCents),
          currency: data.currency || account.currency,
          originalAmountCents: data.originalAmountCents ? BigInt(data.originalAmountCents) : null,
          originalCurrency: data.originalCurrency,
          exchangeRate: data.exchangeRate,
          description: data.description,
          categoryId: data.categoryId,
          merchant: data.merchant,
          merchantName: data.merchantName,
          date: new Date(data.date),
          accountId: data.accountId,
          transferAccountId: data.transferAccountId,
          receiptUrl: data.receiptUrl,
          metadata: data.metadata || {},
          createdBy,
        },
        include: this.getTransactionInclude(),
      });

      // Create transaction splits if provided
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

      // Create ledger entries
      await this.createLedgerEntries(tx, transaction, account.type);

      // Create transaction tags if provided
      if (data.tags && data.tags.length > 0) {
        await tx.transactionTag.createMany({
          data: data.tags.map(tag => ({
            transactionId: transaction.id,
            tag,
          })),
        });
      }

      return transaction as unknown as TransactionWithDetails;
    });
  }

  /**
   * Update a transaction
   */
  async update(
    id: string,
    householdId: string,
    data: UpdateTransactionDto,
  ): Promise<any> {
      const transaction = await this.prisma.$transaction(async (tx) => {
      // Verify transaction exists and belongs to household
      const existingTransaction = await tx.transaction.findFirst({
        where: { id, householdId },
        include: { ledgerEntries: true },
      });

      if (!existingTransaction) {
        throw new Error(`Transaction ${id} not found or doesn't belong to household`);
      }

      // Delete existing ledger entries
      await tx.ledgerEntry.deleteMany({
        where: { transactionId: id },
      });

      // Update the transaction
      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          ...(data.amountCents !== undefined && { amountCents: BigInt(data.amountCents) }),
          ...(data.currency && { currency: data.currency }),
          ...(data.originalAmountCents !== undefined && {
            originalAmountCents: data.originalAmountCents ? BigInt(data.originalAmountCents) : null
          }),
          ...(data.originalCurrency !== undefined && { originalCurrency: data.originalCurrency }),
          ...(data.exchangeRate !== undefined && { exchangeRate: data.exchangeRate }),
          ...(data.description && { description: data.description }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.merchant !== undefined && { merchant: data.merchant }),
          ...(data.merchantName !== undefined && { merchantName: data.merchantName }),
          ...(data.date && { date: new Date(data.date) }),
          ...(data.transferAccountId !== undefined && { transferAccountId: data.transferAccountId }),
          ...(data.receiptUrl !== undefined && { receiptUrl: data.receiptUrl }),
          ...(data.metadata && { metadata: data.metadata }),
        },
        include: this.getTransactionInclude(),
      });

      // Get account type for ledger entries
      const account = await tx.account.findUnique({
        where: { id: updatedTransaction.accountId },
        select: { type: true },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // Recreate ledger entries
      await this.createLedgerEntries(tx, updatedTransaction, account.type);

      // Fetch the complete transaction with splits to ensure proper typing
      const completeTransaction = await tx.transaction.findUnique({
        where: { id: updatedTransaction.id },
        include: this.getTransactionInclude(),
      });

      return transaction as unknown as TransactionWithDetails;
    });
  }

  /**
   * Find transactions with pagination and filtering
   */
  async findMany(
    householdId: string,
    filters: TransactionFiltersDto = {},
    page = 1,
    limit = 50,
  ): Promise<PaginatedTransactions> {
    const where = this.buildWhereClause(householdId, filters);
    const orderBy = this.buildOrderByClause(filters.sortBy, filters.sortOrder);

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: this.getTransactionInclude(),
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.transaction.count({ where });

    return {
      transactions: transactions as unknown as TransactionWithDetails[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single transaction by ID
   */
  async findById(id: string, householdId: string): Promise<TransactionWithDetails | null> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, householdId },
      include: this.getTransactionInclude(),
    });

    return transaction as unknown as TransactionWithDetails;
  }

  /**
   * Delete a transaction
   */
  async delete(id: string, householdId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Verify transaction exists and belongs to household
      const transaction = await tx.transaction.findFirst({
        where: { id, householdId },
      });

      if (!transaction) {
        throw new Error(`Transaction ${id} not found or doesn't belong to household`);
      }

      // Delete related records
      await tx.ledgerEntry.deleteMany({ where: { transactionId: id } });
      await tx.transactionSplit.deleteMany({ where: { transactionId: id } });
      await tx.transactionTag.deleteMany({ where: { transactionId: id } });

      // Delete the transaction
      await tx.transaction.delete({ where: { id } });
    });
  }

  /**
   * Search transactions
   */
  async search(
    householdId: string,
    searchParams: TransactionSearchDto,
    page = 1,
    limit = 50,
  ): Promise<PaginatedTransactions> {
    const where: TransactionWhereInput = {
      householdId,
      OR: [
        { description: { contains: searchParams.query, mode: 'insensitive' } },
        { merchant: { contains: searchParams.query, mode: 'insensitive' } },
        { merchantName: { contains: searchParams.query, mode: 'insensitive' } },
        {
          category: {
            name: { contains: searchParams.query, mode: 'insensitive' },
          },
        },
      ],
    };

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: this.getTransactionInclude(),
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.transaction.count({ where });

    return {
      transactions: transactions as unknown as TransactionWithDetails[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Validate accounting equation for a transaction
   */
  async validateAccountingEquation(transactionId: string): Promise<AccountingValidation> {
    const ledgerEntries = await this.prisma.ledgerEntry.findMany({
      where: { transactionId },
    });

    let totalDebits = 0;
    let totalCredits = 0;
    const errors: string[] = [];

    for (const entry of ledgerEntries) {
      const amount = convertBigIntToNumber(entry.amountCents);
      if (entry.type === 'DEBIT') {
        totalDebits += amount;
      } else {
        totalCredits += amount;
      }
    }

    const isValid = Math.abs(totalDebits - totalCredits) < 1; // Allow for rounding errors

    if (!isValid) {
      errors.push(`Debits (${totalDebits}) do not equal credits (${totalCredits})`);
    }

    return {
      isValid,
      totalDebits,
      totalCredits,
      errors,
    };
  }

  /**
   * Get transaction statistics for a household
   */
  async getStatistics(
    householdId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalIncome: number;
    totalExpenses: number;
    transactionCount: number;
    averageTransactionAmount: number;
  }> {
    const where: TransactionWhereInput = {
      householdId,
      ...(startDate && { date: { gte: startDate } }),
      ...(endDate && { date: { lte: endDate } }),
    };

    const transactions = await this.prisma.transaction.findMany({
      where,
      select: {
        amountCents: true,
        transferAccountId: true,
      },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const transaction of transactions) {
      const amount = convertBigIntToNumber(transaction.amountCents);
      
      if (transaction.transferAccountId) {
        // Skip transfers for income/expense calculation
        continue;
      } else if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }
    }

    const transactionCount = transactions.length;
    const averageTransactionAmount = transactionCount > 0 
      ? (totalIncome + totalExpenses) / transactionCount 
      : 0;

    return {
      totalIncome,
      totalExpenses,
      transactionCount,
      averageTransactionAmount,
    };
  }

  /**
   * Private helper methods
   */
  private getTransactionInclude(): Prisma.TransactionInclude {
    return {
      account: {
        select: {
          id: true,
          name: true,
          type: true,
          currency: true,
        },
      },
      transferAccount: {
        select: {
          id: true,
          name: true,
          type: true,
          currency: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
        },
      },
      merchantData: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          color: true,
        },
      },
      tags: {
        select: {
          tag: true,
        },
      },
      splits: {
        select: {
          id: true,
          categoryId: true,
          amountCents: true,
          description: true,
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
        },
      },
      ledgerEntries: {
        select: {
          id: true,
          type: true,
          amountCents: true,
          currency: true,
        },
      },
    };
  }

  private buildWhereClause(
    householdId: string,
    filters: TransactionFiltersDto,
  ): TransactionWhereInput {
    const where: TransactionWhereInput = {
      householdId,
      ...(filters.accountId && { accountId: filters.accountId }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.startDate && { date: { gte: new Date(filters.startDate) } }),
      ...(filters.endDate && { date: { lte: new Date(filters.endDate) } }),
      ...(filters.minAmount && { amountCents: { gte: BigInt(filters.minAmount) } }),
      ...(filters.maxAmount && { amountCents: { lte: BigInt(filters.maxAmount) } }),
      ...(filters.merchant && { 
        OR: [
          { merchant: { contains: filters.merchant, mode: 'insensitive' } },
          { merchantName: { contains: filters.merchant, mode: 'insensitive' } },
        ],
      }),
      ...(filters.description && { 
        description: { contains: filters.description, mode: 'insensitive' } 
      }),
      ...(filters.isTransfer !== undefined && {
        transferAccountId: filters.isTransfer ? { not: null } : null,
      }),
    };

    return where;
  }

  private buildOrderByClause(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): TransactionOrderByInput[] {
    const order = sortOrder || 'desc';
    
    switch (sortBy) {
      case 'amount':
        return [{ amountCents: order }];
      case 'description':
        return [{ description: order }];
      case 'merchant':
        return [{ merchantName: order }];
      case 'category':
        return [{ category: { name: order } }];
      case 'account':
        return [{ account: { name: order } }];
      case 'date':
      default:
        return [{ date: order }];
    }
  }

  private async createLedgerEntries(
    tx: Prisma.TransactionClient,
    transaction: any,
    accountType: string,
  ): Promise<void> {
    const amount = convertBigIntToNumber(transaction.amountCents);
    
    if (transaction.transferAccountId) {
      // Transfer transaction - create entries for both accounts
      await tx.ledgerEntry.createMany({
        data: [
          {
            transactionId: transaction.id,
            accountId: transaction.accountId,
            type: 'CREDIT',
            amountCents: BigInt(Math.abs(amount)),
            currency: transaction.currency,
          },
          {
            transactionId: transaction.id,
            accountId: transaction.transferAccountId,
            type: 'DEBIT',
            amountCents: BigInt(Math.abs(amount)),
            currency: transaction.currency,
          },
        ],
      });
    } else {
      // Regular transaction
      const entryType = (accountType === 'ASSET' && amount > 0) || (accountType === 'LIABILITY' && amount < 0) 
        ? 'DEBIT' 
        : 'CREDIT';

      await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: transaction.accountId,
          type: entryType,
          amountCents: BigInt(Math.abs(amount)),
          currency: transaction.currency,
        },
      });
    }
  }
}
