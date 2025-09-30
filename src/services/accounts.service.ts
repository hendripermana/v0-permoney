import { Prisma, Account, AccountType } from '@prisma/client';
import { BaseService } from './base.service';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

// Types
export interface CreateAccountData {
  name: string;
  type: AccountType;
  subtype: string;
  currency?: string;
  institutionId?: string;
  accountNumber?: string;
  balanceCents?: number;
  ownerId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAccountData {
  name?: string;
  type?: AccountType;
  subtype?: string;
  currency?: string;
  institutionId?: string;
  accountNumber?: string;
  balanceCents?: number;
  isActive?: boolean;
  ownerId?: string;
  metadata?: Record<string, any>;
}

export interface AccountFilters {
  type?: AccountType;
  isActive?: boolean;
  currency?: string;
  institutionId?: string;
  ownerId?: string;
}

export interface AccountWithDetails extends Account {
  institution?: any;
  transactions?: any[];
  _count?: {
    transactions: number;
  };
}

export interface AccountStats {
  totalAccounts: number;
  activeAccounts: number;
  assetAccounts: number;
  liabilityAccounts: number;
  totalAssetValue: number;
  totalLiabilityValue: number;
  currenciesUsed: string[];
}

export interface NetWorthData {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency: string;
  accountBreakdown: {
    accountId: string;
    accountName: string;
    accountType: AccountType;
    balance: number;
    currency: string;
  }[];
  assetBreakdown: {
    type: string;
    total: number;
    accounts: number;
  }[];
  liabilityBreakdown: {
    type: string;
    total: number;
    accounts: number;
  }[];
}

export class AccountsService extends BaseService {
  /**
   * Create a new account
   */
  async createAccount(
    householdId: string,
    data: CreateAccountData
  ): Promise<AccountWithDetails> {
    try {
      this.validateRequired(data, ['name', 'type', 'subtype']);

      const account = await this.prisma.account.create({
        data: {
          householdId,
          name: data.name,
          type: data.type,
          subtype: data.subtype,
          currency: data.currency || 'IDR',
          institutionId: data.institutionId,
          accountNumber: data.accountNumber,
          balanceCents: data.balanceCents ? BigInt(data.balanceCents) : BigInt(0),
          ownerId: data.ownerId,
          metadata: data.metadata || {},
          isActive: true,
        },
        include: {
          institution: true,
          _count: {
            select: { transactions: true },
          },
        },
      });

      // Invalidate caches
      await this.invalidateCachePatterns(
        `accounts:${householdId}`,
        `dashboard:${householdId}`,
        `net-worth:${householdId}:*`
      );

      return account as AccountWithDetails;
    } catch (error) {
      return this.handleError(error, 'Failed to create account');
    }
  }

