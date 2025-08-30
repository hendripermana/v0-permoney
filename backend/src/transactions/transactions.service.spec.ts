import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsRepository } from './transactions.repository';
import { CreateTransactionDto, UpdateTransactionDto, TransactionFiltersDto } from './dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: jest.Mocked<TransactionsRepository>;

  const mockTransaction = {
    id: 'transaction-1',
    householdId: 'household-1',
    amountCents: BigInt(10000),
    currency: 'IDR',
    originalAmountCents: null,
    originalCurrency: null,
    exchangeRate: null,
    description: 'Test transaction',
    categoryId: 'category-1',
    merchant: 'Test Merchant',
    merchantId: null,
    date: new Date('2024-01-01'),
    accountId: 'account-1',
    transferAccountId: null,
    receiptUrl: null,
    metadata: {},
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    account: {
      id: 'account-1',
      name: 'Test Account',
      type: 'ASSET' as const,
      currency: 'IDR',
    },
    transferAccount: null,
    category: {
      id: 'category-1',
      name: 'Test Category',
      color: '#000000',
      icon: '🛒',
    },
    tags: [{ tag: 'test' }],
    splits: [],
    ledgerEntries: [
      {
        id: 'ledger-1',
        transactionId: 'transaction-1',
        accountId: 'account-1',
        type: 'DEBIT' as const,
        amountCents: BigInt(10000),
        currency: 'IDR',
        createdAt: new Date(),
      },
    ],
  };

  const mockValidation = {
    isValid: true,
    totalDebits: BigInt(10000),
    totalCredits: BigInt(0),
    errors: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      validateAccountingEquation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    repository = module.get(TransactionsRepository);
  });

  describe('createTransaction', () => {
    const createDto: CreateTransactionDto = {
      amountCents: 10000,
      currency: 'IDR',
      description: 'Test transaction',
      categoryId: 'category-1',
      merchant: 'Test Merchant',
      date: '2024-01-01',
      accountId: 'account-1',
      tags: ['test'],
    };

    it('should create a transaction successfully', async () => {
      repository.create.mockResolvedValue(mockTransaction);
      repository.validateAccountingEquation.mockResolvedValue(mockValidation);

      const result = await service.createTransaction('household-1', createDto, 'user-1');

      expect(repository.create).toHaveBeenCalledWith('household-1', createDto, 'user-1');
      expect(repository.validateAccountingEquation).toHaveBeenCalledWith('transaction-1');
      expect(result).toEqual(mockTransaction);
    });

    it('should throw BadRequestException for invalid amount', async () => {
      const invalidDto = { ...createDto, amountCents: 0 };

      await expect(
        service.createTransaction('household-1', invalidDto, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid currency', async () => {
      const invalidDto = { ...createDto, currency: 'INVALID' };

      await expect(
        service.createTransaction('household-1', invalidDto, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid splits', async () => {
      const invalidDto = {
        ...createDto,
        splits: [
          { categoryId: 'cat-1', amountCents: 5000, description: 'Split 1' },
          { categoryId: 'cat-2', amountCents: 3000, description: 'Split 2' },
        ],
      };

      await expect(
        service.createTransaction('household-1', invalidDto, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for same account transfer', async () => {
      const invalidDto = {
        ...createDto,
        transferAccountId: 'account-1', // Same as accountId
      };

      await expect(
        service.createTransaction('household-1', invalidDto, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if accounting equation is invalid', async () => {
      const invalidValidation = {
        isValid: false,
        totalDebits: BigInt(10000),
        totalCredits: BigInt(5000),
        errors: ['Debits do not equal Credits'],
      };

      repository.create.mockResolvedValue(mockTransaction);
      repository.validateAccountingEquation.mockResolvedValue(invalidValidation);

      await expect(
        service.createTransaction('household-1', createDto, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction successfully', async () => {
      repository.findById.mockResolvedValue(mockTransaction);

      const result = await service.getTransactionById('transaction-1', 'household-1');

      expect(repository.findById).toHaveBeenCalledWith('transaction-1');
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      repository.findById.mockRejectedValue(new Error('Transaction transaction-1 not found'));

      await expect(
        service.getTransactionById('transaction-1', 'household-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for wrong household', async () => {
      const wrongHouseholdTransaction = { ...mockTransaction, householdId: 'household-2' };
      repository.findById.mockResolvedValue(wrongHouseholdTransaction);

      await expect(
        service.getTransactionById('transaction-1', 'household-1')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const mockPaginatedResult = {
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };

      repository.findMany.mockResolvedValue(mockPaginatedResult);

      const filters: TransactionFiltersDto = { page: 1, limit: 50 };
      const result = await service.getTransactions('household-1', filters);

      expect(repository.findMany).toHaveBeenCalledWith('household-1', filters);
      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('updateTransaction', () => {
    const updateDto: UpdateTransactionDto = {
      description: 'Updated transaction',
      amountCents: 15000,
    };

    it('should update transaction successfully', async () => {
      const updatedTransaction = { ...mockTransaction, ...updateDto };
      
      repository.findById.mockResolvedValue(mockTransaction);
      repository.update.mockResolvedValue(updatedTransaction);
      repository.validateAccountingEquation.mockResolvedValue(mockValidation);

      const result = await service.updateTransaction('transaction-1', 'household-1', updateDto);

      expect(repository.update).toHaveBeenCalledWith('transaction-1', 'household-1', updateDto);
      expect(repository.validateAccountingEquation).toHaveBeenCalledWith('transaction-1');
      expect(result).toEqual(updatedTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      repository.findById.mockRejectedValue(new Error('Transaction transaction-1 not found'));

      await expect(
        service.updateTransaction('transaction-1', 'household-1', updateDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      repository.findById.mockResolvedValue(mockTransaction);
      repository.delete.mockResolvedValue(undefined);

      await service.deleteTransaction('transaction-1', 'household-1');

      expect(repository.delete).toHaveBeenCalledWith('transaction-1', 'household-1');
    });

    it('should throw NotFoundException when transaction not found', async () => {
      repository.findById.mockRejectedValue(new Error('Transaction transaction-1 not found'));

      await expect(
        service.deleteTransaction('transaction-1', 'household-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTransactionSplits', () => {
    const splits = [
      { categoryId: 'cat-1', amountCents: 6000, description: 'Split 1' },
      { categoryId: 'cat-2', amountCents: 4000, description: 'Split 2' },
    ];

    it('should update splits successfully', async () => {
      const updatedTransaction = { ...mockTransaction, splits };
      
      repository.findById.mockResolvedValue(mockTransaction);
      repository.update.mockResolvedValue(updatedTransaction);
      repository.validateAccountingEquation.mockResolvedValue(mockValidation);

      const result = await service.updateTransactionSplits('transaction-1', 'household-1', splits);

      expect(repository.update).toHaveBeenCalledWith('transaction-1', 'household-1', { splits });
      expect(result).toEqual(updatedTransaction);
    });

    it('should throw BadRequestException for invalid splits total', async () => {
      const invalidSplits = [
        { categoryId: 'cat-1', amountCents: 6000, description: 'Split 1' },
        { categoryId: 'cat-2', amountCents: 5000, description: 'Split 2' }, // Total: 11000, but transaction is 10000
      ];

      repository.findById.mockResolvedValue(mockTransaction);

      await expect(
        service.updateTransactionSplits('transaction-1', 'household-1', invalidSplits)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('categorizeTransaction', () => {
    it('should categorize transaction successfully', async () => {
      const categorizedTransaction = { ...mockTransaction, categoryId: 'new-category' };
      
      repository.findById.mockResolvedValue(mockTransaction);
      repository.update.mockResolvedValue(categorizedTransaction);
      repository.validateAccountingEquation.mockResolvedValue(mockValidation);

      const result = await service.categorizeTransaction('transaction-1', 'household-1', 'new-category');

      expect(repository.update).toHaveBeenCalledWith('transaction-1', 'household-1', { categoryId: 'new-category' });
      expect(result).toEqual(categorizedTransaction);
    });
  });

  describe('addTransactionTags', () => {
    it('should add tags successfully', async () => {
      const newTags = ['new-tag', 'another-tag'];
      const expectedTags = ['test', 'new-tag', 'another-tag'];
      const taggedTransaction = { 
        ...mockTransaction, 
        tags: expectedTags.map(tag => ({ tag }))
      };
      
      repository.findById.mockResolvedValue(mockTransaction);
      repository.update.mockResolvedValue(taggedTransaction);
      repository.validateAccountingEquation.mockResolvedValue(mockValidation);

      const result = await service.addTransactionTags('transaction-1', 'household-1', newTags);

      expect(repository.update).toHaveBeenCalledWith('transaction-1', 'household-1', { tags: expectedTags });
      expect(result).toEqual(taggedTransaction);
    });

    it('should not duplicate existing tags', async () => {
      const newTags = ['test', 'new-tag']; // 'test' already exists
      const expectedTags = ['test', 'new-tag'];
      const taggedTransaction = { 
        ...mockTransaction, 
        tags: expectedTags.map(tag => ({ tag }))
      };
      
      repository.findById.mockResolvedValue(mockTransaction);
      repository.update.mockResolvedValue(taggedTransaction);
      repository.validateAccountingEquation.mockResolvedValue(mockValidation);

      const result = await service.addTransactionTags('transaction-1', 'household-1', newTags);

      expect(repository.update).toHaveBeenCalledWith('transaction-1', 'household-1', { tags: expectedTags });
      expect(result).toEqual(taggedTransaction);
    });
  });

  describe('removeTransactionTags', () => {
    it('should remove tags successfully', async () => {
      const tagsToRemove = ['test'];
      const expectedTags: string[] = [];
      const untaggedTransaction = { 
        ...mockTransaction, 
        tags: expectedTags.map(tag => ({ tag }))
      };
      
      repository.findById.mockResolvedValue(mockTransaction);
      repository.update.mockResolvedValue(untaggedTransaction);
      repository.validateAccountingEquation.mockResolvedValue(mockValidation);

      const result = await service.removeTransactionTags('transaction-1', 'household-1', tagsToRemove);

      expect(repository.update).toHaveBeenCalledWith('transaction-1', 'household-1', { tags: expectedTags });
      expect(result).toEqual(untaggedTransaction);
    });
  });

  describe('validateTransactionAccounting', () => {
    it('should return validation result', async () => {
      repository.findById.mockResolvedValue(mockTransaction);
      repository.validateAccountingEquation.mockResolvedValue(mockValidation);

      const result = await service.validateTransactionAccounting('transaction-1', 'household-1');

      expect(repository.validateAccountingEquation).toHaveBeenCalledWith('transaction-1');
      expect(result).toEqual(mockValidation);
    });
  });

  describe('getTransactionStats', () => {
    it('should return transaction statistics', async () => {
      const mockTransactions = [
        { ...mockTransaction, amountCents: BigInt(10000), transferAccountId: null },
        { ...mockTransaction, id: 'transaction-2', amountCents: BigInt(-5000), transferAccountId: null },
        { ...mockTransaction, id: 'transaction-3', amountCents: BigInt(3000), transferAccountId: 'account-2' },
      ];

      repository.findMany.mockResolvedValue({
        transactions: mockTransactions,
        total: 3,
        page: 1,
        limit: 10000,
        totalPages: 1,
      });

      const result = await service.getTransactionStats('household-1');

      expect(result.totalTransactions).toBe(3);
      expect(result.totalIncome).toBe(BigInt(10000));
      expect(result.totalExpenses).toBe(BigInt(5000));
      expect(result.totalTransfers).toBe(1);
      expect(result.categoriesUsed).toBe(1);
      expect(result.merchantsUsed).toBe(1);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should return category breakdown', async () => {
      const mockTransactions = [
        { 
          ...mockTransaction, 
          amountCents: BigInt(10000), 
          categoryId: 'category-1',
          category: { id: 'category-1', name: 'Food', color: '#ff0000', icon: '🍔' },
          transferAccountId: null 
        },
        { 
          ...mockTransaction, 
          id: 'transaction-2',
          amountCents: BigInt(5000), 
          categoryId: 'category-1',
          category: { id: 'category-1', name: 'Food', color: '#ff0000', icon: '🍔' },
          transferAccountId: null 
        },
      ];

      repository.findMany.mockResolvedValue({
        transactions: mockTransactions,
        total: 2,
        page: 1,
        limit: 10000,
        totalPages: 1,
      });

      const result = await service.getCategoryBreakdown('household-1');

      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBe('category-1');
      expect(result[0].categoryName).toBe('Food');
      expect(result[0].totalAmount).toBe(BigInt(15000));
      expect(result[0].transactionCount).toBe(2);
      expect(result[0].percentage).toBe(100);
    });
  });
});
