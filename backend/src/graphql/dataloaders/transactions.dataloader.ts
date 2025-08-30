import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../../prisma/prisma.service';
import { Transaction } from '@prisma/client';

@Injectable()
export class TransactionsDataLoader {
  constructor(private prisma: PrismaService) {}

  // Batch load transactions by IDs
  private transactionLoader = new DataLoader<string, Transaction | null>(
    async (transactionIds: readonly string[]) => {
      const transactions = await this.prisma.transaction.findMany({
        where: {
          id: { in: [...transactionIds] },
        },
        include: {
          account: {
            include: {
              institution: true,
            },
          },
          transferAccount: {
            include: {
              institution: true,
            },
          },
          category: true,
          merchantData: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tags: true,
          splits: {
            include: {
              category: true,
            },
          },
          ledgerEntries: {
            include: {
              account: true,
            },
          },
        },
      });

      const transactionMap = new Map(transactions.map(transaction => [transaction.id, transaction]));
      return transactionIds.map(id => transactionMap.get(id) || null);
    },
  );

  // Batch load transactions by account ID
  private transactionsByAccountLoader = new DataLoader<string, Transaction[]>(
    async (accountIds: readonly string[]) => {
      const transactions = await this.prisma.transaction.findMany({
        where: {
          OR: [
            { accountId: { in: [...accountIds] } },
            { transferAccountId: { in: [...accountIds] } },
          ],
        },
        include: {
          account: {
            include: {
              institution: true,
            },
          },
          transferAccount: {
            include: {
              institution: true,
            },
          },
          category: true,
          merchantData: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tags: true,
          splits: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: 100, // Limit to recent transactions
      });

      const transactionsByAccount = new Map<string, Transaction[]>();
      transactions.forEach(transaction => {
        // Add to primary account
        const primaryExisting = transactionsByAccount.get(transaction.accountId) || [];
        primaryExisting.push(transaction);
        transactionsByAccount.set(transaction.accountId, primaryExisting);

        // Add to transfer account if exists
        if (transaction.transferAccountId) {
          const transferExisting = transactionsByAccount.get(transaction.transferAccountId) || [];
          transferExisting.push(transaction);
          transactionsByAccount.set(transaction.transferAccountId, transferExisting);
        }
      });

      return accountIds.map(id => transactionsByAccount.get(id) || []);
    },
  );

  // Batch load recent transactions by household
  private recentTransactionsByHouseholdLoader = new DataLoader<string, Transaction[]>(
    async (householdIds: readonly string[]) => {
      const transactions = await this.prisma.transaction.findMany({
        where: {
          householdId: { in: [...householdIds] },
        },
        include: {
          account: {
            include: {
              institution: true,
            },
          },
          transferAccount: {
            include: {
              institution: true,
            },
          },
          category: true,
          merchantData: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tags: true,
          splits: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: 50, // Limit to recent transactions
      });

      const transactionsByHousehold = new Map<string, Transaction[]>();
      transactions.forEach(transaction => {
        const existing = transactionsByHousehold.get(transaction.householdId) || [];
        existing.push(transaction);
        transactionsByHousehold.set(transaction.householdId, existing);
      });

      return householdIds.map(id => transactionsByHousehold.get(id) || []);
    },
  );

  // Batch load transaction counts by category
  private transactionCountsByCategoryLoader = new DataLoader<string, number>(
    async (categoryIds: readonly string[]) => {
      const counts = await this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          categoryId: { in: [...categoryIds] },
        },
        _count: {
          id: true,
        },
      });

      const countMap = new Map(counts.map(c => [c.categoryId!, c._count.id]));
      return categoryIds.map(id => countMap.get(id) || 0);
    },
  );

  // Batch load transaction amounts by category
  private transactionAmountsByCategoryLoader = new DataLoader<string, bigint>(
    async (categoryIds: readonly string[]) => {
      const amounts = await this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          categoryId: { in: [...categoryIds] },
        },
        _sum: {
          amountCents: true,
        },
      });

      const amountMap = new Map(amounts.map(a => [a.categoryId!, a._sum.amountCents || BigInt(0)]));
      return categoryIds.map(id => amountMap.get(id) || BigInt(0));
    },
  );

  // Public methods
  async loadTransaction(id: string): Promise<Transaction | null> {
    return this.transactionLoader.load(id);
  }

  async loadTransactions(ids: string[]): Promise<(Transaction | null)[]> {
    return this.transactionLoader.loadMany(ids);
  }

  async loadTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    return this.transactionsByAccountLoader.load(accountId);
  }

  async loadRecentTransactionsByHousehold(householdId: string): Promise<Transaction[]> {
    return this.recentTransactionsByHouseholdLoader.load(householdId);
  }

  async loadTransactionCountByCategory(categoryId: string): Promise<number> {
    return this.transactionCountsByCategoryLoader.load(categoryId);
  }

  async loadTransactionAmountByCategory(categoryId: string): Promise<bigint> {
    return this.transactionAmountsByCategoryLoader.load(categoryId);
  }

  // Clear cache methods
  clearTransaction(id: string): void {
    this.transactionLoader.clear(id);
  }

  clearTransactionsByAccount(accountId: string): void {
    this.transactionsByAccountLoader.clear(accountId);
  }

  clearRecentTransactionsByHousehold(householdId: string): void {
    this.recentTransactionsByHouseholdLoader.clear(householdId);
  }

  clearTransactionCountByCategory(categoryId: string): void {
    this.transactionCountsByCategoryLoader.clear(categoryId);
  }

  clearTransactionAmountByCategory(categoryId: string): void {
    this.transactionAmountsByCategoryLoader.clear(categoryId);
  }

  clearAll(): void {
    this.transactionLoader.clearAll();
    this.transactionsByAccountLoader.clearAll();
    this.recentTransactionsByHouseholdLoader.clearAll();
    this.transactionCountsByCategoryLoader.clearAll();
    this.transactionAmountsByCategoryLoader.clearAll();
  }
}
