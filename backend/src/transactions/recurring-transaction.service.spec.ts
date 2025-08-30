import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RecurringTransactionService } from './recurring-transaction.service';
import { RecurringTransactionRepository } from './recurring-transaction.repository';
import { TransactionsService } from './transactions.service';
import { HouseholdPermissionsService } from '../household/services/permissions.service';
import {
  RecurrenceFrequency,
  RecurringTransactionStatus,
  CreateRecurringTransactionDto,
  UpdateRecurringTransactionDto,
} from './dto/recurring-transaction.dto';

describe('RecurringTransactionService', () => {
  let service: RecurringTransactionService;
  let repository: jest.Mocked<RecurringTransactionRepository>;
  let transactionsService: jest.Mocked<TransactionsService>;
  let permissionsService: jest.Mocked<HouseholdPermissionsService>;

  const mockUserId = 'user-123';
  const mockHouseholdId = 'household-123';
  const mockRecurringTransactionId = 'recurring-123';

  const mockRecurringTransaction = {
    id: mockRecurringTransactionId,
    householdId: mockHouseholdId,
    name: 'Monthly Rent',
    description: 'Monthly rent payment',
    amountCents: 150000000, // 1,500,000 IDR
    currency: 'IDR',
    accountId: 'account-123',
    transferAccountId: null,
    categoryId: 'category-123',
    merchant: 'Landlord',
    frequency: RecurrenceFrequency.MONTHLY,
    intervalValue: 1,
    startDate: new Date('2024-01-01'),
    endDate: null,
    nextExecutionDate: new Date('2024-02-01'),
    lastExecutionDate: null,
    executionCount: 0,
    maxExecutions: null,
    status: RecurringTransactionStatus.ACTIVE,
    metadata: {},
    createdBy: mockUserId,
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
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByHousehold: jest.fn(),
      findDueForExecution: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateStatus: jest.fn(),
      incrementExecutionCount: jest.fn(),
      createExecution: jest.fn(),
      updateExecution: jest.fn(),
      findExecutionsByRecurringTransaction: jest.fn(),
      findPendingExecutions: jest.fn(),
      findFailedExecutions: jest.fn(),
    };

    const mockTransactionsService = {
      create: jest.fn(),
    };

    const mockPermissionsService = {
      checkPermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringTransactionService,
        {
          provide: RecurringTransactionRepository,
          useValue: mockRepository,
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
    repository = module.get(RecurringTransactionRepository);
    transactionsService = module.get(TransactionsService);
    permissionsService = module.get(HouseholdPermissionsService);
  });

  describe('create', () => {
    const createDto: CreateRecurringTransactionDto = {
      name: 'Monthly Rent',
      description: 'Monthly rent payment',
      amountCents: 150000000,
      currency: 'IDR',
      accountId: 'account-123',
      categoryId: 'category-123',
      merchant: 'Landlord',
      frequency: RecurrenceFrequency.MONTHLY,
      intervalValue: 1,
      startDate: '2024-01-01',
    };

    it('should create a recurring transaction successfully', async () => {
      permissionsService.checkPermission.mockResolvedValue(undefined);
      repository.create.mockResolvedValue(mockRecurringTransaction);

      const result = await service.create(
        mockHouseholdId,
        mockUserId,
        createDto
      );

      expect(permissionsService.checkPermission).toHaveBeenCalledWith(
        mockUserId,
        mockHouseholdId,
        'CREATE_TRANSACTIONS'
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          householdId: mockHouseholdId,
          name: createDto.name,
          description: createDto.description,
          amountCents: createDto.amountCents,
          frequency: createDto.frequency,
          createdBy: mockUserId,
        })
      );
      expect(result).toEqual(mockRecurringTransaction);
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      permissionsService.checkPermission.mockResolvedValue(undefined);

      const invalidDto = {
        ...createDto,
        startDate: '2024-01-01',
        endDate: '2023-12-31',
      };

      await expect(
        service.create(mockHouseholdId, mockUserId, invalidDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return recurring transaction if found and user has permission', async () => {
      repository.findById.mockResolvedValue(mockRecurringTransaction);
      permissionsService.checkPermission.mockResolvedValue(undefined);

      const result = await service.findById(
        mockRecurringTransactionId,
        mockUserId
      );

      expect(repository.findById).toHaveBeenCalledWith(
        mockRecurringTransactionId
      );
      expect(permissionsService.checkPermission).toHaveBeenCalledWith(
        mockUserId,
        mockHouseholdId,
        'VIEW_TRANSACTIONS'
      );
      expect(result).toEqual(mockRecurringTransaction);
    });

    it('should throw NotFoundException if recurring transaction not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.findById(mockRecurringTransactionId, mockUserId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateRecurringTransactionDto = {
      name: 'Updated Monthly Rent',
      amountCents: 160000000,
    };

    it('should update recurring transaction successfully', async () => {
      repository.findById.mockResolvedValue(mockRecurringTransaction);
      permissionsService.checkPermission.mockResolvedValue(undefined);
      repository.update.mockResolvedValue({
        ...mockRecurringTransaction,
        ...updateDto,
      });

      const result = await service.update(
        mockRecurringTransactionId,
        mockUserId,
        updateDto
      );

      expect(repository.findById).toHaveBeenCalledWith(
        mockRecurringTransactionId
      );
      expect(permissionsService.checkPermission).toHaveBeenCalledWith(
        mockUserId,
        mockHouseholdId,
        'UPDATE_TRANSACTIONS'
      );
      expect(repository.update).toHaveBeenCalledWith(
        mockRecurringTransactionId,
        expect.objectContaining(updateDto)
      );
      expect(result.name).toBe(updateDto.name);
      expect(result.amountCents).toBe(updateDto.amountCents);
    });

    it('should throw NotFoundException if recurring transaction not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(mockRecurringTransactionId, mockUserId, updateDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('executeRecurringTransaction', () => {
    const mockExecution = {
      id: 'execution-123',
      recurringTransactionId: mockRecurringTransactionId,
      scheduledDate: new Date('2024-02-01'),
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTransaction = {
      id: 'transaction-123',
      description: 'Monthly Rent - Monthly rent payment',
      amountCents: 150000000,
      currency: 'IDR',
      date: new Date('2024-02-01'),
    };

    it('should execute recurring transaction successfully', async () => {
      repository.findById.mockResolvedValue(mockRecurringTransaction);
      repository.createExecution.mockResolvedValue(mockExecution);
      transactionsService.create.mockResolvedValue(mockTransaction);
      repository.updateExecution.mockResolvedValue({
        ...mockExecution,
        status: 'COMPLETED',
        transactionId: mockTransaction.id,
      });
      repository.incrementExecutionCount.mockResolvedValue({
        ...mockRecurringTransaction,
        executionCount: 1,
      });

      const result = await service.executeRecurringTransaction({
        recurringTransactionId: mockRecurringTransactionId,
      });

      expect(repository.findById).toHaveBeenCalledWith(
        mockRecurringTransactionId
      );
      expect(repository.createExecution).toHaveBeenCalled();
      expect(transactionsService.create).toHaveBeenCalledWith(
        mockHouseholdId,
        mockUserId,
        expect.objectContaining({
          description: 'Monthly Rent - Monthly rent payment',
          amountCents: 150000000,
          accountId: 'account-123',
        })
      );
      expect(repository.updateExecution).toHaveBeenCalledWith(
        mockExecution.id,
        expect.objectContaining({
          status: 'COMPLETED',
          transactionId: mockTransaction.id,
        })
      );
      expect(result.transaction).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if recurring transaction not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.executeRecurringTransaction({
          recurringTransactionId: mockRecurringTransactionId,
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if recurring transaction is not active', async () => {
      repository.findById.mockResolvedValue({
        ...mockRecurringTransaction,
        status: RecurringTransactionStatus.PAUSED,
      });

      await expect(
        service.executeRecurringTransaction({
          recurringTransactionId: mockRecurringTransactionId,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle execution failure and update execution record', async () => {
      const error = new Error('Transaction creation failed');

      repository.findById.mockResolvedValue(mockRecurringTransaction);
      repository.createExecution.mockResolvedValue(mockExecution);
      transactionsService.create.mockRejectedValue(error);
      repository.updateExecution.mockResolvedValue({
        ...mockExecution,
        status: 'FAILED',
        errorMessage: error.message,
      });

      await expect(
        service.executeRecurringTransaction({
          recurringTransactionId: mockRecurringTransactionId,
        })
      ).rejects.toThrow(error);

      expect(repository.updateExecution).toHaveBeenCalledWith(
        mockExecution.id,
        expect.objectContaining({
          status: 'FAILED',
          errorMessage: error.message,
        })
      );
    });
  });

  describe('processDueRecurringTransactions', () => {
    it('should process all due recurring transactions', async () => {
      const dueTransactions = [
        mockRecurringTransaction,
        {
          ...mockRecurringTransaction,
          id: 'recurring-456',
          name: 'Weekly Groceries',
        },
      ];

      repository.findDueForExecution.mockResolvedValue(dueTransactions);

      // Mock successful execution for both transactions
      jest.spyOn(service, 'executeRecurringTransaction').mockResolvedValue({
        execution: mockExecution,
        transaction: mockTransaction,
        recurringTransaction: mockRecurringTransaction,
      } as any);

      await service.processDueRecurringTransactions();

      expect(repository.findDueForExecution).toHaveBeenCalled();
      expect(service.executeRecurringTransaction).toHaveBeenCalledTimes(2);
    });

    it('should continue processing even if one transaction fails', async () => {
      const dueTransactions = [
        mockRecurringTransaction,
        {
          ...mockRecurringTransaction,
          id: 'recurring-456',
          name: 'Weekly Groceries',
        },
      ];

      repository.findDueForExecution.mockResolvedValue(dueTransactions);

      // Mock first execution to fail, second to succeed
      jest
        .spyOn(service, 'executeRecurringTransaction')
        .mockRejectedValueOnce(new Error('First transaction failed'))
        .mockResolvedValueOnce({
          execution: mockExecution,
          transaction: mockTransaction,
          recurringTransaction: mockRecurringTransaction,
        } as any);

      await service.processDueRecurringTransactions();

      expect(service.executeRecurringTransaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('calculateNextExecutionDate', () => {
    it('should calculate next execution date for daily frequency', () => {
      const fromDate = new Date('2024-01-01');
      const nextDate = (service as any).calculateNextExecutionDate(
        fromDate,
        RecurrenceFrequency.DAILY,
        1
      );

      expect(nextDate).toEqual(new Date('2024-01-02'));
    });

    it('should calculate next execution date for weekly frequency', () => {
      const fromDate = new Date('2024-01-01');
      const nextDate = (service as any).calculateNextExecutionDate(
        fromDate,
        RecurrenceFrequency.WEEKLY,
        2
      );

      expect(nextDate).toEqual(new Date('2024-01-15'));
    });

    it('should calculate next execution date for monthly frequency', () => {
      const fromDate = new Date('2024-01-01');
      const nextDate = (service as any).calculateNextExecutionDate(
        fromDate,
        RecurrenceFrequency.MONTHLY,
        1
      );

      expect(nextDate).toEqual(new Date('2024-02-01'));
    });

    it('should calculate next execution date for yearly frequency', () => {
      const fromDate = new Date('2024-01-01');
      const nextDate = (service as any).calculateNextExecutionDate(
        fromDate,
        RecurrenceFrequency.YEARLY,
        1
      );

      expect(nextDate).toEqual(new Date('2025-01-01'));
    });
  });

  describe('pause/resume/cancel', () => {
    it('should pause recurring transaction', async () => {
      repository.findById.mockResolvedValue(mockRecurringTransaction);
      permissionsService.checkPermission.mockResolvedValue(undefined);
      repository.updateStatus.mockResolvedValue({
        ...mockRecurringTransaction,
        status: RecurringTransactionStatus.PAUSED,
      });

      const result = await service.pause(
        mockRecurringTransactionId,
        mockUserId
      );

      expect(repository.updateStatus).toHaveBeenCalledWith(
        mockRecurringTransactionId,
        RecurringTransactionStatus.PAUSED
      );
      expect(result.status).toBe(RecurringTransactionStatus.PAUSED);
    });

    it('should resume recurring transaction', async () => {
      repository.findById.mockResolvedValue({
        ...mockRecurringTransaction,
        status: RecurringTransactionStatus.PAUSED,
      });
      permissionsService.checkPermission.mockResolvedValue(undefined);
      repository.updateStatus.mockResolvedValue({
        ...mockRecurringTransaction,
        status: RecurringTransactionStatus.ACTIVE,
      });

      const result = await service.resume(
        mockRecurringTransactionId,
        mockUserId
      );

      expect(repository.updateStatus).toHaveBeenCalledWith(
        mockRecurringTransactionId,
        RecurringTransactionStatus.ACTIVE
      );
      expect(result.status).toBe(RecurringTransactionStatus.ACTIVE);
    });

    it('should cancel recurring transaction', async () => {
      repository.findById.mockResolvedValue(mockRecurringTransaction);
      permissionsService.checkPermission.mockResolvedValue(undefined);
      repository.updateStatus.mockResolvedValue({
        ...mockRecurringTransaction,
        status: RecurringTransactionStatus.CANCELLED,
      });

      const result = await service.cancel(
        mockRecurringTransactionId,
        mockUserId
      );

      expect(repository.updateStatus).toHaveBeenCalledWith(
        mockRecurringTransactionId,
        RecurringTransactionStatus.CANCELLED
      );
      expect(result.status).toBe(RecurringTransactionStatus.CANCELLED);
    });
  });
});
