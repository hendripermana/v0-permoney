import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { TransactionsRepository, PaginatedTransactions, AccountingValidation } from './transactions.repository';
import { CreateTransactionDto, UpdateTransactionDto, TransactionFiltersDto, TransactionSearchDto, TransactionSplitDto } from './dto';
import { CurrencyService, ExchangeRatesService } from '../exchange-rates';
import {
  TransactionWithDetails,
  TransactionWithAmounts,
  convertTransactionAmounts,
  convertBigIntToNumber,
  formatTransactionAmount,
} from './types/transaction.types';

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

@Injectable()
export class TransactionsService {
  constructor(
    private transactionsRepository: TransactionsRepository,
    private currencyService: CurrencyService,
    private exchangeRatesService: ExchangeRatesService,
  ) {}

  /**
   * Create a new transaction with automatic ledger entry generation
   */
  async createTransaction(
    householdId: string,
    data: CreateTransactionDto,
    userId: string,
  ): Promise<TransactionWithDetails> {
    // Validate transaction data
    await this.validateTransactionData(householdId, data);

    try {
      const transaction = await this.transactionsRepository.create(householdId, data, userId);
      
      // Validate accounting equation after creation
      const validation = await this.transactionsRepository.validateAccountingEquation(transaction.id);
      if (!validation.isValid) {
        throw new BadRequestException(`Transaction created but accounting equation is invalid: ${validation.errors.join(', ')}`);
      }

      return transaction;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`Failed to create transaction: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(
    id: string,
    householdId: string,
  ): Promise<TransactionWithDetails> {
    try {
      const transaction = await this.transactionsRepository.findById(id, householdId);
      
      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      return transaction;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Get transactions with filters and pagination
   */
  async getTransactions(
    householdId: string,
    filters: TransactionFiltersDto,
  ): Promise<PaginatedTransactions> {
    return this.transactionsRepository.findMany(householdId, filters);
  }

  /**
   * Search transactions by text query
   */
  async searchTransactions(
    householdId: string,
    searchParams: TransactionSearchDto,
  ): Promise<PaginatedTransactions> {
    return this.transactionsRepository.search(householdId, searchParams);
  }

  /**
   * Update a transaction
   */
  async updateTransaction(
    id: string,
    householdId: string,
    data: UpdateTransactionDto,
  ): Promise<TransactionWithDetails> {
    // Verify transaction exists and belongs to household
    await this.getTransactionById(id, householdId);

    // Validate update data
    if (data.transferAccountId !== undefined || data.amountCents !== undefined) {
      await this.validateTransactionData(householdId, data as CreateTransactionDto);
    }

    try {
      const transaction = await this.transactionsRepository.update(id, householdId, data);
      
      // Validate accounting equation after update
      const validation = await this.transactionsRepository.validateAccountingEquation(transaction.id);
      if (!validation.isValid) {
        throw new BadRequestException(`Transaction updated but accounting equation is invalid: ${validation.errors.join(', ')}`);
      }

      return transaction;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`Failed to update transaction: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string, householdId: string): Promise<void> {
    // Verify transaction exists and belongs to household
    await this.getTransactionById(id, householdId);

    try {
      await this.transactionsRepository.delete(id, householdId);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`Failed to delete transaction: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Update transaction splits
   */
  async updateTransactionSplits(
    id: string,
    householdId: string,
    splits: TransactionSplitDto[],
  ): Promise<TransactionWithDetails> {
    const transaction = await this.getTransactionById(id, householdId);

    // Validate splits total equals transaction amount
    const splitsTotal = splits.reduce((sum, split) => sum + split.amountCents, 0);
    const transactionAmount = convertBigIntToNumber(transaction.amountCents);
    
    if (splitsTotal !== transactionAmount) {
      throw new BadRequestException(
        `Splits total (${splitsTotal}) must equal transaction amount (${transactionAmount})`
      );
    }

    return this.updateTransaction(id, householdId, { splits });
  }

  /**
   * Categorize a transaction
   */
  async categorizeTransaction(
    id: string,
    householdId: string,
    categoryId: string,
  ): Promise<TransactionWithDetails> {
    return this.updateTransaction(id, householdId, { categoryId });
  }

  /**
   * Add tags to a transaction
   */
  async addTransactionTags(
    id: string,
    householdId: string,
    tags: string[],
  ): Promise<TransactionWithDetails> {
    const transaction = await this.getTransactionById(id, householdId);
    const existingTags = transaction.tags.map(t => t.tag);
    const newTags = [...new Set([...existingTags, ...tags])];

    return this.updateTransaction(id, householdId, { tags: newTags });
  }

  /**
   * Remove tags from a transaction
   */
  async removeTransactionTags(
    id: string,
    householdId: string,
    tagsToRemove: string[],
  ): Promise<TransactionWithDetails> {
    const transaction = await this.getTransactionById(id, householdId);
    const existingTags = transaction.tags.map(t => t.tag);
    const newTags = existingTags.filter(tag => !tagsToRemove.includes(tag));

    return this.updateTransaction(id, householdId, { tags: newTags });
  }

  /**
   * Validate accounting equation for a transaction
   */
  async validateTransactionAccounting(
    id: string,
    householdId: string,
  ): Promise<AccountingValidation> {
    // Verify transaction exists and belongs to household
    await this.getTransactionById(id, householdId);

    return this.transactionsRepository.validateAccountingEquation(id);
  }

  /**
   * Get transaction statistics for a household
   */
  async getTransactionStats(
    householdId: string,
    filters?: Partial<TransactionFiltersDto>,
  ): Promise<TransactionStats> {
    const allTransactions = await this.transactionsRepository.findMany(householdId, {
      ...filters,
      page: 1,
      limit: 10000, // Get all transactions for stats
    });

    const transactions = allTransactions.transactions;
    
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;
    const categories = new Set<string>();
    const merchants = new Set<string>();

    for (const transaction of transactions) {
      const amount = convertBigIntToNumber(transaction.amountCents);
      
      if (transaction.transferAccountId) {
        totalTransfers++;
      } else if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }

      if (transaction.category?.id) {
        categories.add(transaction.category.id);
      }

      if (transaction.merchant || transaction.merchantName) {
        merchants.add(transaction.merchant || transaction.merchantName || '');
      }
    }

    const totalAmount = totalIncome + totalExpenses;
    const averageTransactionAmount = transactions.length > 0 
      ? totalAmount / transactions.length 
      : 0;

    return {
      totalTransactions: transactions.length,
      totalIncome,
      totalExpenses,
      totalTransfers,
      averageTransactionAmount,
      categoriesUsed: categories.size,
      merchantsUsed: merchants.size,
    };
  }

  /**
   * Get category breakdown for transactions
   */
  async getCategoryBreakdown(
    householdId: string,
    filters?: Partial<TransactionFiltersDto>,
  ): Promise<CategoryBreakdown[]> {
    const allTransactions = await this.transactionsRepository.findMany(householdId, {
      ...filters,
      page: 1,
      limit: 10000, // Get all transactions for breakdown
    });

    const transactions = allTransactions.transactions;
    const categoryMap = new Map<string, { name: string; total: number; count: number }>();
    let grandTotal = 0;

    for (const transaction of transactions) {
      if (!transaction.category || transaction.transferAccountId) continue;

      const amountCents = convertBigIntToNumber(transaction.amountCents);
      const amount = amountCents > 0 ? amountCents : Math.abs(amountCents);
      grandTotal += amount;

      const existing = categoryMap.get(transaction.category.id);
      if (existing) {
        existing.total += amount;
        existing.count++;
      } else {
        categoryMap.set(transaction.category.id, {
          name: transaction.category.name,
          total: amount,
          count: 1,
        });
      }
    }

    const breakdown: CategoryBreakdown[] = [];
    for (const [categoryId, data] of categoryMap.entries()) {
      const percentage = grandTotal > 0 
        ? (data.total / grandTotal) * 100 
        : 0;

      breakdown.push({
        categoryId,
        categoryName: data.name,
        totalAmount: data.total,
        transactionCount: data.count,
        percentage,
      });
    }

    return breakdown.sort((a, b) => Number(b.totalAmount - a.totalAmount));
  }

  /**
   * Validate transaction data before creation/update
   */
  private async validateTransactionData(
    householdId: string,
    data: Partial<CreateTransactionDto>,
  ): Promise<void> {
    // Auto-populate exchange rate if needed
    await this.autoPopulateExchangeRate(data);

    // Validate amount
    if (data.amountCents !== undefined && data.amountCents <= 0) {
      throw new BadRequestException('Transaction amount must be positive');
    }

    // Validate currency
    if (data.currency && !this.currencyService.validateCurrency(data.currency)) {
      throw new BadRequestException(`Invalid currency: ${data.currency}`);
    }

    // Validate original currency if provided
    if (data.originalCurrency && !this.currencyService.validateCurrency(data.originalCurrency)) {
      throw new BadRequestException(`Invalid original currency: ${data.originalCurrency}`);
    }

    // Validate exchange rate
    if (data.exchangeRate !== undefined && data.exchangeRate <= 0) {
      throw new BadRequestException('Exchange rate must be positive');
    }

    // Validate multi-currency consistency
    if (data.originalAmountCents && !data.originalCurrency) {
      throw new BadRequestException('Original currency is required when original amount is provided');
    }

    if (data.originalCurrency && !data.originalAmountCents) {
      throw new BadRequestException('Original amount is required when original currency is provided');
    }

    if (data.originalAmountCents && data.originalCurrency && !data.exchangeRate) {
      throw new BadRequestException('Exchange rate is required for multi-currency transactions');
    }

    // Validate transfer account is different from main account
    if (data.transferAccountId && data.accountId && data.transferAccountId === data.accountId) {
      throw new BadRequestException('Transfer account must be different from the main account');
    }

    // Validate splits if provided
    if (data.splits && data.splits.length > 0) {
      const splitsTotal = data.splits.reduce((sum, split) => sum + split.amountCents, 0);
      if (data.amountCents && splitsTotal !== data.amountCents) {
        throw new BadRequestException(
          `Splits total (${splitsTotal}) must equal transaction amount (${data.amountCents})`
        );
      }

      // Validate split amounts are positive
      for (const split of data.splits) {
        if (split.amountCents <= 0) {
          throw new BadRequestException('Split amounts must be positive');
        }
      }
    }
  }

  /**
   * Auto-populate exchange rate for multi-currency transactions
   */
  private async autoPopulateExchangeRate(data: CreateTransactionDto | UpdateTransactionDto): Promise<void> {
    // If we have original currency and amount but no exchange rate, try to fetch it
    if (data.originalCurrency && data.originalAmountCents && !data.exchangeRate) {
      try {
        const conversionResult = await this.exchangeRatesService.convertCurrency({
          amountCents: data.originalAmountCents,
          fromCurrency: data.originalCurrency,
          toCurrency: data.currency || 'IDR',
        });
        
        data.exchangeRate = conversionResult.exchangeRate;
        data.amountCents = conversionResult.convertedAmountCents;
      } catch (error) {
        // If we can't get the exchange rate, let the validation catch it
        // This allows manual entry of exchange rates when auto-fetch fails
      }
    }
  }
}
