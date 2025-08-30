import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Account, AccountType, Prisma } from '@prisma/client';
import { CreateAccountDto, UpdateAccountDto, AccountFiltersDto, ViewType } from './dto';

export interface AccountWithBalance extends Account {
  calculatedBalance: bigint;
  institution?: {
    id: string;
    name: string;
    code: string | null;
    logoUrl: string | null;
    type: string;
  } | null;
}

export interface BalanceHistoryPoint {
  date: Date;
  balance: bigint;
}

@Injectable()
export class AccountsRepository {
  constructor(private prisma: PrismaService) {}

  async create(householdId: string, data: CreateAccountDto): Promise<Account> {
    return this.prisma.account.create({
      data: {
        ...data,
        householdId,
        balanceCents: 0, // Always start with 0, balance calculated from ledger
      },
      include: {
        institution: true,
      },
    });
  }

  async findById(id: string): Promise<AccountWithBalance | null> {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
            type: true,
          },
        },
      },
    });

    if (!account) return null;

    const calculatedBalance = await this.calculateAccountBalance(id);
    
    return {
      ...account,
      calculatedBalance,
    };
  }

  async findByHousehold(
    householdId: string,
    filters: AccountFiltersDto,
    userId?: string,
  ): Promise<AccountWithBalance[]> {
    const where: Prisma.AccountWhereInput = {
      householdId,
      ...(filters.type && { type: filters.type }),
      ...(filters.subtype && { subtype: filters.subtype }),
      ...(filters.currency && { currency: filters.currency }),
      ...(filters.institutionId && { institutionId: filters.institutionId }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    };

    // Apply view type filtering
    if (filters.viewType && userId) {
      switch (filters.viewType) {
        case ViewType.INDIVIDUAL:
          where.ownerId = userId;
          break;
        case ViewType.PARTNER_ONLY:
          where.ownerId = { not: userId };
          break;
        case ViewType.COMBINED:
          // No additional filtering needed
          break;
      }
    }

    const accounts = await this.prisma.account.findMany({
      where,
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
            type: true,
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    });

    // Calculate balances for all accounts
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const calculatedBalance = await this.calculateAccountBalance(account.id);
        return {
          ...account,
          calculatedBalance,
        };
      }),
    );

    return accountsWithBalance;
  }

  async update(id: string, data: UpdateAccountDto): Promise<Account> {
    return this.prisma.account.update({
      where: { id },
      data,
      include: {
        institution: true,
      },
    });
  }

  async delete(id: string): Promise<Account> {
    return this.prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Calculate account balance from ledger entries using double-entry accounting
   */
  async calculateAccountBalance(accountId: string): Promise<bigint> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { type: true },
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const ledgerEntries = await this.prisma.ledgerEntry.findMany({
      where: { accountId },
    });

    let balance = BigInt(0);

    for (const entry of ledgerEntries) {
      if (account.type === AccountType.ASSET) {
        // For assets: Debits increase balance, Credits decrease balance
        if (entry.type === 'DEBIT') {
          balance += entry.amountCents;
        } else {
          balance -= entry.amountCents;
        }
      } else {
        // For liabilities: Credits increase balance, Debits decrease balance
        if (entry.type === 'CREDIT') {
          balance += entry.amountCents;
        } else {
          balance -= entry.amountCents;
        }
      }
    }

    return balance;
  }

  /**
   * Get account balance history over time
   */
  async getAccountHistory(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BalanceHistoryPoint[]> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { type: true },
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    // Get all ledger entries within the date range, ordered by transaction date
    const ledgerEntries = await this.prisma.ledgerEntry.findMany({
      where: {
        accountId,
        transaction: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        transaction: {
          select: {
            date: true,
          },
        },
      },
      orderBy: {
        transaction: {
          date: 'asc',
        },
      },
    });

    // Calculate running balance
    const historyPoints: BalanceHistoryPoint[] = [];
    let runningBalance = BigInt(0);

    // Get initial balance before the start date
    const initialEntries = await this.prisma.ledgerEntry.findMany({
      where: {
        accountId,
        transaction: {
          date: {
            lt: startDate,
          },
        },
      },
    });

    // Calculate initial balance
    for (const entry of initialEntries) {
      if (account.type === AccountType.ASSET) {
        if (entry.type === 'DEBIT') {
          runningBalance += entry.amountCents;
        } else {
          runningBalance -= entry.amountCents;
        }
      } else {
        if (entry.type === 'CREDIT') {
          runningBalance += entry.amountCents;
        } else {
          runningBalance -= entry.amountCents;
        }
      }
    }

    // Process entries within the date range
    let currentDate: string | null = null;
    let dailyBalance = runningBalance;

    for (const entry of ledgerEntries) {
      const entryDate = entry.transaction.date.toISOString().split('T')[0];

      // If we've moved to a new date, record the previous day's balance
      if (currentDate && currentDate !== entryDate) {
        historyPoints.push({
          date: new Date(currentDate),
          balance: dailyBalance,
        });
      }

      // Update running balance with this entry
      if (account.type === AccountType.ASSET) {
        if (entry.type === 'DEBIT') {
          dailyBalance += entry.amountCents;
        } else {
          dailyBalance -= entry.amountCents;
        }
      } else {
        if (entry.type === 'CREDIT') {
          dailyBalance += entry.amountCents;
        } else {
          dailyBalance -= entry.amountCents;
        }
      }

      currentDate = entryDate;
    }

    // Add the final day's balance
    if (currentDate) {
      historyPoints.push({
        date: new Date(currentDate),
        balance: dailyBalance,
      });
    }

    return historyPoints;
  }

  /**
   * Get account subtypes for a given account type
   */
  getAccountSubtypes(type: AccountType): string[] {
    switch (type) {
      case AccountType.ASSET:
        return [
          'BANK',
          'CASH',
          'INVESTMENT',
          'CRYPTO',
          'RECEIVABLE',
          'PREPAID',
          'OTHER_ASSET',
        ];
      case AccountType.LIABILITY:
        return [
          'CREDIT_CARD',
          'LOAN',
          'MORTGAGE',
          'PAYABLE',
          'ACCRUED',
          'OTHER_LIABILITY',
        ];
      default:
        return [];
    }
  }

  /**
   * Validate account integrity by checking if calculated balance matches stored balance
   */
  async validateAccountIntegrity(accountId: string): Promise<boolean> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) return false;

    const calculatedBalance = await this.calculateAccountBalance(accountId);
    return calculatedBalance === account.balanceCents;
  }

  /**
   * Update stored balance to match calculated balance (for maintenance)
   */
  async syncAccountBalance(accountId: string): Promise<void> {
    const calculatedBalance = await this.calculateAccountBalance(accountId);
    
    await this.prisma.account.update({
      where: { id: accountId },
      data: { balanceCents: calculatedBalance },
    });
  }
}
