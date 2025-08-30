import { Resolver, Query, Mutation, Args, ID, Context, ResolveField, Parent, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TransactionsService } from '../../transactions/transactions.service';
import { TransactionsDataLoader } from '../dataloaders/transactions.dataloader';
import { AccountsDataLoader } from '../dataloaders/accounts.dataloader';
import { CategoriesDataLoader } from '../dataloaders/categories.dataloader';
import { UsersDataLoader } from '../dataloaders/users.dataloader';
import { 
  Transaction, 
  TransactionConnection,
  TransactionFilters,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionStats,
  CategoryBreakdown,
  Category,
  Account,
  Pagination
} from '../types/transaction.types';
import { Money } from '../types/common.types';

@Resolver(() => Transaction)
@UseGuards(JwtAuthGuard)
export class TransactionsResolver {
  constructor(
    private transactionsService: TransactionsService,
    private transactionsDataLoader: TransactionsDataLoader,
    private accountsDataLoader: AccountsDataLoader,
    private categoriesDataLoader: CategoriesDataLoader,
    private usersDataLoader: UsersDataLoader,
  ) {}

  @Query(() => TransactionConnection)
  async transactions(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('filters', { type: () => TransactionFilters, nullable: true }) filters?: TransactionFilters,
  ): Promise<TransactionConnection> {
    const result = await this.transactionsService.getTransactions(householdId, filters || {});
    
    return {
      transactions: result.transactions.map(t => this.mapTransaction(t)),
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.hasNextPage,
        hasPreviousPage: result.pagination.hasPreviousPage,
      },
      totalCount: result.pagination.total,
    };
  }

  @Query(() => Transaction, { nullable: true })
  async transaction(
    @Args('id', { type: () => ID }) id: string,
    @Args('householdId', { type: () => ID }) householdId: string,
  ): Promise<Transaction | null> {
    const transaction = await this.transactionsService.getTransactionById(id, householdId);
    return transaction ? this.mapTransaction(transaction) : null;
  }

  @Query(() => [Transaction])
  async recentTransactions(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<Transaction[]> {
    const transactions = await this.transactionsDataLoader.loadRecentTransactionsByHousehold(householdId);
    return transactions.slice(0, limit).map(t => this.mapTransaction(t));
  }

  @Query(() => TransactionStats)
  async transactionStats(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('filters', { type: () => TransactionFilters, nullable: true }) filters?: TransactionFilters,
  ): Promise<TransactionStats> {
    const stats = await this.transactionsService.getTransactionStats(householdId, filters);
    
    return {
      totalTransactions: stats.totalTransactions,
      totalIncome: this.createMoney(BigInt(Math.round(stats.totalIncome * 100)), 'IDR'),
      totalExpenses: this.createMoney(BigInt(Math.round(stats.totalExpenses * 100)), 'IDR'),
      totalTransfers: stats.totalTransfers,
      averageTransactionAmount: this.createMoney(BigInt(Math.round(stats.averageTransactionAmount * 100)), 'IDR'),
      categoriesUsed: stats.categoriesUsed,
      merchantsUsed: stats.merchantsUsed,
    };
  }

  @Query(() => [CategoryBreakdown])
  async categoryBreakdown(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('filters', { type: () => TransactionFilters, nullable: true }) filters?: TransactionFilters,
  ): Promise<CategoryBreakdown[]> {
    const breakdown = await this.transactionsService.getCategoryBreakdown(householdId, filters);
    
    return breakdown.map(item => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      totalAmount: this.createMoney(BigInt(Math.round(item.totalAmount * 100)), 'IDR'),
      transactionCount: item.transactionCount,
      percentage: item.percentage,
    }));
  }

  @Mutation(() => Transaction)
  async createTransaction(
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('input') input: CreateTransactionInput,
    @Context() context: any,
  ): Promise<Transaction> {
    const userId = context.req.user.id;
    const transaction = await this.transactionsService.createTransaction(
      householdId,
      {
        amountCents: Number(input.amountCents),
        currency: input.currency,
        originalAmountCents: input.originalAmountCents ? Number(input.originalAmountCents) : undefined,
        originalCurrency: input.originalCurrency,
        exchangeRate: input.exchangeRate,
        description: input.description,
        categoryId: input.categoryId,
        merchant: input.merchant,
        date: input.date,
        accountId: input.accountId,
        transferAccountId: input.transferAccountId,
        receiptUrl: input.receiptUrl,
        tags: input.tags,
        splits: input.splits?.map(split => ({
          categoryId: split.categoryId,
          amountCents: Number(split.amountCents),
          description: split.description,
        })),
      },
      userId,
    );

    // Clear relevant caches
    this.transactionsDataLoader.clearRecentTransactionsByHousehold(householdId);
    this.transactionsDataLoader.clearTransactionsByAccount(input.accountId);
    if (input.transferAccountId) {
      this.transactionsDataLoader.clearTransactionsByAccount(input.transferAccountId);
    }
    this.accountsDataLoader.clearAccountBalance(input.accountId);
    if (input.transferAccountId) {
      this.accountsDataLoader.clearAccountBalance(input.transferAccountId);
    }

    return this.mapTransaction(transaction);
  }

  @Mutation(() => Transaction)
  async updateTransaction(
    @Args('id', { type: () => ID }) id: string,
    @Args('householdId', { type: () => ID }) householdId: string,
    @Args('input') input: UpdateTransactionInput,
  ): Promise<Transaction> {
    const transaction = await this.transactionsService.updateTransaction(
      id,
      householdId,
      {
        amountCents: input.amountCents ? Number(input.amountCents) : undefined,
        currency: input.currency,
        originalAmountCents: input.originalAmountCents ? Number(input.originalAmountCents) : undefined,
        originalCurrency: input.originalCurrency,
        exchangeRate: input.exchangeRate,
        description: input.description,
        categoryId: input.categoryId,
        merchant: input.merchant,
        date: input.date,
        accountId: input.accountId,
        transferAccountId: input.transferAccountId,
        receiptUrl: input.receiptUrl,
        tags: input.tags,
        splits: input.splits?.map(split => ({
          categoryId: split.categoryId,
          amountCents: Number(split.amountCents),
          description: split.description,
        })),
      },
    );

    // Clear caches
    this.transactionsDataLoader.clearTransaction(id);
    this.transactionsDataLoader.clearRecentTransactionsByHousehold(householdId);

    return this.mapTransaction(transaction);
  }

  @Mutation(() => Boolean)
  async deleteTransaction(
    @Args('id', { type: () => ID }) id: string,
    @Args('householdId', { type: () => ID }) householdId: string,
  ): Promise<boolean> {
    await this.transactionsService.deleteTransaction(id, householdId);
    
    // Clear caches
    this.transactionsDataLoader.clearTransaction(id);
    this.transactionsDataLoader.clearRecentTransactionsByHousehold(householdId);
    
    return true;
  }

  // Field resolvers
  @ResolveField(() => Account)
  async account(@Parent() transaction: Transaction): Promise<Account | null> {
    return this.accountsDataLoader.loadAccount(transaction.account.id);
  }

  @ResolveField(() => Account, { nullable: true })
  async transferAccount(@Parent() transaction: Transaction): Promise<Account | null> {
    if (!transaction.transferAccount) return null;
    return this.accountsDataLoader.loadAccount(transaction.transferAccount.id);
  }

  @ResolveField(() => Category, { nullable: true })
  async category(@Parent() transaction: Transaction): Promise<Category | null> {
    if (!transaction.category) return null;
    return this.categoriesDataLoader.loadCategory(transaction.category.id);
  }

  // Helper methods
  private mapTransaction(transaction: any): Transaction {
    return {
      id: transaction.id,
      householdId: transaction.householdId,
      amount: this.createMoney(transaction.amountCents, transaction.currency),
      originalAmount: transaction.originalAmountCents 
        ? this.createMoney(transaction.originalAmountCents, transaction.originalCurrency || transaction.currency)
        : undefined,
      exchangeRate: transaction.exchangeRate ? Number(transaction.exchangeRate) : undefined,
      description: transaction.description,
      category: transaction.category,
      merchant: transaction.merchant,
      merchantData: transaction.merchantData,
      merchantName: transaction.merchantName,
      merchantLogoUrl: transaction.merchantLogoUrl,
      merchantColor: transaction.merchantColor,
      date: transaction.date,
      account: transaction.account,
      transferAccount: transaction.transferAccount,
      receiptUrl: transaction.receiptUrl,
      tags: transaction.tags || [],
      splits: transaction.splits || [],
      ledgerEntries: transaction.ledgerEntries || [],
      createdBy: transaction.createdBy,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
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