  /**
   * Get account by ID
   */
  async getAccountById(
    id: string,
    householdId: string
  ): Promise<AccountWithDetails> {
    try {
      const account = await this.prisma.account.findFirst({
        where: { id, householdId },
        include: {
          institution: true,
          _count: {
            select: { transactions: true },
          },
        },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      return account as AccountWithDetails;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch account');
    }
  }

  /**
   * Get all accounts with filters
   */
  async getAccounts(
    householdId: string,
    filters: AccountFilters = {}
  ): Promise<AccountWithDetails[]> {
    try {
      const cacheKey = CACHE_KEYS.accounts(householdId) + `:${JSON.stringify(filters)}`;

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const where: Prisma.AccountWhereInput = {
            householdId,
            ...(filters.type && { type: filters.type }),
            ...(filters.isActive !== undefined && { isActive: filters.isActive }),
            ...(filters.currency && { currency: filters.currency }),
            ...(filters.institutionId && { institutionId: filters.institutionId }),
            ...(filters.ownerId && { ownerId: filters.ownerId }),
          };

          const accounts = await this.prisma.account.findMany({
            where,
            include: {
              institution: true,
              _count: {
                select: { transactions: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          });

          return accounts as AccountWithDetails[];
        },
        CACHE_TTL.SHORT
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch accounts');
    }
  }

  /**
   * Update account
   */
  async updateAccount(
    id: string,
    householdId: string,
    data: UpdateAccountData
  ): Promise<AccountWithDetails> {
    try {
      // Verify account exists and belongs to household
      await this.getAccountById(id, householdId);

      const account = await this.prisma.account.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.type && { type: data.type }),
          ...(data.subtype && { subtype: data.subtype }),
          ...(data.currency && { currency: data.currency }),
          ...(data.institutionId !== undefined && { institutionId: data.institutionId }),
          ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
          ...(data.balanceCents !== undefined && { balanceCents: BigInt(data.balanceCents) }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
          ...(data.metadata && { metadata: data.metadata }),
        },
        include: {
          institution: true,
          _count: {
            select: { transactions: true },
          },
        },
      });

      // Invalidate caches
      await this.invalidateCachePatterns(
        `accounts:${householdId}*`,
        `dashboard:${householdId}`,
        `net-worth:${householdId}:*`
      );

      return account as AccountWithDetails;
    } catch (error) {
      return this.handleError(error, 'Failed to update account');
    }
  }

  /**
   * Delete account (soft delete by setting isActive to false)
   */
  async deleteAccount(id: string, householdId: string): Promise<void> {
    try {
      // Verify account exists
      const account = await this.getAccountById(id, householdId);

      // Check if account has transactions
      const transactionCount = await this.prisma.transaction.count({
        where: { accountId: id },
      });

      if (transactionCount > 0) {
        // Soft delete - just deactivate
        await this.prisma.account.update({
          where: { id },
          data: { isActive: false },
        });
      } else {
        // Hard delete if no transactions
        await this.prisma.account.delete({
          where: { id },
        });
      }

      // Invalidate caches
      await this.invalidateCachePatterns(
        `accounts:${householdId}*`,
        `dashboard:${householdId}`,
        `net-worth:${householdId}:*`
      );
    } catch (error) {
      return this.handleError(error, 'Failed to delete account');
    }
  }

  /**
   * Get account statistics
   */
  async getAccountStats(householdId: string): Promise<AccountStats> {
    try {
      const cacheKey = `${CACHE_KEYS.accounts(householdId)}:stats`;

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const accounts = await this.getAccounts(householdId);

          const totalAccounts = accounts.length;
          const activeAccounts = accounts.filter(a => a.isActive).length;
          const assetAccounts = accounts.filter(a => a.type === 'ASSET').length;
          const liabilityAccounts = accounts.filter(a => a.type === 'LIABILITY').length;

          const totalAssetValue = accounts
            .filter(a => a.type === 'ASSET')
            .reduce((sum, a) => sum + Number(a.balanceCents), 0);

          const totalLiabilityValue = accounts
            .filter(a => a.type === 'LIABILITY')
            .reduce((sum, a) => sum + Number(a.balanceCents), 0);

          const currenciesUsed = [...new Set(accounts.map(a => a.currency))];

          return {
            totalAccounts,
            activeAccounts,
            assetAccounts,
            liabilityAccounts,
            totalAssetValue,
            totalLiabilityValue,
            currenciesUsed,
          };
        },
        CACHE_TTL.SHORT
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch account stats');
    }
  }

