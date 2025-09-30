import { transactionApi } from '../transactions';
import { CreateTransactionData, UpdateTransactionData, TransactionFilters } from '@/types/transaction';

// Mock fetch
global.fetch = jest.fn();
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('transactionApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates transaction successfully', async () => {
      const mockTransaction = {
        id: '1',
        description: 'Test transaction',
        amountCents: 10000,
        currency: 'IDR',
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransaction,
      } as Response);

      const transactionData: CreateTransactionData = {
        amountCents: 10000,
        currency: 'IDR',
        description: 'Test transaction',
        date: '2024-01-01T00:00:00.000Z',
        accountId: 'account-1',
      };

      const result = await transactionApi.create(transactionData);

      expect(mockedFetch).toHaveBeenCalledWith('/api/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      expect(result).toEqual(mockTransaction);
    });

    it('handles create error', async () => {
      const errorMessage = 'Failed to create transaction';
      
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: errorMessage }),
      } as Response);

      const transactionData: CreateTransactionData = {
        amountCents: 10000,
        currency: 'IDR',
        description: 'Test transaction',
        date: '2024-01-01T00:00:00.000Z',
        accountId: 'account-1',
      };

      await expect(transactionApi.create(transactionData)).rejects.toThrow(errorMessage);
    });
  });

  describe('getAll', () => {
    it('fetches transactions with filters', async () => {
      const mockResponse = {
        transactions: [
          {
            id: '1',
            description: 'Test transaction',
            amountCents: 10000,
            currency: 'IDR',
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const filters: TransactionFilters = {
        accountId: 'account-1',
        categoryId: 'category-1',
        page: 1,
        limit: 50,
      };

      const result = await transactionApi.getAll(filters);

      expect(mockedFetch).toHaveBeenCalledWith(
        '/api/v1/transactions?accountId=account-1&categoryId=category-1&page=1&limit=50'
      );

      expect(result).toEqual(mockResponse);
    });

    it('handles empty filters', async () => {
      const mockResponse = {
        transactions: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await transactionApi.getAll({});

      expect(mockedFetch).toHaveBeenCalledWith('/api/v1/transactions?');
      expect(result).toEqual(mockResponse);
    });

    it('handles array filters', async () => {
      const mockResponse = {
        transactions: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const filters: TransactionFilters = {
        tags: ['tag1', 'tag2'],
      };

      const result = await transactionApi.getAll(filters);

      expect(mockedFetch).toHaveBeenCalledWith('/api/v1/transactions?tags=tag1&tags=tag2');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getById', () => {
    it('fetches transaction by ID', async () => {
      const mockTransaction = {
        id: '1',
        description: 'Test transaction',
        amountCents: 10000,
        currency: 'IDR',
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransaction,
      } as Response);

      const result = await transactionApi.getById('1');

      expect(mockedFetch).toHaveBeenCalledWith('/api/v1/transactions/1');
      expect(result).toEqual(mockTransaction);
    });

    it('handles not found error', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Transaction not found' }),
      } as Response);

      await expect(transactionApi.getById('1')).rejects.toThrow('Transaction not found');
    });
  });

  describe('update', () => {
    it('updates transaction successfully', async () => {
      const mockTransaction = {
        id: '1',
        description: 'Updated transaction',
        amountCents: 20000,
        currency: 'IDR',
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransaction,
      } as Response);

      const updateData: UpdateTransactionData = {
        description: 'Updated transaction',
        amountCents: 20000,
      };

      const result = await transactionApi.update('1', updateData);

      expect(mockedFetch).toHaveBeenCalledWith('/api/v1/transactions/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(result).toEqual(mockTransaction);
    });
  });

  describe('delete', () => {
    it('deletes transaction successfully', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      await transactionApi.delete('1');

      expect(mockedFetch).toHaveBeenCalledWith('/api/v1/transactions/1', {
        method: 'DELETE',
      });
    });

    it('handles delete error', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to delete transaction' }),
      } as Response);

      await expect(transactionApi.delete('1')).rejects.toThrow('Failed to delete transaction');
    });
  });

  describe('search', () => {
    it('searches transactions', async () => {
      const mockResponse = {
        transactions: [
          {
            id: '1',
            description: 'Grocery shopping',
            amountCents: 10000,
            currency: 'IDR',
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const searchParams = {
        query: 'grocery',
        page: 1,
        limit: 50,
      };

      const result = await transactionApi.search(searchParams);

      expect(mockedFetch).toHaveBeenCalledWith(
        '/api/v1/transactions/search?query=grocery&page=1&limit=50'
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('categorize', () => {
    it('categorizes transaction successfully', async () => {
      const mockTransaction = {
        id: '1',
        description: 'Test transaction',
        categoryId: 'category-1',
        category: {
          id: 'category-1',
          name: 'Food & Dining',
          color: '#ef4444',
          icon: 'utensils',
        },
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransaction,
      } as Response);

      const result = await transactionApi.categorize('1', 'category-1');

      expect(mockedFetch).toHaveBeenCalledWith('/api/v1/transactions/1/category', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryId: 'category-1' }),
      });

      expect(result).toEqual(mockTransaction);
    });
  });

  describe('updateSplits', () => {
    it('updates transaction splits successfully', async () => {
      const mockTransaction = {
        id: '1',
        description: 'Test transaction',
        splits: [
          {
            id: 'split-1',
            categoryId: 'category-1',
            amountCents: 5000,
            description: 'Split 1',
          },
          {
            id: 'split-2',
            categoryId: 'category-2',
            amountCents: 5000,
            description: 'Split 2',
          },
        ],
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransaction,
      } as Response);

      const splits = [
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
      ];

      const result = await transactionApi.updateSplits('1', splits);

      expect(mockedFetch).toHaveBeenCalledWith('/api/v1/transactions/1/splits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ splits }),
      });

      expect(result).toEqual(mockTransaction);
    });
  });

  describe('getStats', () => {
    it('fetches transaction statistics', async () => {
      const mockStats = {
        totalTransactions: 10,
        totalIncome: 100000,
        totalExpenses: 50000,
        totalTransfers: 2,
        averageTransactionAmount: 15000,
        categoriesUsed: 5,
        merchantsUsed: 8,
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      } as Response);

      const result = await transactionApi.getStats();

      expect(mockedFetch).toHaveBeenCalledWith('/api/v1/transactions/stats?');
      expect(result).toEqual(mockStats);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('fetches category breakdown', async () => {
      const mockBreakdown = [
        {
          categoryId: 'category-1',
          categoryName: 'Food & Dining',
          totalAmount: 50000,
          transactionCount: 5,
          percentage: 50,
        },
        {
          categoryId: 'category-2',
          categoryName: 'Transportation',
          totalAmount: 30000,
          transactionCount: 3,
          percentage: 30,
        },
      ];

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBreakdown,
      } as Response);

      const result = await transactionApi.getCategoryBreakdown();

      expect(mockedFetch).toHaveBeenCalledWith('/api/v1/transactions/category-breakdown?');
      expect(result).toEqual(mockBreakdown);
    });
  });

  describe('getAISuggestions', () => {
    it('returns mock AI suggestions', async () => {
      const result = await transactionApi.getAISuggestions('Restaurant dinner', 'Pizza Hut');

      expect(result).toEqual([
        {
          categoryId: 'food-dining',
          categoryName: 'Food & Dining',
          confidence: 0.85,
          reason: 'Merchant name suggests restaurant/food service',
        },
        {
          categoryId: 'groceries',
          categoryName: 'Groceries',
          confidence: 0.65,
          reason: 'Transaction description contains food-related keywords',
        },
      ]);
    });
  });
});
