import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../../prisma/prisma.service';
import { Account } from '@prisma/client';

@Injectable()
export class AccountsDataLoader {
  constructor(private prisma: PrismaService) {}

  // Batch load accounts by IDs
  private accountLoader = new DataLoader<string, Account | null>(
    async (accountIds: readonly string[]) => {
      const accounts = await this.prisma.account.findMany({
        where: {
          id: { in: [...accountIds] },
        },
        include: {
          institution: true,
        },
      });

      const accountMap = new Map(accounts.map(account => [account.id, account]));
      return accountIds.map(id => accountMap.get(id) || null);
    },
  );

  // Batch load accounts by household ID
  private accountsByHouseholdLoader = new DataLoader<string, Account[]>(
    async (householdIds: readonly string[]) => {
      const accounts = await this.prisma.account.findMany({
        where: {
          householdId: { in: [...householdIds] },
          isActive: true,
        },
        include: {
          institution: true,
        },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' },
        ],
      });

      const accountsByHousehold = new Map<string, Account[]>();
      accounts.forEach(account => {
        const existing = accountsByHousehold.get(account.householdId) || [];
        existing.push(account);
        accountsByHousehold.set(account.householdId, existing);
      });

      return householdIds.map(id => accountsByHousehold.get(id) || []);
    },
  );

  // Batch load account balances
  private accountBalanceLoader = new DataLoader<string, bigint>(
    async (accountIds: readonly string[]) => {
      const balances = await this.prisma.$queryRaw<Array<{ accountId: string; balance: bigint }>>`
        SELECT 
          le.account_id as "accountId",
          COALESCE(
            SUM(
              CASE 
                WHEN a.type = 'ASSET' AND le.type = 'DEBIT' THEN le.amount_cents
                WHEN a.type = 'ASSET' AND le.type = 'CREDIT' THEN -le.amount_cents
                WHEN a.type = 'LIABILITY' AND le.type = 'DEBIT' THEN -le.amount_cents
                WHEN a.type = 'LIABILITY' AND le.type = 'CREDIT' THEN le.amount_cents
                ELSE 0
              END
            ), 0
          ) as balance
        FROM ledger_entries le
        JOIN accounts a ON le.account_id = a.id
        WHERE le.account_id = ANY(${[...accountIds]})
        GROUP BY le.account_id, a.type
      `;

      const balanceMap = new Map(balances.map(b => [b.accountId, b.balance]));
      return accountIds.map(id => balanceMap.get(id) || BigInt(0));
    },
  );

  // Public methods
  async loadAccount(id: string): Promise<Account | null> {
    return this.accountLoader.load(id);
  }

  async loadAccounts(ids: string[]): Promise<(Account | null)[]> {
    return this.accountLoader.loadMany(ids);
  }

  async loadAccountsByHousehold(householdId: string): Promise<Account[]> {
    return this.accountsByHouseholdLoader.load(householdId);
  }

  async loadAccountBalance(accountId: string): Promise<bigint> {
    return this.accountBalanceLoader.load(accountId);
  }

  async loadAccountBalances(accountIds: string[]): Promise<bigint[]> {
    return this.accountBalanceLoader.loadMany(accountIds);
  }

  // Clear cache methods
  clearAccount(id: string): void {
    this.accountLoader.clear(id);
  }

  clearAccountsByHousehold(householdId: string): void {
    this.accountsByHouseholdLoader.clear(householdId);
  }

  clearAccountBalance(accountId: string): void {
    this.accountBalanceLoader.clear(accountId);
  }

  clearAll(): void {
    this.accountLoader.clearAll();
    this.accountsByHouseholdLoader.clearAll();
    this.accountBalanceLoader.clearAll();
  }
}
