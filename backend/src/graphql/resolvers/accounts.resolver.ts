import { Resolver, Query, Mutation, Args, ID, Context, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AccountsService } from '../../accounts/accounts.service';
import { AccountsDataLoader } from '../dataloaders/accounts.dataloader';
import { 
  Account, 
  AccountFilters, 
  CreateAccountInput, 
  UpdateAccountInput,
  NetWorthSummary,
  AccountStats,
  BalanceHistoryPoint,
  NetWorthPoint,
  Institution
} from '../types/account.types';
import { Money, GraphQLDateTime } from '../types/common.types';
import { AccountWithBalance } from '../../accounts/accounts.repository';

@Resolver(() => Account)
export class AccountsResolver {
  constructor(
    private accountsService: AccountsService,
    private accountsDataLoader: AccountsDataLoader,
  ) {}

  @Query(() => [Account])
  async accounts(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('filters', { type: () => AccountFilters, nullable: true }) filters?: AccountFilters,
    @Context() context?: any,
  ): Promise<Account[]> {
    const userId = context.req.user?.userId ?? context.req.user?.sub ?? context.req.user?.id;
    const accountsData = await this.accountsService.getAccountsByHousehold(
      householdId,
      filters || {},
      userId,
    );
    
    return accountsData.map(account => this.mapAccountWithBalance(account));
  }

  @Query(() => Account, { nullable: true })
  async account(
    @Args('id', { type: () => ID }) id: string,
    @Args('householdId', { type: () => ID }) householdId: string,
  ): Promise<Account | null> {
    const accountData = await this.accountsService.getAccountById(id, householdId);
    return accountData ? this.mapAccountWithBalance(accountData) : null;
  }

  @Query(() => NetWorthSummary)
  async netWorthSummary(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('currency', { nullable: true, defaultValue: 'IDR' }) currency: string,
    @Args('filters', { type: () => AccountFilters, nullable: true }) filters?: AccountFilters,
  ): Promise<NetWorthSummary> {
    const summary = await this.accountsService.getNetWorthSummary(householdId, currency, filters);
    
    return {
      totalAssets: this.createMoney(summary.totalAssets, currency),
      totalLiabilities: this.createMoney(summary.totalLiabilities, currency),
      netWorth: this.createMoney(summary.netWorth, currency),
      assetsByType: Object.entries(summary.assetsByType).map(([subtype, amount]) => ({
        subtype,
        amount: this.createMoney(amount, currency),
        accounts: [], // Will be resolved by field resolver
      })),
      liabilitiesByType: Object.entries(summary.liabilitiesByType).map(([subtype, amount]) => ({
        subtype,
        amount: this.createMoney(amount, currency),
        accounts: [], // Will be resolved by field resolver
      })),
      currency,
    };
  }

  @Query(() => AccountStats)
  async accountStats(
    @Args('householdId', { type: () => ID }) householdId: string,
  ): Promise<AccountStats> {
    return this.accountsService.getAccountStats(householdId);
  }

  @Query(() => [BalanceHistoryPoint])
  async accountHistory(
    @Args('accountId', { type: () => ID }) accountId: string,
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('startDate', { type: () => GraphQLDateTime }) startDate: Date,
    @Args('endDate', { type: () => GraphQLDateTime }) endDate: Date,
  ): Promise<BalanceHistoryPoint[]> {
    const history = await this.accountsService.getAccountHistory(
      accountId,
      householdId,
      startDate,
      endDate,
    );

    return history.map(point => ({
      date: point.date,
      balance: this.createMoney(point.balance, 'IDR'), // TODO: Get actual currency
      runningBalance: this.createMoney(point.runningBalance, 'IDR'),
    }));
  }

  @Mutation(() => Account)
  async createAccount(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('input') input: CreateAccountInput,
    @Context() context: any,
  ): Promise<Account> {
    const userId = context.req.user?.userId ?? context.req.user?.sub ?? context.req.user?.id;
    const account = await this.accountsService.createAccount(householdId, input, userId);
    
    // Clear cache
    this.accountsDataLoader.clearAccountsByHousehold(householdId);
    
    return this.mapAccount(account);
  }

  @Mutation(() => Account)
  async updateAccount(
    @Args('id', { type: () => ID }) id: string,
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('input') input: UpdateAccountInput,
  ): Promise<Account> {
    const account = await this.accountsService.updateAccount(id, householdId, input);
    
    // Clear cache
    this.accountsDataLoader.clearAccount(id);
    this.accountsDataLoader.clearAccountsByHousehold(householdId);
    
    return this.mapAccount(account);
  }

  @Mutation(() => Account)
  async deleteAccount(
    @Args('id', { type: () => ID }) id: string,
    @Args('householdId', { type: () => ID }) householdId: string,
  ): Promise<Account> {
    const account = await this.accountsService.deleteAccount(id, householdId);
    
    // Clear cache
    this.accountsDataLoader.clearAccount(id);
    this.accountsDataLoader.clearAccountsByHousehold(householdId);
    
    return this.mapAccount(account);
  }

  // Field resolvers
  @ResolveField(() => Money)
  async calculatedBalance(@Parent() account: Account): Promise<Money> {
    const balance = await this.accountsDataLoader.loadAccountBalance(account.id);
    return this.createMoney(balance, account.currency);
  }

  @ResolveField(() => Institution, { nullable: true })
  async institution(@Parent() account: Account): Promise<Institution | null> {
    // This would be loaded from the account data or via a separate loader
    return null; // Placeholder - implement institution loading
  }

  // Helper methods
  private mapAccount(account: any): Account {
    return {
      id: account.id,
      householdId: account.householdId,
      name: account.name,
      type: account.type,
      subtype: account.subtype,
      currency: account.currency,
      accountNumber: account.accountNumber,
      balance: this.createMoney(account.balanceCents, account.currency),
      calculatedBalance: this.createMoney(BigInt(0), account.currency), // Will be resolved
      isActive: account.isActive,
      ownerId: account.ownerId,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  private mapAccountWithBalance(account: AccountWithBalance): Account {
    return {
      id: account.id,
      householdId: account.householdId,
      name: account.name,
      type: account.type,
      subtype: account.subtype,
      currency: account.currency,
      accountNumber: account.accountNumber,
      balance: this.createMoney(account.balanceCents, account.currency),
      calculatedBalance: this.createMoney(account.calculatedBalance, account.currency),
      isActive: account.isActive,
      ownerId: account.ownerId,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  private createMoney(cents: bigint, currency: string): Money {
    const amount = Number(cents) / 100;
    return {
      cents,
      currency,
      amount,
      formatted: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency,
      }).format(amount),
    };
  }
}
