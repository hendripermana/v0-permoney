import { Test, TestingModule } from '@nestjs/testing';
import { DebtsRepository } from './debts.repository';
import { PrismaService } from '../prisma/prisma.service';
import { DebtType } from '@prisma/client';
import { CreateDebtDto, CreateDebtPaymentDto } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('DebtsRepository', () => {
  let repository: DebtsRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    debt: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    debtPayment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<DebtsRepository>(DebtsRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a personal debt', async () => {
      const householdId = 'household-1';
      const createDebtDto: CreateDebtDto = {
        type: DebtType.PERSONAL,
        name: 'Loan from John',
        creditor: 'John Doe',
        principalAmount: 1000,
        currency: 'IDR',
        startDate: '2024-01-01',
      };

      const expectedDebt = {
        id: 'debt-1',
        householdId,
        type: DebtType.PERSONAL,
        name: 'Loan from John',
        creditor: 'John Doe',
        principalAmountCents: 100000n,
        currentBalanceCents: 100000n,
        currency: 'IDR',
        interestRate: null,
        marginRate: null,
        startDate: new Date('2024-01-01'),
        maturityDate: null,
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.debt.create.mockResolvedValue(expectedDebt);

      const result = await repository.create(householdId, createDebtDto);

      expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
        data: {
          householdId,
          type: DebtType.PERSONAL,
          name: 'Loan from John',
          creditor: 'John Doe',
          principalAmountCents: 100000,
          currentBalanceCents: 100000,
          currency: 'IDR',
          interestRate: null,
          marginRate: null,
          startDate: new Date('2024-01-01'),
          maturityDate: null,
          metadata: {},
        },
      });
      expect(result).toEqual(expectedDebt);
    });

    it('should create a conventional debt with interest rate', async () => {
      const householdId = 'household-1';
      const createDebtDto: CreateDebtDto = {
        type: DebtType.CONVENTIONAL,
        name: 'Credit Card',
        creditor: 'Bank ABC',
        principalAmount: 5000,
        currency: 'IDR',
        interestRate: 0.18, // 18% annual
        startDate: '2024-01-01',
        maturityDate: '2026-01-01',
      };

      mockPrismaService.debt.create.mockResolvedValue({
        id: 'debt-2',
        interestRate: { toNumber: () => 0.18 },
      });

      await repository.create(householdId, createDebtDto);

      expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: DebtType.CONVENTIONAL,
          interestRate: expect.any(Object), // Prisma.Decimal
          marginRate: null,
        }),
      });
    });

    it('should create an Islamic debt with margin rate', async () => {
      const householdId = 'household-1';
      const createDebtDto: CreateDebtDto = {
        type: DebtType.ISLAMIC,
        name: 'Murabahah Financing',
        creditor: 'Islamic Bank',
        principalAmount: 10000,
        currency: 'IDR',
        marginRate: 0.12, // 12% margin
        startDate: '2024-01-01',
        maturityDate: '2027-01-01',
      };

      mockPrismaService.debt.create.mockResolvedValue({
        id: 'debt-3',
        marginRate: { toNumber: () => 0.12 },
      });

      await repository.create(householdId, createDebtDto);

      expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: DebtType.ISLAMIC,
          interestRate: null,
          marginRate: expect.any(Object), // Prisma.Decimal
        }),
      });
    });
  });

  describe('findById', () => {
    it('should find debt by id with payments', async () => {
      const debtId = 'debt-1';
      const expectedDebt = {
        id: debtId,
        name: 'Test Debt',
        payments: [
          {
            id: 'payment-1',
            amountCents: 50000n,
            paymentDate: new Date('2024-02-01'),
          },
        ],
      };

      mockPrismaService.debt.findUnique.mockResolvedValue(expectedDebt);

      const result = await repository.findById(debtId);

      expect(mockPrismaService.debt.findUnique).toHaveBeenCalledWith({
        where: { id: debtId },
        include: {
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
        },
      });
      expect(result).toEqual(expectedDebt);
    });

    it('should return null if debt not found', async () => {
      mockPrismaService.debt.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createPayment', () => {
    it('should create payment and update debt balance', async () => {
      const debtId = 'debt-1';
      const paymentDto: CreateDebtPaymentDto = {
        amount: 500,
        paymentDate: '2024-02-01',
        principalAmount: 450,
        interestAmount: 50,
      };

      const expectedPayment = {
        id: 'payment-1',
        debtId,
        amountCents: 50000n,
        principalAmountCents: 45000n,
        interestAmountCents: 5000n,
        paymentDate: new Date('2024-02-01'),
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          debtPayment: {
            create: jest.fn().mockResolvedValue(expectedPayment),
          },
          debt: {
            update: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      const result = await repository.createPayment(debtId, paymentDto);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(expectedPayment);
    });
  });

  describe('getTotalDebtByHousehold', () => {
    it('should return total debt amount for household', async () => {
      const householdId = 'household-1';
      const totalDebt = BigInt(500000); // 5000 IDR in cents

      mockPrismaService.debt.aggregate.mockResolvedValue({
        _sum: {
          currentBalanceCents: totalDebt,
        },
      });

      const result = await repository.getTotalDebtByHousehold(householdId);

      expect(mockPrismaService.debt.aggregate).toHaveBeenCalledWith({
        where: {
          householdId,
          isActive: true,
        },
        _sum: {
          currentBalanceCents: true,
        },
      });
      expect(result).toBe(totalDebt);
    });

    it('should return 0 if no debts found', async () => {
      mockPrismaService.debt.aggregate.mockResolvedValue({
        _sum: {
          currentBalanceCents: null,
        },
      });

      const result = await repository.getTotalDebtByHousehold('household-1');

      expect(result).toBe(BigInt(0));
    });
  });
});
