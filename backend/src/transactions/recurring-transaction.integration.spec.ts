import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTransactionService } from './recurring-transaction.service';
import { RecurringTransactionRepository } from './recurring-transaction.repository';
import { TransactionsService } from './transactions.service';
import { HouseholdPermissionsService } from '../household/services/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  RecurrenceFrequency,
  RecurringTransactionStatus,
  CreateRecurringTransactionDto,
} from './dto/recurring-transaction.dto';

describe('RecurringTransactionService Integration', () => {
  let service: RecurringTransactionService;
  let repository: RecurringTransactionRepository;
  let prisma: PrismaService;

  const mockUserId = 'user-123';
  const mockHouseholdId = 'household-123';

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

    const mockTransactionsService = {
      create: jest.fn(),
    };

    const mockPermissionsService = {
      checkPermission: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringTransactionService,
        RecurringTransactionRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: HouseholdPermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    service = module.get<RecurringTransactionService>(
      RecurringTransactionService
    );
    repository = module.get<RecurringTransactionRepository>(
      RecurringTransactionRepository
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('calculateNextExecutionDate', () => {
    it('should calculate next execution date correctly for different frequencies', () => {
      const baseDate = new Date('2024-01-01');

      // Test daily frequency
      const dailyNext = (service as any).calculateNextExecutionDate(
        baseDate,
        RecurrenceFrequency.DAILY,
        1
      );
      expect(dailyNext).toEqual(new Date('2024-01-02'));

      // Test weekly frequency
      const weeklyNext = (service as any).calculateNextExecutionDate(
        baseDate,
        RecurrenceFrequency.WEEKLY,
        2
      );
      expect(weeklyNext).toEqual(new Date('2024-01-15'));

      // Test monthly frequency
      const monthlyNext = (service as any).calculateNextExecutionDate(
        baseDate,
        RecurrenceFrequency.MONTHLY,
        1
      );
      expect(monthlyNext).toEqual(new Date('2024-02-01'));

      // Test yearly frequency
      const yearlyNext = (service as any).calculateNextExecutionDate(
        baseDate,
        RecurrenceFrequency.YEARLY,
        1
      );
      expect(yearlyNext).toEqual(new Date('2025-01-01'));
    });

    it('should handle custom frequency as days', () => {
      const baseDate = new Date('2024-01-01');
      const customNext = (service as any).calculateNextExecutionDate(
        baseDate,
        RecurrenceFrequency.CUSTOM,
        10
      );
      expect(customNext).toEqual(new Date('2024-01-11'));
    });
  });

  describe('create', () => {
    it('should create recurring transaction with calculated next execution date', async () => {
      const createDto: CreateRecurringTransactionDto = {
        name: 'Monthly Rent',
        description: 'Monthly rent payment',
        amountCents: 150000000,
        currency: 'IDR',
        accountId: 'account-123',
        categoryId: 'category-123',
        frequency: RecurrenceFrequency.MONTHLY,
        intervalValue: 1,
        startDate: '2024-01-01',
      };

      const mockCreatedTransaction = {
        id: 'recurring-123',
        householdId: mockHouseholdId,
        ...createDto,
        startDate: new Date('2024-01-01'),
        nextExecutionDate: new Date('2024-02-01'),
        status: RecurringTransactionStatus.ACTIVE,
        executionCount: 0,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.recurringTransaction.create as jest.Mock).mockResolvedValue(
        mockCreatedTransaction
      );

      const result = await service.create(
        mockHouseholdId,
        mockUserId,
        createDto
      );

      expect(prisma.recurringTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            householdId: mockHouseholdId,
            name: createDto.name,
            frequency: createDto.frequency,
            nextExecutionDate: new Date('2024-02-01'),
            createdBy: mockUserId,
          }),
        })
      );
      expect(result).toEqual(mockCreatedTransaction);
    });
  });

  describe('repository methods', () => {
    it('should create execution record', async () => {
      const executionData = {
        recurringTransactionId: 'recurring-123',
        scheduledDate: new Date('2024-02-01'),
      };

      const mockExecution = {
        id: 'execution-123',
        ...executionData,
        status: 'PENDING',
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (
        prisma.recurringTransactionExecution.create as jest.Mock
      ).mockResolvedValue(mockExecution);

      const result = await repository.createExecution(executionData);

      expect(prisma.recurringTransactionExecution.create).toHaveBeenCalledWith({
        data: {
          recurringTransactionId: executionData.recurringTransactionId,
          scheduledDate: executionData.scheduledDate,
          status: 'PENDING',
        },
      });
      expect(result).toEqual(mockExecution);
    });

    it('should find due recurring transactions', async () => {
      const dueDate = new Date('2024-02-01');
      const mockDueTransactions = [
        {
          id: 'recurring-123',
          name: 'Monthly Rent',
          status: RecurringTransactionStatus.ACTIVE,
          nextExecutionDate: new Date('2024-01-31'),
        },
      ];

      (prisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue(
        mockDueTransactions
      );

      const result = await repository.findDueForExecution(dueDate);

      expect(prisma.recurringTransaction.findMany).toHaveBeenCalledWith({
        where: {
          status: RecurringTransactionStatus.ACTIVE,
          nextExecutionDate: {
            lte: dueDate,
          },
          OR: [{ endDate: null }, { endDate: { gte: dueDate } }],
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
      expect(result).toEqual(mockDueTransactions);
    });
  });
});
