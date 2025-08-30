import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTransactionRepository } from './recurring-transaction.repository';
import { PrismaService } from '../prisma/prisma.service';
import {
  RecurrenceFrequency,
  RecurringTransactionStatus,
} from './dto/recurring-transaction.dto';

describe('RecurringTransactionRepository', () => {
  let repository: RecurringTransactionRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockHouseholdId = 'household-123';
  const mockUserId = 'user-123';
  const mockRecurringTransactionId = 'recurring-123';

  const mockRecurringTransactionData = {
    householdId: mockHouseholdId,
    name: 'Monthly Rent',
    description: 'Monthly rent payment',
    amountCents: 150000000,
    currency: 'IDR',
    accountId: 'account-123',
    frequency: RecurrenceFrequency.MONTHLY,
    intervalValue: 1,
    startDate: new Date('2024-01-01'),
    nextExecutionDate: new Date('2024-02-01'),
    createdBy: mockUserId,
  };

  const mockRecurringTransaction = {
    id: mockRecurringTransactionId,
    ...mockRecurringTransactionData,
    transferAccountId: null,
    categoryId: 'category-123',
    merchant: 'Landlord',
    endDate: null,
    lastExecutionDate: null,
    executionCount: 0,
    maxExecutions: null,
    status: RecurringTransactionStatus.ACTIVE,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    account: {
      id: 'account-123',
      name: 'Checking Account',
      type: 'ASSET',
      currency: 'IDR',
    },
    transferAccount: null,
    category: {
      id: 'category-123',
      name: 'Housing',
      icon: '🏠',
      color: '#FF6B6B',
    },
  };

  beforeEach(async () => {
    const mockPrisma = {
      recurringTransaction: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        fields: {
          maxExecutions: 'maxExecutions',
        },
      },
      recurringTransactionExecution: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringTransactionRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<RecurringTransactionRepository>(
      RecurringTransactionRepository
    );
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a recurring transaction successfully', async () => {
      prisma.recurringTransaction.create.mockResolvedValue(
        mockRecurringTransaction
      );

      const result = await repository.create(mockRecurringTransactionData);

      expect(prisma.recurringTransaction.create).toHaveBeenCalledWith({
        data: {
          householdId: mockRecurringTransactionData.householdId,
          name: mockRecurringTransactionData.name,
          description: mockRecurringTransactionData.description,
          amountCents: mockRecurringTransactionData.amountCents,
          currency: mockRecurringTransactionData.currency,
          accountId: mockRecurringTransactionData.accountId,
          transferAccountId: undefined,
          categoryId: undefined,
          merchant: undefined,
          frequency: mockRecurringTransactionData.frequency,
          intervalValue: mockRecurringTransactionData.intervalValue,
          startDate: mockRecurringTransactionData.startDate,
          endDate: undefined,
          nextExecutionDate: mockRecurringTransactionData.nextExecutionDate,
          maxExecutions: undefined,
          metadata: {},
          createdBy: mockRecurringTransactionData.createdBy,
        },
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
              icon: true,
              color: true,
            },
          },
        },
      });
      expect(result).toEqual(mockRecurringTransaction);
    });
  });

  describe('findById', () => {
    it('should find recurring transaction by ID', async () => {
      prisma.recurringTransaction.findUnique.mockResolvedValue(
        mockRecurringTransaction
      );

      const result = await repository.findById(mockRecurringTransactionId);

      expect(prisma.recurringTransaction.findUnique).toHaveBeenCalledWith({
        where: { id: mockRecurringTransactionId },
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
              icon: true,
              color: true,
            },
          },
          executions: {
            orderBy: { scheduledDate: 'desc' },
            take: 10,
          },
        },
      });
      expect(result).toEqual(mockRecurringTransaction);
    });

    it('should return null if recurring transaction not found', async () => {
      prisma.recurringTransaction.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByHousehold', () => {
    it('should find recurring transactions by household with pagination', async () => {
      const mockItems = [mockRecurringTransaction];
      const mockTotal = 1;

      prisma.recurringTransaction.findMany.mockResolvedValue(mockItems);
      prisma.recurringTransaction.count.mockResolvedValue(mockTotal);

      const result = await repository.findByHousehold(mockHouseholdId, {
        page: 1,
        limit: 20,
      });

      expect(prisma.recurringTransaction.findMany).toHaveBeenCalledWith({
        where: { householdId: mockHouseholdId },
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
              icon: true,
              color: true,
            },
          },
        },
        orderBy: { nextExecutionDate: 'asc' },
        skip: 0,
        take: 20,
      });
      expect(prisma.recurringTransaction.count).toHaveBeenCalledWith({
        where: { householdId: mockHouseholdId },
      });
      expect(result).toEqual({
        items: mockItems,
        total: mockTotal,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should apply filters when finding by household', async () => {
      const filters = {
        status: RecurringTransactionStatus.ACTIVE,
        accountId: 'account-123',
        frequency: RecurrenceFrequency.MONTHLY,
      };

      prisma.recurringTransaction.findMany.mockResolvedValue([]);
      prisma.recurringTransaction.count.mockResolvedValue(0);

      await repository.findByHousehold(mockHouseholdId, filters);

      expect(prisma.recurringTransaction.findMany).toHaveBeenCalledWith({
        where: {
          householdId: mockHouseholdId,
          status: RecurringTransactionStatus.ACTIVE,
          accountId: 'account-123',
          frequency: RecurrenceFrequency.MONTHLY,
        },
        include: expect.any(Object),
        orderBy: { nextExecutionDate: 'asc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findDueForExecution', () => {
    it('should find recurring transactions due for execution', async () => {
      const mockDate = new Date('2024-02-01');
      const dueTransactions = [mockRecurringTransaction];

      prisma.recurringTransaction.findMany.mockResolvedValue(dueTransactions);

      const result = await repository.findDueForExecution(mockDate);

      expect(prisma.recurringTransaction.findMany).toHaveBeenCalledWith({
        where: {
          status: RecurringTransactionStatus.ACTIVE,
          nextExecutionDate: {
            lte: mockDate,
          },
          OR: [{ endDate: null }, { endDate: { gte: mockDate } }],
          AND: [
            {
              OR: [
                { maxExecutions: null },
                {
                  executionCount: {
                    lt: prisma.recurringTransaction.fields.maxExecutions,
                  },
                },
              ],
            },
          ],
        },
        include: {
          account: true,
          transferAccount: true,
          category: true,
          household: true,
        },
      });
      expect(result).toEqual(dueTransactions);
    });
  });

  describe('update', () => {
    it('should update recurring transaction', async () => {
      const updateData = {
        name: 'Updated Monthly Rent',
        amountCents: 160000000,
      };

      const updatedTransaction = {
        ...mockRecurringTransaction,
        ...updateData,
      };

      prisma.recurringTransaction.update.mockResolvedValue(updatedTransaction);

      const result = await repository.update(
        mockRecurringTransactionId,
        updateData
      );

      expect(prisma.recurringTransaction.update).toHaveBeenCalledWith({
        where: { id: mockRecurringTransactionId },
        data: {
          ...updateData,
          updatedAt: expect.any(Date),
        },
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
              icon: true,
              color: true,
            },
          },
        },
      });
      expect(result).toEqual(updatedTransaction);
    });
  });

  describe('delete', () => {
    it('should delete recurring transaction', async () => {
      prisma.recurringTransaction.delete.mockResolvedValue(
        mockRecurringTransaction
      );

      const result = await repository.delete(mockRecurringTransactionId);

      expect(prisma.recurringTransaction.delete).toHaveBeenCalledWith({
        where: { id: mockRecurringTransactionId },
      });
      expect(result).toEqual(mockRecurringTransaction);
    });
  });

  describe('incrementExecutionCount', () => {
    it('should increment execution count and update next execution date', async () => {
      const nextExecutionDate = new Date('2024-03-01');
      const updatedTransaction = {
        ...mockRecurringTransaction,
        executionCount: 1,
        lastExecutionDate: expect.any(Date),
        nextExecutionDate,
      };

      prisma.recurringTransaction.update.mockResolvedValue(updatedTransaction);

      const result = await repository.incrementExecutionCount(
        mockRecurringTransactionId,
        nextExecutionDate
      );

      expect(prisma.recurringTransaction.update).toHaveBeenCalledWith({
        where: { id: mockRecurringTransactionId },
        data: {
          executionCount: { increment: 1 },
          lastExecutionDate: expect.any(Date),
          nextExecutionDate,
        },
      });
      expect(result).toEqual(updatedTransaction);
    });
  });

  describe('updateStatus', () => {
    it('should update recurring transaction status', async () => {
      const newStatus = RecurringTransactionStatus.PAUSED;
      const updatedTransaction = {
        ...mockRecurringTransaction,
        status: newStatus,
      };

      prisma.recurringTransaction.update.mockResolvedValue(updatedTransaction);

      const result = await repository.updateStatus(
        mockRecurringTransactionId,
        newStatus
      );

      expect(prisma.recurringTransaction.update).toHaveBeenCalledWith({
        where: { id: mockRecurringTransactionId },
        data: { status: newStatus },
      });
      expect(result).toEqual(updatedTransaction);
    });
  });

  describe('execution tracking', () => {
    const mockExecution = {
      id: 'execution-123',
      recurringTransactionId: mockRecurringTransactionId,
      scheduledDate: new Date('2024-02-01'),
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('createExecution', () => {
      it('should create execution record', async () => {
        prisma.recurringTransactionExecution.create.mockResolvedValue(
          mockExecution
        );

        const result = await repository.createExecution({
          recurringTransactionId: mockRecurringTransactionId,
          scheduledDate: new Date('2024-02-01'),
        });

        expect(
          prisma.recurringTransactionExecution.create
        ).toHaveBeenCalledWith({
          data: {
            recurringTransactionId: mockRecurringTransactionId,
            scheduledDate: new Date('2024-02-01'),
            status: 'PENDING',
          },
        });
        expect(result).toEqual(mockExecution);
      });
    });

    describe('updateExecution', () => {
      it('should update execution record', async () => {
        const updateData = {
          status: 'COMPLETED',
          transactionId: 'transaction-123',
          executedDate: new Date(),
        };

        const updatedExecution = {
          ...mockExecution,
          ...updateData,
        };

        prisma.recurringTransactionExecution.update.mockResolvedValue(
          updatedExecution
        );

        const result = await repository.updateExecution(
          'execution-123',
          updateData
        );

        expect(
          prisma.recurringTransactionExecution.update
        ).toHaveBeenCalledWith({
          where: { id: 'execution-123' },
          data: {
            ...updateData,
            updatedAt: expect.any(Date),
          },
        });
        expect(result).toEqual(updatedExecution);
      });
    });

    describe('findExecutionsByRecurringTransaction', () => {
      it('should find executions by recurring transaction ID', async () => {
        const executions = [mockExecution];
        prisma.recurringTransactionExecution.findMany.mockResolvedValue(
          executions
        );

        const result = await repository.findExecutionsByRecurringTransaction(
          mockRecurringTransactionId
        );

        expect(
          prisma.recurringTransactionExecution.findMany
        ).toHaveBeenCalledWith({
          where: { recurringTransactionId: mockRecurringTransactionId },
          include: {
            transaction: {
              select: {
                id: true,
                description: true,
                amountCents: true,
                currency: true,
                date: true,
              },
            },
          },
          orderBy: { scheduledDate: 'desc' },
          take: 50,
        });
        expect(result).toEqual(executions);
      });
    });

    describe('findPendingExecutions', () => {
      it('should find pending executions', async () => {
        const pendingExecutions = [mockExecution];
        prisma.recurringTransactionExecution.findMany.mockResolvedValue(
          pendingExecutions
        );

        const result = await repository.findPendingExecutions();

        expect(
          prisma.recurringTransactionExecution.findMany
        ).toHaveBeenCalledWith({
          where: {
            status: 'PENDING',
            scheduledDate: {
              lte: expect.any(Date),
            },
          },
          include: {
            recurringTransaction: {
              include: {
                account: true,
                transferAccount: true,
                category: true,
                household: true,
              },
            },
          },
          orderBy: { scheduledDate: 'asc' },
          take: 100,
        });
        expect(result).toEqual(pendingExecutions);
      });
    });

    describe('findFailedExecutions', () => {
      it('should find failed executions within retry limit', async () => {
        const failedExecutions = [
          {
            ...mockExecution,
            status: 'FAILED',
            retryCount: 1,
          },
        ];
        prisma.recurringTransactionExecution.findMany.mockResolvedValue(
          failedExecutions
        );

        const result = await repository.findFailedExecutions(3);

        expect(
          prisma.recurringTransactionExecution.findMany
        ).toHaveBeenCalledWith({
          where: {
            status: 'FAILED',
            retryCount: {
              lt: 3,
            },
          },
          include: {
            recurringTransaction: {
              include: {
                account: true,
                transferAccount: true,
                category: true,
                household: true,
              },
            },
          },
          orderBy: { updatedAt: 'asc' },
        });
        expect(result).toEqual(failedExecutions);
      });
    });
  });
});
