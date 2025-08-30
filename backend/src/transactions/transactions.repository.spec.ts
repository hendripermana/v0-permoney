import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsRepository } from './transactions.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, TransactionFiltersDto } from './dto';
import { AccountType } from '@prisma/client';

describe('TransactionsRepository', () => {
  let repository: TransactionsRepository;
  let prisma: jest.Mocked<PrismaService>;

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
  };

  const mockAccount = {
    id: 'account-1',
    type: AccountType.ASSET,
    currency: 'IDR',
  };

  const mockTransactionWithDetails = {
    ...mockTransaction,
    account: {
      id: 'account-1',
      name: 'Test Account',
      type: AccountType.ASSET,
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

  beforeEach(async () => {
    const mockPrisma = {
      $transaction: jest.fn(),
      transaction: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      account: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      ledgerEntry: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      transactionTag: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      transactionSplit: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<TransactionsRepository>(TransactionsRepository);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
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

    it('should create a transaction with ledger entries', async () => {
      const mockTx = {
        account: {
          findFirst: jest.fn().mockResolvedValue(mockAccount),
        },
        transaction: {
          create: jest.fn().mockResolvedValue(mockTransaction),
        },
        ledgerEntry: {
          create: jest.fn(),
          createMany: jest.fn(),
        },
        transactionTag: {
          createMany: jest.fn(),
        },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      // Mock the findById call that happens at the end
      jest.spyOn(repository, 'findById').mockResolvedValue(mockTransactionWithDetails);

      const result = await repository.create('household-1', createDto, 'user-1');

      expect(mockTx.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'account-1', householdId: 'household-1' },
        select: { id: true, type: true, currency: true },
      });

      expect(mockTx.transaction.create).toHaveBeenCalledWith({
        data: {
          householdId: 'household-1',
          amountCents: BigInt(10000),
          currency: 'IDR',
          originalAmountCents: null,
          originalCurrency: undefined,
          exchangeRate: undefined,
          description: 'Test transaction',
          categoryId: 'category-1',
          merchant: 'Test Merchant',
          merchantId: undefined,
          date: new Date('2024-01-01'),
          accountId: 'account-1',
          transferAccountId: undefined,
          receiptUrl: undefined,
          metadata: {},
          createdBy: 'user-1',
        },
      });

      expect(mockTx.transactionTag.createMany).toHaveBeenCalledWith({
        data: [{ transactionId: 'transaction-1', tag: 'test' }],
      });

      expect(result).toEqual(mockTransactionWithDetails);
    });

    it('should throw error if account not found', async () => {
      const mockTx = {
        account: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      await expect(
        repository.create('household-1', createDto, 'user-1')
      ).rejects.toThrow('Account account-1 not found or doesn\'t belong to household');
    });

    it('should create transfer transaction with two ledger entries', async () => {
      const transferDto = {
        ...createDto,
        transferAccountId: 'account-2',
      };

      const mockTransferAccount = {
        id: 'account-2',
        type: AccountType.ASSET,
        currency: 'IDR',
      };

      const mockTx = {
        account: {
          findFirst: jest.fn()
            .mockResolvedValueOnce(mockAccount)
            .mockResolvedValueOnce(mockTransferAccount),
        },
        transaction: {
          create: jest.fn().mockResolvedValue({
            ...mockTransaction,
            transferAccountId: 'account-2',
          }),
        },
        ledgerEntry: {
          createMany: jest.fn(),
        },
        transactionTag: {
          createMany: jest.fn(),
        },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      jest.spyOn(repository, 'findById').mockResolvedValue({
        ...mockTransactionWithDetails,
        transferAccountId: 'account-2',
      });

      const result = await repository.create('household-1', transferDto, 'user-1');

      expect(mockTx.ledgerEntry.createMany).toHaveBeenCalledWith({
        data: [
          {
            transactionId: 'transaction-1',
            accountId: 'account-1',
            type: 'CREDIT',
            amountCents: BigInt(10000),
            currency: 'IDR',
          },
          {
            transactionId: 'transaction-1',
            accountId: 'account-2',
            type: 'DEBIT',
            amountCents: BigInt(10000),
            currency: 'IDR',
          },
        ],
      });
    });

    it('should validate splits total equals transaction amount', async () => {
      const splitsDto = {
        ...createDto,
        splits: [
          { categoryId: 'cat-1', amountCents: 6000, description: 'Split 1' },
          { categoryId: 'cat-2', amountCents: 5000, description: 'Split 2' }, // Total: 11000, but transaction is 10000
        ],
      };

      const mockTx = {
        account: {
          findFirst: jest.fn().mockResolvedValue(mockAccount),
        },
        transaction: {
          create: jest.fn().mockResolvedValue(mockTransaction),
        },
        ledgerEntry: {
          create: jest.fn(),
        },
        transactionTag: {
          createMany: jest.fn(),
        },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      await expect(
        repository.create('household-1', splitsDto, 'user-1')
      ).rejects.toThrow('Splits total (11000) must equal transaction amount (10000)');
    });
  });

  describe('findById', () => {
    it('should return transaction with details', async () => {
      prisma.transaction.findUnique.mockResolvedValue(mockTransactionWithDetails);

      const result = await repository.findById('transaction-1');

      expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'transaction-1' },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
            },
          },
          transferAccount: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
          tags: {
            select: {
              tag: true,
            },
          },
          splits: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  icon: true,
                },
              },
            },
          },
          ledgerEntries: true,
        },
      });

      expect(result).toEqual(mockTransactionWithDetails);
    });

    it('should throw error if transaction not found', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);

      await expect(repository.findById('transaction-1')).rejects.toThrow(
        'Transaction transaction-1 not found'
      );
    });
  });

  describe('findMany', () => {
    it('should return paginated transactions', async () => {
      const filters: TransactionFiltersDto = {
        page: 1,
        limit: 50,
        sortBy: 'date',
        sortOrder: 'desc',
      };

      prisma.transaction.findMany.mockResolvedValue([mockTransactionWithDetails]);
      prisma.transaction.count.mockResolvedValue(1);

      const result = await repository.findMany('household-1', filters);

      expect(result).toEqual({
        transactions: [mockTransactionWithDetails],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const filters: TransactionFiltersDto = {
        accountId: 'account-1',
        categoryId: 'category-1',
        type: 'EXPENSE',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        minAmount: 1000,
        maxAmount: 50000,
        currency: 'IDR',
        merchant: 'Test',
        tags: ['test'],
        includeTransfers: false,
      };

      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      await repository.findMany('household-1', filters);

      const expectedWhere = {
        householdId: 'household-1',
        OR: [
          { accountId: 'account-1' },
          { transferAccountId: 'account-1' },
        ],
        categoryId: 'category-1',
        amountCents: { gte: 1000, lte: 50000, gt: 0 },
        date: {
          gte: new Date('2024-01-01'),
          lte: new Date('2024-01-31'),
        },
        currency: 'IDR',
        merchant: { contains: 'Test', mode: 'insensitive' },
        tags: {
          some: {
            tag: { in: ['test'] },
          },
        },
        transferAccountId: null,
      };

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        })
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      description: 'Updated transaction',
      amountCents: 15000,
    };

    it('should update transaction and regenerate ledger entries', async () => {
      const existingTransaction = {
        ...mockTransaction,
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

      const updatedTransaction = {
        ...mockTransaction,
        ...updateDto,
        amountCents: BigInt(15000),
      };

      const mockTx = {
        transaction: {
          findFirst: jest.fn().mockResolvedValue(existingTransaction),
          update: jest.fn().mockResolvedValue(updatedTransaction),
        },
        ledgerEntry: {
          deleteMany: jest.fn(),
          create: jest.fn(),
        },
        account: {
          findUnique: jest.fn().mockResolvedValue(mockAccount),
        },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      jest.spyOn(repository, 'findById').mockResolvedValue({
        ...mockTransactionWithDetails,
        ...updateDto,
        amountCents: BigInt(15000),
      });

      const result = await repository.update('transaction-1', 'household-1', updateDto);

      expect(mockTx.ledgerEntry.deleteMany).toHaveBeenCalledWith({
        where: { transactionId: 'transaction-1' },
      });

      expect(mockTx.transaction.update).toHaveBeenCalledWith({
        where: { id: 'transaction-1' },
        data: expect.objectContaining({
          description: 'Updated transaction',
          amountCents: BigInt(15000),
        }),
      });
    });

    it('should throw error if transaction not found', async () => {
      const mockTx = {
        transaction: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      await expect(
        repository.update('transaction-1', 'household-1', updateDto)
      ).rejects.toThrow('Transaction transaction-1 not found or doesn\'t belong to household');
    });
  });

  describe('delete', () => {
    it('should delete transaction and related records', async () => {
      const mockTx = {
        transaction: {
          findFirst: jest.fn().mockResolvedValue(mockTransaction),
          delete: jest.fn(),
        },
        ledgerEntry: {
          deleteMany: jest.fn(),
        },
        transactionTag: {
          deleteMany: jest.fn(),
        },
        transactionSplit: {
          deleteMany: jest.fn(),
        },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      await repository.delete('transaction-1', 'household-1');

      expect(mockTx.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: 'transaction-1', householdId: 'household-1' },
      });

      expect(mockTx.ledgerEntry.deleteMany).toHaveBeenCalledWith({
        where: { transactionId: 'transaction-1' },
      });

      expect(mockTx.transaction.delete).toHaveBeenCalledWith({
        where: { id: 'transaction-1' },
      });
    });

    it('should throw error if transaction not found', async () => {
      const mockTx = {
        transaction: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      await expect(
        repository.delete('transaction-1', 'household-1')
      ).rejects.toThrow('Transaction transaction-1 not found or doesn\'t belong to household');
    });
  });

  describe('validateAccountingEquation', () => {
    it('should validate transfer transaction accounting', async () => {
      const transferTransaction = {
        ...mockTransaction,
        transferAccountId: 'account-2',
        ledgerEntries: [
          {
            id: 'ledger-1',
            transactionId: 'transaction-1',
            accountId: 'account-1',
            type: 'CREDIT' as const,
            amountCents: BigInt(10000),
            currency: 'IDR',
            createdAt: new Date(),
          },
          {
            id: 'ledger-2',
            transactionId: 'transaction-1',
            accountId: 'account-2',
            type: 'DEBIT' as const,
            amountCents: BigInt(10000),
            currency: 'IDR',
            createdAt: new Date(),
          },
        ],
      };

      prisma.transaction.findUnique.mockResolvedValue(transferTransaction);

      const result = await repository.validateAccountingEquation('transaction-1');

      expect(result.isValid).toBe(true);
      expect(result.totalDebits).toBe(BigInt(10000));
      expect(result.totalCredits).toBe(BigInt(10000));
      expect(result.errors).toEqual([]);
    });

    it('should validate non-transfer transaction accounting', async () => {
      const nonTransferTransaction = {
        ...mockTransaction,
        transferAccountId: null,
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

      prisma.transaction.findUnique.mockResolvedValue(nonTransferTransaction);

      const result = await repository.validateAccountingEquation('transaction-1');

      expect(result.isValid).toBe(true);
      expect(result.totalDebits).toBe(BigInt(10000));
      expect(result.totalCredits).toBe(BigInt(0));
      expect(result.errors).toEqual([]);
    });

    it('should return invalid for unbalanced transfer transaction', async () => {
      const unbalancedTransaction = {
        ...mockTransaction,
        transferAccountId: 'account-2',
        ledgerEntries: [
          {
            id: 'ledger-1',
            transactionId: 'transaction-1',
            accountId: 'account-1',
            type: 'CREDIT' as const,
            amountCents: BigInt(10000),
            currency: 'IDR',
            createdAt: new Date(),
          },
          {
            id: 'ledger-2',
            transactionId: 'transaction-1',
            accountId: 'account-2',
            type: 'DEBIT' as const,
            amountCents: BigInt(5000), // Unbalanced
            currency: 'IDR',
            createdAt: new Date(),
          },
        ],
      };

      prisma.transaction.findUnique.mockResolvedValue(unbalancedTransaction);

      const result = await repository.validateAccountingEquation('transaction-1');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Transfer transaction: Debits (5000) do not equal Credits (10000)');
    });

    it('should return invalid for transaction not found', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);

      const result = await repository.validateAccountingEquation('transaction-1');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Transaction not found');
    });
  });
});
