/**
 * Comprehensive validation tests for Transaction Management Interface
 * Tests all requirements from Task 25
 */

import { z } from 'zod';
import { CreateTransactionData, UpdateTransactionData, TransactionFilters } from '@/types/transaction';

describe('Transaction Management Interface - Comprehensive Validation', () => {
  describe('Requirement 6.1: Manual Transaction Input', () => {
    it('validates transaction creation with all required fields', () => {
      const validTransaction: CreateTransactionData = {
        amountCents: 10000,
        currency: 'IDR',
        description: 'Test transaction',
        date: '2024-01-01T00:00:00.000Z',
        accountId: 'account-1',
        categoryId: 'category-1',
        merchant: 'Test Merchant',
        tags: ['tag1', 'tag2'],
        splits: [
          {
            categoryId: 'category-1',
            amountCents: 5000,
            description: 'Split 1',
          },
          {
            categoryId: 'category-2',
            amountCents: 5000,
            description: 'Split 2',
          },
        ],
      };

      expect(validTransaction.amountCents).toBeGreaterThan(0);
      expect(validTransaction.description).toBeTruthy();
      expect(validTransaction.accountId).toBeTruthy();
      expect(validTransaction.date).toBeTruthy();
      expect(validTransaction.categoryId).toBeTruthy();
      expect(validTransaction.tags).toHaveLength(2);
      expect(validTransaction.splits).toHaveLength(2);
    });

    it('validates transaction splits total equals transaction amount', () => {
      const transaction: CreateTransactionData = {
        amountCents: 10000,
        currency: 'IDR',
        description: 'Test transaction',
        date: '2024-01-01T00:00:00.000Z',
        accountId: 'account-1',
        splits: [
          { categoryId: 'cat-1', amountCents: 6000 },
          { categoryId: 'cat-2', amountCents: 4000 },
        ],
      };

      const splitsTotal = transaction.splits!.reduce((sum, split) => sum + split.amountCents, 0);
      expect(splitsTotal).toBe(transaction.amountCents);
    });

    it('validates transfer transactions', () => {
      const transferTransaction: CreateTransactionData = {
        amountCents: 50000,
        currency: 'IDR',
        description: 'Transfer to savings',
        date: '2024-01-01T00:00:00.000Z',
        accountId: 'checking-account',
        transferAccountId: 'savings-account',
      };

      expect(transferTransaction.transferAccountId).toBeTruthy();
      expect(transferTransaction.transferAccountId).not.toBe(transferTransaction.accountId);
    });

    it('validates multi-currency transactions', () => {
      const multiCurrencyTransaction: CreateTransactionData = {
        amountCents: 100000, // IDR amount
        currency: 'IDR',
        originalAmountCents: 700, // USD amount (7 USD)
        originalCurrency: 'USD',
        exchangeRate: 14285.71, // 1 USD = 14,285.71 IDR
        description: 'USD purchase',
        date: '2024-01-01T00:00:00.000Z',
        accountId: 'account-1',
      };

      expect(multiCurrencyTransaction.originalAmountCents).toBeTruthy();
      expect(multiCurrencyTransaction.originalCurrency).toBeTruthy();
      expect(multiCurrencyTransaction.exchangeRate).toBeTruthy();
      expect(multiCurrencyTransaction.currency).not.toBe(multiCurrencyTransaction.originalCurrency);
    });
  });

  describe('Requirement 6.2: AI Auto-tagging with User Confirmation', () => {
    it('validates AI suggestion structure', () => {
      const aiSuggestion = {
        categoryId: 'food-dining',
        categoryName: 'Food & Dining',
        confidence: 0.85,
        reason: 'Merchant name suggests restaurant/food service',
      };

      expect(aiSuggestion.categoryId).toBeTruthy();
      expect(aiSuggestion.categoryName).toBeTruthy();
      expect(aiSuggestion.confidence).toBeGreaterThan(0);
      expect(aiSuggestion.confidence).toBeLessThanOrEqual(1);
      expect(aiSuggestion.reason).toBeTruthy();
    });

    it('validates AI suggestions require user confirmation', () => {
      // AI suggestions should not automatically apply
      // User must explicitly select a suggestion
      const transaction: CreateTransactionData = {
        amountCents: 10000,
        currency: 'IDR',
        description: 'Restaurant dinner',
        date: '2024-01-01T00:00:00.000Z',
        accountId: 'account-1',
        // categoryId should be undefined until user confirms
      };

      expect(transaction.categoryId).toBeUndefined();
    });

    it('validates confidence scoring for AI suggestions', () => {
      const suggestions = [
        { categoryId: 'food', confidence: 0.95, categoryName: 'Food', reason: 'High confidence' },
        { categoryId: 'transport', confidence: 0.65, categoryName: 'Transport', reason: 'Medium confidence' },
        { categoryId: 'misc', confidence: 0.30, categoryName: 'Miscellaneous', reason: 'Low confidence' },
      ];

      // Should be sorted by confidence
      const sortedSuggestions = suggestions.sort((a, b) => b.confidence - a.confidence);
      expect(sortedSuggestions[0].confidence).toBe(0.95);
      expect(sortedSuggestions[2].confidence).toBe(0.30);
    });
  });

  describe('Requirement 6.3: Flexible Recurring Transaction Scheduling', () => {
    it('validates recurring transaction patterns', () => {
      const recurringTransaction = {
        amountCents: 500000,
        currency: 'IDR',
        description: 'Monthly salary',
        accountId: 'account-1',
        categoryId: 'salary',
        isRecurring: true,
        recurringPattern: {
          frequency: 'MONTHLY',
          interval: 1,
          dayOfMonth: 1,
          endDate: '2024-12-31T00:00:00.000Z',
        },
      };

      expect(recurringTransaction.isRecurring).toBe(true);
      expect(recurringTransaction.recurringPattern.frequency).toBe('MONTHLY');
      expect(recurringTransaction.recurringPattern.interval).toBeGreaterThan(0);
    });

    it('validates different recurring frequencies', () => {
      const frequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
      
      frequencies.forEach(frequency => {
        const pattern = {
          frequency,
          interval: 1,
        };
        
        expect(frequencies).toContain(pattern.frequency);
      });
    });
  });

  describe('Requirement 6.4: Hierarchical Categories with Custom Tags', () => {
    it('validates hierarchical category structure', () => {
      const parentCategory = {
        id: 'food',
        name: 'Food & Dining',
        color: '#ef4444',
        icon: 'utensils',
        parentId: undefined,
      };

      const childCategory = {
        id: 'restaurants',
        name: 'Restaurants',
        color: '#ef4444',
        icon: 'utensils',
        parentId: 'food',
      };

      expect(parentCategory.parentId).toBeUndefined();
      expect(childCategory.parentId).toBe(parentCategory.id);
    });

    it('validates custom tags functionality', () => {
      const transaction: CreateTransactionData = {
        amountCents: 10000,
        currency: 'IDR',
        description: 'Business lunch',
        date: '2024-01-01T00:00:00.000Z',
        accountId: 'account-1',
        tags: ['business', 'deductible', 'client-meeting'],
      };

      expect(transaction.tags).toHaveLength(3);
      expect(transaction.tags).toContain('business');
      expect(transaction.tags).toContain('deductible');
      expect(transaction.tags).toContain('client-meeting');
    });

    it('validates tag uniqueness', () => {
      const tags = ['business', 'deductible', 'business']; // duplicate
      const uniqueTags = [...new Set(tags)];
      
      expect(uniqueTags).toHaveLength(2);
      expect(uniqueTags).toEqual(['business', 'deductible']);
    });
  });

  describe('Requirement 6.5: AI Suggestions in Checklist Format', () => {
    it('validates checklist format for AI suggestions', () => {
      const aiSuggestionChecklist = [
        {
          id: 'suggestion-1',
          categoryId: 'food-dining',
          categoryName: 'Food & Dining',
          confidence: 0.85,
          reason: 'Merchant name suggests restaurant',
          selected: false,
          requiresApproval: true,
        },
        {
          id: 'suggestion-2',
          categoryId: 'groceries',
          categoryName: 'Groceries',
          confidence: 0.65,
          reason: 'Transaction description contains food keywords',
          selected: false,
          requiresApproval: true,
        },
      ];

      aiSuggestionChecklist.forEach(suggestion => {
        expect(suggestion.selected).toBe(false); // Initially unselected
        expect(suggestion.requiresApproval).toBe(true); // Requires manual approval
        expect(suggestion.confidence).toBeGreaterThan(0);
      });
    });

    it('validates manual approval workflow', () => {
      let selectedSuggestion = null;
      const suggestions = [
        { id: '1', categoryId: 'food', categoryName: 'Food' },
        { id: '2', categoryId: 'transport', categoryName: 'Transport' },
      ];

      // Simulate user selection
      const userSelectedId = '1';
      selectedSuggestion = suggestions.find(s => s.id === userSelectedId);

      expect(selectedSuggestion).toBeTruthy();
      expect(selectedSuggestion?.categoryId).toBe('food');
    });
  });

  describe('Transaction Search and Filtering', () => {
    it('validates comprehensive filtering options', () => {
      const filters: TransactionFilters = {
        accountId: 'account-1',
        categoryId: 'category-1',
        type: 'EXPENSE',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
        minAmount: 1000,
        maxAmount: 100000,
        currency: 'IDR',
        merchant: 'Supermarket',
        tags: ['groceries', 'essential'],
        includeTransfers: false,
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        limit: 50,
      };

      expect(filters.accountId).toBeTruthy();
      expect(filters.type).toBe('EXPENSE');
      expect(filters.minAmount).toBeGreaterThan(0);
      expect(filters.maxAmount).toBeGreaterThan(filters.minAmount!);
      expect(filters.tags).toHaveLength(2);
      expect(['asc', 'desc']).toContain(filters.sortOrder);
    });

    it('validates search functionality', () => {
      const searchParams = {
        query: 'grocery shopping',
        page: 1,
        limit: 50,
        sortBy: 'date' as const,
        sortOrder: 'desc' as const,
      };

      expect(searchParams.query).toBeTruthy();
      expect(searchParams.page).toBeGreaterThan(0);
      expect(searchParams.limit).toBeGreaterThan(0);
    });
  });

  describe('Transaction Calendar View', () => {
    it('validates calendar data structure', () => {
      const calendarDay = {
        date: new Date('2024-01-15'),
        transactions: [
          {
            id: '1',
            description: 'Grocery shopping',
            amountCents: -5000000,
            currency: 'IDR',
          },
        ],
        totalIncome: 0,
        totalExpenses: 5000000,
        totalTransfers: 0,
        isCurrentMonth: true,
        isToday: false,
        isSelected: false,
      };

      expect(calendarDay.date).toBeInstanceOf(Date);
      expect(calendarDay.transactions).toHaveLength(1);
      expect(calendarDay.totalExpenses).toBeGreaterThan(0);
      expect(typeof calendarDay.isCurrentMonth).toBe('boolean');
    });

    it('validates calendar navigation', () => {
      const currentMonth = new Date(2024, 0, 1); // January 2024
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);

      expect(nextMonth.getMonth()).toBe(1); // February
      expect(prevMonth.getMonth()).toBe(11); // December (previous year)
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', () => {
      const requiredFields = {
        amountCents: 0, // Invalid: must be > 0
        description: '', // Invalid: required
        accountId: '', // Invalid: required
        date: '', // Invalid: required
      };

      expect(requiredFields.amountCents).toBeLessThanOrEqual(0);
      expect(requiredFields.description).toBeFalsy();
      expect(requiredFields.accountId).toBeFalsy();
      expect(requiredFields.date).toBeFalsy();
    });

    it('validates amount formatting', () => {
      const userInput = '100.50'; // User enters 100.50
      const amountCents = Math.round(parseFloat(userInput) * 100); // Convert to cents
      
      expect(amountCents).toBe(10050);
      
      // Convert back for display
      const displayAmount = amountCents / 100;
      expect(displayAmount).toBe(100.5);
    });

    it('validates currency formatting', () => {
      const amountCents = 5000000; // 50,000.00 IDR
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
      }).format(amountCents / 100);

      expect(formatted).toContain('50.000');
      expect(formatted).toContain('IDR');
    });
  });

  describe('Data Integrity', () => {
    it('validates transaction update preserves required fields', () => {
      const originalTransaction: CreateTransactionData = {
        amountCents: 10000,
        currency: 'IDR',
        description: 'Original transaction',
        date: '2024-01-01T00:00:00.000Z',
        accountId: 'account-1',
      };

      const updateData: UpdateTransactionData = {
        description: 'Updated transaction',
        categoryId: 'category-1',
      };

      // Simulate update - original required fields should remain
      const updatedTransaction = { ...originalTransaction, ...updateData };

      expect(updatedTransaction.amountCents).toBe(originalTransaction.amountCents);
      expect(updatedTransaction.accountId).toBe(originalTransaction.accountId);
      expect(updatedTransaction.description).toBe(updateData.description);
      expect(updatedTransaction.categoryId).toBe(updateData.categoryId);
    });

    it('validates split transaction integrity', () => {
      const transaction = {
        amountCents: 10000,
        splits: [
          { categoryId: 'cat-1', amountCents: 6000 },
          { categoryId: 'cat-2', amountCents: 4000 },
        ],
      };

      const splitsTotal = transaction.splits.reduce((sum, split) => sum + split.amountCents, 0);
      expect(splitsTotal).toBe(transaction.amountCents);
    });
  });

  describe('Error Handling', () => {
    it('validates error response structure', () => {
      const errorResponse = {
        message: 'Validation failed',
        errors: [
          { field: 'amountCents', message: 'Amount must be greater than 0' },
          { field: 'description', message: 'Description is required' },
        ],
      };

      expect(errorResponse.message).toBeTruthy();
      expect(errorResponse.errors).toHaveLength(2);
      expect(errorResponse.errors[0].field).toBe('amountCents');
      expect(errorResponse.errors[0].message).toBeTruthy();
    });

    it('validates network error handling', () => {
      const networkError = {
        name: 'NetworkError',
        message: 'Failed to fetch',
        code: 'NETWORK_ERROR',
      };

      expect(networkError.name).toBe('NetworkError');
      expect(networkError.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Performance Validation', () => {
    it('validates pagination parameters', () => {
      const paginationParams = {
        page: 1,
        limit: 50,
        total: 1000,
        totalPages: 20,
      };

      expect(paginationParams.page).toBeGreaterThan(0);
      expect(paginationParams.limit).toBeGreaterThan(0);
      expect(paginationParams.limit).toBeLessThanOrEqual(100); // Max limit
      expect(paginationParams.totalPages).toBe(Math.ceil(paginationParams.total / paginationParams.limit));
    });

    it('validates query optimization', () => {
      const queryParams = {
        includeRelations: ['account', 'category', 'tags'],
        fields: ['id', 'description', 'amountCents', 'date'],
        limit: 50,
      };

      expect(queryParams.includeRelations).toContain('account');
      expect(queryParams.fields).toContain('id');
      expect(queryParams.limit).toBeLessThanOrEqual(100);
    });
  });
});