  /**
   * Calculate net worth
   */
  async getNetWorth(householdId: string, currency: string = 'IDR'): Promise<NetWorthData> {
    try {
      const cacheKey = CACHE_KEYS.netWorth(householdId, currency);

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const accounts = await this.getAccounts(householdId, { isActive: true });

          // Calculate totals
          const totalAssets = accounts
            .filter(a => a.type === 'ASSET')
            .reduce((sum, a) => sum + Number(a.balanceCents), 0);

          const totalLiabilities = accounts
            .filter(a => a.type === 'LIABILITY')
            .reduce((sum, a) => sum + Math.abs(Number(a.balanceCents)), 0);

          const netWorth = totalAssets - totalLiabilities;

          // Account breakdown
          const accountBreakdown = accounts.map(account => ({
            accountId: account.id,
            accountName: account.name,
            accountType: account.type,
            balance: Number(account.balanceCents),
            currency: account.currency,
          }));

          // Asset breakdown by subtype
          const assetsBySubtype = accounts
            .filter(a => a.type === 'ASSET')
            .reduce((acc, account) => {
              const subtype = account.subtype || 'other';
              if (!acc[subtype]) {
                acc[subtype] = { total: 0, accounts: 0 };
              }
              acc[subtype].total += Number(account.balanceCents);
              acc[subtype].accounts += 1;
              return acc;
            }, {} as Record<string, { total: number; accounts: number }>);

          const assetBreakdown = Object.entries(assetsBySubtype).map(([type, data]) => ({
            type,
            total: data.total,
            accounts: data.accounts,
          }));

          // Liability breakdown by subtype
          const liabilitiesBySubtype = accounts
            .filter(a => a.type === 'LIABILITY')
            .reduce((acc, account) => {
              const subtype = account.subtype || 'other';
              if (!acc[subtype]) {
                acc[subtype] = { total: 0, accounts: 0 };
              }
              acc[subtype].total += Math.abs(Number(account.balanceCents));
              acc[subtype].accounts += 1;
              return acc;
            }, {} as Record<string, { total: number; accounts: number }>);

          const liabilityBreakdown = Object.entries(liabilitiesBySubtype).map(([type, data]) => ({
            type,
            total: data.total,
            accounts: data.accounts,
          }));

          return {
            totalAssets,
            totalLiabilities,
            netWorth,
            currency,
            accountBreakdown,
            assetBreakdown,
            liabilityBreakdown,
          };
        },
        CACHE_TTL.SHORT
      );
    } catch (error) {
      return this.handleError(error, 'Failed to calculate net worth');
    }
  }

  /**
   * Get account balance history
   */
  async getAccountBalanceHistory(
    accountId: string,
    householdId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ date: Date; balance: number }[]> {
    try {
      // Verify account belongs to household
      await this.getAccountById(accountId, householdId);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          accountId,
          ...(startDate && { date: { gte: startDate } }),
          ...(endDate && { date: { lte: endDate } }),
        },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          amountCents: true,
        },
      });

      // Calculate running balance
      let runningBalance = 0;
      const balanceHistory = transactions.map(transaction => {
        runningBalance += Number(transaction.amountCents);
        return {
          date: transaction.date,
          balance: runningBalance,
        };
      });

      return balanceHistory;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch balance history');
    }
  }

  /**
   * Recalculate account balance from transactions
   */
  async recalculateAccountBalance(
    accountId: string,
    householdId: string
  ): Promise<AccountWithDetails> {
    try {
      // Verify account belongs to household
      await this.getAccountById(accountId, householdId);

      // Calculate balance from transactions
      const result = await this.prisma.transaction.aggregate({
        where: { accountId },
        _sum: {
          amountCents: true,
        },
      });

      const calculatedBalance = result._sum.amountCents || BigInt(0);

      // Update account balance
      const account = await this.prisma.account.update({
        where: { id: accountId },
        data: { balanceCents: calculatedBalance },
        include: {
          institution: true,
          _count: {
            select: { transactions: true },
          },
        },
      });

      // Invalidate caches
      await this.invalidateCachePatterns(
        `accounts:${householdId}*`,
        `dashboard:${householdId}`,
        `net-worth:${householdId}:*`
      );

      return account as AccountWithDetails;
    } catch (error) {
      return this.handleError(error, 'Failed to recalculate account balance');
    }
  }
}

// Export singleton instance
export const accountsService = new AccountsService();
