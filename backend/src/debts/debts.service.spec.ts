import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { DebtsRepository } from './debts.repository';
import { DebtType } from '../../../node_modules/.prisma/client';
import { CreateDebtDto, CreateDebtPaymentDto } from './dto';

describe('DebtsService', () => {
  let service: DebtsService;
  let repository: DebtsRepository;

  const mockDebtsRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByHousehold: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createPayment: jest.fn(),
    getPaymentsByDebt: jest.fn(),
    getDebtsByType: jest.fn(),
    getTotalDebtByHousehold: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtsService,
        {
          provide: DebtsRepository,
          useValue: mockDebtsRepository,
        },
      ],
    }).compile();

    service = module.get<DebtsService>(DebtsService);
    repository = module.get<DebtsRepository>(DebtsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDebt', () => {
    const householdId = 'household-1';
    const userId = 'user-1';

    it('should create a personal debt successfully', async () => {
      const createDebtDto: CreateDebtDto = {
        type: DebtType.PERSONAL,
        name: 'Loan from friend',
        creditor: 'John Doe',
        principalAmount: 1000,
        startDate: '2024-01-01',
      };

      const expectedDebt = {
        id: 'debt-1',
        ...createDebtDto,
        householdId,
      };

      mockDebtsRepository.create.mockResolvedValue(expectedDebt);

      const result = await service.createDebt(householdId, createDebtDto, userId);

      expect(mockDebtsRepository.create).toHaveBeenCalledWith(householdId, createDebtDto);
      expect(result).toEqual(expectedDebt);
    });

    it('should throw error for personal debt with interest rate', async () => {
      const createDebtDto: CreateDebtDto = {
        type: DebtType.PERSONAL,
        name: 'Invalid personal loan',
        creditor: 'Someone',
        principalAmount: 1000,
        interestRate: 0.1, // This should not be allowed
        startDate: '2024-01-01',
      };

      await expect(
        service.createDebt(householdId, createDebtDto, userId)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createDebt(householdId, createDebtDto, userId)
      ).rejects.toThrow('Personal loans cannot have interest or margin rates');
    });

    it('should throw error for conventional debt without interest rate', async () => {
      const createDebtDto: CreateDebtDto = {
        type: DebtType.CONVENTIONAL,
        name: 'Credit Card',
        creditor: 'Bank',
        principalAmount: 5000,
        startDate: '2024-01-01',
        // Missing interestRate
      };

      await expect(
        service.createDebt(householdId, createDebtDto, userId)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createDebt(householdId, createDebtDto, userId)
      ).rejects.toThrow('Conventional debt must have an interest rate');
    });

    it('should throw error for Islamic debt without margin rate', async () => {
      const createDebtDto: CreateDebtDto = {
        type: DebtType.ISLAMIC,
        name: 'Murabahah',
        creditor: 'Islamic Bank',
        principalAmount: 10000,
        startDate: '2024-01-01',
        // Missing marginRate
      };

      await expect(
        service.createDebt(householdId, createDebtDto, userId)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createDebt(householdId, createDebtDto, userId)
      ).rejects.toThrow('Islamic financing must have a margin rate');
    });

    it('should create conventional debt with interest rate', async () => {
      const createDebtDto: CreateDebtDto = {
        type: DebtType.CONVENTIONAL,
        name: 'Car Loan',
        creditor: 'Bank ABC',
        principalAmount: 20000,
        interestRate: 0.08,
        startDate: '2024-01-01',
        maturityDate: '2029-01-01',
      };

      mockDebtsRepository.create.mockResolvedValue({ id: 'debt-2' });

      await service.createDebt(householdId, createDebtDto, userId);

      expect(mockDebtsRepository.create).toHaveBeenCalledWith(householdId, createDebtDto);
    });

    it('should create Islamic debt with margin rate', async () => {
      const createDebtDto: CreateDebtDto = {
        type: DebtType.ISLAMIC,
        name: 'Home Financing',
        creditor: 'Islamic Bank',
        principalAmount: 100000,
        marginRate: 0.06,
        startDate: '2024-01-01',
        maturityDate: '2044-01-01',
      };

      mockDebtsRepository.create.mockResolvedValue({ id: 'debt-3' });

      await service.createDebt(householdId, createDebtDto, userId);

      expect(mockDebtsRepository.create).toHaveBeenCalledWith(householdId, createDebtDto);
    });
  });

  describe('getDebtById', () => {
    it('should return debt if found and belongs to household', async () => {
      const debtId = 'debt-1';
      const householdId = 'household-1';
      const expectedDebt = {
        id: debtId,
        householdId,
        name: 'Test Debt',
        payments: [],
      };

      mockDebtsRepository.findById.mockResolvedValue(expectedDebt);

      const result = await service.getDebtById(debtId, householdId);

      expect(mockDebtsRepository.findById).toHaveBeenCalledWith(debtId);
      expect(result).toEqual(expectedDebt);
    });

    it('should throw NotFoundException if debt not found', async () => {
      mockDebtsRepository.findById.mockResolvedValue(null);

      await expect(
        service.getDebtById('non-existent', 'household-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if debt belongs to different household', async () => {
      const debt = {
        id: 'debt-1',
        householdId: 'other-household',
        name: 'Test Debt',
      };

      mockDebtsRepository.findById.mockResolvedValue(debt);

      await expect(
        service.getDebtById('debt-1', 'household-1')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('recordPayment', () => {
    const debtId = 'debt-1';
    const householdId = 'household-1';

    it('should record payment successfully', async () => {
      const debt = {
        id: debtId,
        householdId,
        currentBalanceCents: BigInt(100000), // 1000 IDR
        payments: [],
      };

      const paymentDto: CreateDebtPaymentDto = {
        amount: 500,
        paymentDate: '2024-02-01',
        principalAmount: 450,
        interestAmount: 50,
      };

      const expectedPayment = {
        id: 'payment-1',
        debtId,
        amountCents: BigInt(50000),
      };

      mockDebtsRepository.findById.mockResolvedValue(debt);
      mockDebtsRepository.createPayment.mockResolvedValue(expectedPayment);

      const result = await service.recordPayment(debtId, householdId, paymentDto);

      expect(mockDebtsRepository.createPayment).toHaveBeenCalledWith(debtId, paymentDto);
      expect(result).toEqual(expectedPayment);
    });

    it('should throw error if principal amount exceeds current balance', async () => {
      const debt = {
        id: debtId,
        householdId,
        currentBalanceCents: BigInt(50000), // 500 IDR
        payments: [],
      };

      const paymentDto: CreateDebtPaymentDto = {
        amount: 600,
        paymentDate: '2024-02-01',
        principalAmount: 600, // Exceeds current balance of 500
        interestAmount: 0,
      };

      mockDebtsRepository.findById.mockResolvedValue(debt);

      await expect(
        service.recordPayment(debtId, householdId, paymentDto)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.recordPayment(debtId, householdId, paymentDto)
      ).rejects.toThrow('Principal amount (600) cannot exceed current balance (500)');
    });

    it('should throw error if total payment amount is incorrect', async () => {
      const debt = {
        id: debtId,
        householdId,
        currentBalanceCents: BigInt(100000),
        payments: [],
      };

      const paymentDto: CreateDebtPaymentDto = {
        amount: 400, // Should be 450 + 50 = 500
        paymentDate: '2024-02-01',
        principalAmount: 450,
        interestAmount: 50,
      };

      mockDebtsRepository.findById.mockResolvedValue(debt);

      await expect(
        service.recordPayment(debtId, householdId, paymentDto)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.recordPayment(debtId, householdId, paymentDto)
      ).rejects.toThrow('Total payment amount must equal principal + interest amounts');
    });
  });

  describe('calculatePaymentSchedule', () => {
    it('should calculate schedule for personal loan', async () => {
      const debt = {
        id: 'debt-1',
        householdId: 'household-1',
        type: DebtType.PERSONAL,
        name: 'Personal Loan',
        currentBalanceCents: BigInt(50000), // 500 IDR remaining
        principalAmountCents: BigInt(100000), // 1000 IDR original
        payments: [
          {
            id: 'payment-1',
            amountCents: BigInt(50000),
            principalAmountCents: BigInt(50000),
            paymentDate: new Date('2024-01-15'),
          },
        ],
      };

      mockDebtsRepository.findById.mockResolvedValue(debt);
      mockDebtsRepository.getPaymentsByDebt.mockResolvedValue(debt.payments);

      const result = await service.calculatePaymentSchedule('debt-1', 'household-1');

      expect(result.debtId).toBe('debt-1');
      expect(result.debtName).toBe('Personal Loan');
      expect(result.summary.totalInterest).toBe(0); // Personal loans have no interest
      expect(result.summary.remainingBalance).toBe(500);
    });

    it('should calculate schedule for conventional debt', async () => {
      const debt = {
        id: 'debt-2',
        householdId: 'household-1',
        type: DebtType.CONVENTIONAL,
        name: 'Credit Card',
        currentBalanceCents: BigInt(500000), // 5000 IDR remaining
        principalAmountCents: BigInt(500000), // 5000 IDR original
        interestRate: { toNumber: () => 0.18 }, // 18% annual
        startDate: new Date('2024-01-01'),
        maturityDate: new Date('2026-01-01'),
        payments: [],
      };

      mockDebtsRepository.findById.mockResolvedValue(debt);
      mockDebtsRepository.getPaymentsByDebt.mockResolvedValue([]);

      const result = await service.calculatePaymentSchedule('debt-2', 'household-1');

      expect(result.debtId).toBe('debt-2');
      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.schedule.length).toBeGreaterThan(0);
      expect(result.summary.totalInterest).toBeGreaterThan(0);
    });

    it('should calculate schedule for Islamic financing', async () => {
      const debt = {
        id: 'debt-3',
        householdId: 'household-1',
        type: DebtType.ISLAMIC,
        name: 'Murabahah Financing',
        currentBalanceCents: BigInt(1000000), // 10000 IDR remaining
        principalAmountCents: BigInt(1000000), // 10000 IDR original
        marginRate: { toNumber: () => 0.06 }, // 6% margin
        startDate: new Date('2024-01-01'),
        maturityDate: new Date('2029-01-01'),
        payments: [],
      };

      mockDebtsRepository.findById.mockResolvedValue(debt);
      mockDebtsRepository.getPaymentsByDebt.mockResolvedValue([]);

      const result = await service.calculatePaymentSchedule('debt-3', 'household-1');

      expect(result.debtId).toBe('debt-3');
      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.schedule.length).toBeGreaterThan(0);
      expect(result.summary.totalInterest).toBeGreaterThan(0); // Actually margin
    });
  });

  describe('getDebtSummary', () => {
    it('should return comprehensive debt summary', async () => {
      const householdId = 'household-1';
      const debtsByType = {
        PERSONAL: [
          {
            id: 'debt-1',
            type: DebtType.PERSONAL,
            name: 'Personal Loan',
            creditor: 'Friend',
            currentBalanceCents: BigInt(50000),
            principalAmountCents: BigInt(100000),
            currency: 'IDR',
            payments: [],
          },
        ],
        CONVENTIONAL: [
          {
            id: 'debt-2',
            type: DebtType.CONVENTIONAL,
            name: 'Credit Card',
            creditor: 'Bank',
            currentBalanceCents: BigInt(200000),
            principalAmountCents: BigInt(300000),
            currency: 'IDR',
            payments: [],
          },
        ],
        ISLAMIC: [],
      };

      const totalDebt = BigInt(250000); // 2500 IDR

      mockDebtsRepository.getDebtsByType.mockResolvedValue(debtsByType);
      mockDebtsRepository.getTotalDebtByHousehold.mockResolvedValue(totalDebt);

      const result = await service.getDebtSummary(householdId);

      expect(result.totalDebt).toBe(2500);
      expect(result.currency).toBe('IDR');
      expect(result.byType).toHaveLength(2); // Only types with debts
      expect(result.byType[0].type).toBe(DebtType.PERSONAL);
      expect(result.byType[0].totalBalance).toBe(500);
      expect(result.byType[0].count).toBe(1);
      expect(result.byType[1].type).toBe(DebtType.CONVENTIONAL);
      expect(result.byType[1].totalBalance).toBe(2000);
      expect(result.byType[1].count).toBe(1);
    });
  });
});
