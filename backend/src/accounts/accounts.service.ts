import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AccountsRepository, AccountWithBalance, BalanceHistoryPoint } from './accounts.repository';
import { CreateAccountDto, UpdateAccountDto, AccountFiltersDto } from './dto';
import { Account, AccountType } from '@prisma/client';

export interface NetWorthSummary {
  totalAssets: bigint;
  totalLiabilities: bigint;
  netWorth: bigint;
  assetsByType: Record<string, bigint>;
  liabilitiesByType: Record<string, bigint>;
  currency: string;
}

@Injectable()
export class AccountsService {
  constructor(private accountsRepository: AccountsRepository) {}

  async createAccount(
    householdId: string,
    data: CreateAccountDto,
    userId: string,
  ): Promise<Account> {
    // Validate account subtype
    const validSubtypes = this.accountsRepository.getAccountSubtypes(data.type);
    if (!validSubtypes.includes(data.subtype)) {
      throw new BadRequestException(
        `Invalid subtype '${data.subtype}' for account type '${data.type}'. Valid subtypes: ${validSubtypes.join(', ')}`,
      );
    }

    // If ownerId is not specified, default to the creating user
    if (!data.ownerId) {
      data.ownerId = userId;
    }

    return this.accountsRepository.create(householdId, data);
  }

  async getAccountById(id: string, householdId: string): Promise<AccountWithBalance> {
    const account = await this.accountsRepository.findById(id);
    
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    if (account.householdId !== householdId) {
      throw new ForbiddenException('Access denied to this account');
    }

    return account;
  }

  async getAccountsByHousehold(
    householdId: string,
    filters: AccountFiltersDto,
    userId?: string,
  ): Promise<AccountWithBalance[]> {
    return this.accountsRepository.findByHousehold(householdId, filters, userId);
  }

  async updateAccount(
    id: string,
    householdId: string,
    data: UpdateAccountDto,
  ): Promise<Account> {
    // Verify account exists and belongs to household
    const existingAccount = await this.getAccountById(id, householdId);

    // Validate subtype if being updated
    if (data.type && data.subtype) {
      const validSubtypes = this.accountsRepository.getAccountSubtypes(data.type);
      if (!validSubtypes.includes(data.subtype)) {
        throw new BadRequestException(
          `Invalid subtype '${data.subtype}' for account type '${data.type}'. Valid subtypes: ${validSubtypes.join(', ')}`,
        );
      }
    }

    return this.accountsRepository.update(id, data);
  }

  async deleteAccount(id: string, householdId: string): Promise<Account> {
    // Verify account exists and belongs to household
    await this.getAccountById(id, householdId);

    // Check if account has transactions
    const hasTransactions = await this.hasTransactions(id);
    if (hasTransactions) {
      // Soft delete by marking as inactive
      return this.accountsRepository.update(id, { isActive: false });
    } else {
      // Hard delete if no transactions
      return this.accountsRepository.delete(id);
    }
  }

  async getAccountBalance(id: string, householdId: string): Promise<bigint> {
    // Verify account exists and belongs to household
    await this.getAccountById(id, householdId);

    return this.accountsRepository.calculateAccountBalance(id);
  }

  async getAccountHistory(
    id: string,
    householdId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BalanceHistoryPoint[]> {
    // Verify account exists and belongs to household
    await this.getAccountById(id, householdId);

    const resolvedEndDate = endDate ?? new Date();
    const resolvedStartDate = startDate ?? new Date(resolvedEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.accountsRepository.getAccountHistory(id, resolvedStartDate, resolvedEndDate);
  }

  async getNetWorthSummary(
    householdId: string,
    currency = 'IDR',
    filters?: AccountFiltersDto,
  ): Promise<NetWorthSummary> {
    const accounts = await this.getAccountsByHousehold(
      householdId,
      { ...filters, currency },
    );

    let totalAssets = BigInt(0);
    let totalLiabilities = BigInt(0);
    const assetsByType: Record<string, bigint> = {};
    const liabilitiesByType: Record<string, bigint> = {};

    for (const account of accounts) {
      if (!account.isActive) continue;

      const balance = account.calculatedBalance;

      if (account.type === AccountType.ASSET) {
        totalAssets += balance;
        assetsByType[account.subtype] = (assetsByType[account.subtype] || BigInt(0)) + balance;
      } else {
        totalLiabilities += balance;
        liabilitiesByType[account.subtype] = (liabilitiesByType[account.subtype] || BigInt(0)) + balance;
      }
    }

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      assetsByType,
      liabilitiesByType,
      currency,
    };
  }

  async getAccountSubtypes(type: AccountType): Promise<string[]> {
    return this.accountsRepository.getAccountSubtypes(type);
  }

  async validateAccountIntegrity(id: string, householdId: string): Promise<boolean> {
    // Verify account exists and belongs to household
    await this.getAccountById(id, householdId);

    return this.accountsRepository.validateAccountIntegrity(id);
  }

  async syncAccountBalance(id: string, householdId: string): Promise<void> {
    // Verify account exists and belongs to household
    await this.getAccountById(id, householdId);

    await this.accountsRepository.syncAccountBalance(id);
  }

  private async hasTransactions(accountId: string): Promise<boolean> {
    // This would typically use a transaction repository
    // For now, we'll implement a simple check
    // In a real implementation, this should be injected as a dependency
    return false; // Placeholder - should check if account has any transactions
  }

  /**
   * Get accounts grouped by type and subtype for dashboard display
   */
  async getAccountsGrouped(
    householdId: string,
    filters?: AccountFiltersDto,
    userId?: string,
  ): Promise<{
    assets: Record<string, AccountWithBalance[]>;
    liabilities: Record<string, AccountWithBalance[]>;
  }> {
    const accounts = await this.getAccountsByHousehold(householdId, filters || {}, userId);

    const assets: Record<string, AccountWithBalance[]> = {};
    const liabilities: Record<string, AccountWithBalance[]> = {};

    for (const account of accounts) {
      if (!account.isActive) continue;

      if (account.type === AccountType.ASSET) {
        if (!assets[account.subtype]) {
          assets[account.subtype] = [];
        }
        assets[account.subtype].push(account);
      } else {
        if (!liabilities[account.subtype]) {
          liabilities[account.subtype] = [];
        }
        liabilities[account.subtype].push(account);
      }
    }

    return { assets, liabilities };
  }

  /**
   * Get account summary statistics
   */
  async getAccountStats(householdId: string): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    assetAccounts: number;
    liabilityAccounts: number;
    currenciesUsed: string[];
  }> {
    const accounts = await this.getAccountsByHousehold(householdId, {});

    const currenciesUsed = [...new Set(accounts.map(account => account.currency))];

    return {
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter(account => account.isActive).length,
      assetAccounts: accounts.filter(account => account.type === AccountType.ASSET).length,
      liabilityAccounts: accounts.filter(account => account.type === AccountType.LIABILITY).length,
      currenciesUsed,
    };
  }
}
