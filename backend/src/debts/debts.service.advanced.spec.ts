import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { DebtsRepository } from './debts.repository';
import { DebtType } from '../../../node_modules/.prisma/client';
import { CreateDebtDto, CreateDebtPaymentDto } from './dto';
import {
  DebtValidationException,
  DebtNotFoundException,
  DebtPaymentException,
  DebtCalculationException,
  DebtBusinessRuleException,
  DebtCurrencyException,
  DebtTermException,
} from './exceptions/debt-exceptions';

describe('DebtsService - Advanced Business Logic Testing', () => {
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

  describe('Advanced Validation Testing', () => {
    describe('Date Validation Edge Cases', () => {
      it('should reject start date before 1900', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.PERSONAL,
          name: 'Ancient Debt',
          creditor: 'Time Traveler',
          principalAmount: 1000,
          startDate: '1899-12-31', // Before 1900
        };

        await expect(
          service.createDebt('household-1', createDebtDto, 'user-1')
        ).rejects.toThrow(DebtTermException);
      });

      it('should reject maturity date before start date', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.CONVENTIONAL,
          name: 'Time Paradox Debt',
          creditor: 'Bank',
          principalAmount: 10000,
          interestRate: 0.1,
          startDate: '2024-06-01',
          maturityDate: '2024-05-31', // Before start date
        };

        await expect(
          service.createDebt('household-1', createDebtDto, 'user-1')
        ).rejects.toThrow(DebtTermException);
      });

      it('should reject debt term exceeding 50 years', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.ISLAMIC,
          name: 'Ultra Long Term',
          creditor: 'Islamic Bank',
          principalAmount: 100000,
          marginRate: 0.05,
          startDate: '2024-01-01',
          maturityDate: '2075-01-01', // More than 50 years
        };

        await expect(
          service.createDebt('household-1', createDebtDto, 'user-1')
        ).rejects.toThrow(BadRequestException);
      });

      it('should accept exactly 50-year term', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.ISLAMIC,
          name: 'Max Term Debt',
          creditor: 'Islamic Bank',
          principalAmount: 100000,
          marginRate: 0.05,
          startDate: '2024-01-01',
          maturityDate: '2074-01-01', // Exactly 50 years
        };

        mockDebtsRepository.create.mockResolvedValue({ id: 'debt-1' });

        await expect(
          service.createDebt('household-1', createDebtDto, 'user-1')
        ).resolves.toBeDefined();
      });
    });

    describe('Interest Rate Validation Edge Cases', () => {
      it('should reject extremely low interest rates', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.CONVENTIONAL,
          name: 'Ultra Low Interest',
          creditor: 'Generous Bank',
          principalAmount: 10000,
          interestRate: 0.0005, // 0.05% - below 0.1% threshold
          startDate: '2024-01-01',
          maturityDate: '2026-01-01',
        };

        await expect(
          service.createDebt('household-1', createDebtDto, 'user-1')
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject extremely high interest rates', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.CONVENTIONAL,
          name: 'Loan Shark Debt',
          creditor: 'Predatory Lender',
          principalAmount: 5000,
          interestRate: 0.6, // 60% - above 50% threshold
          startDate: '2024-01-01',
          maturityDate: '2025-01-01',
        };

        await expect(
          service.createDebt('household-1', createDebtDto, 'user-1')
        ).rejects.toThrow(BadRequestException);
      });

      it('should accept boundary interest rates', async () => {
        const validRates = [0.001, 0.5]; // 0.1% and 50%
        
        for (const rate of validRates) {
          const createDebtDto: CreateDebtDto = {
            type: DebtType.CONVENTIONAL,
            name: `Boundary Rate ${rate}`,
            creditor: 'Test Bank',
            principalAmount: 10000,
            interestRate: rate,
            startDate: '2024-01-01',
            maturityDate: '2026-01-01',
          };

          mockDebtsRepository.create.mockResolvedValue({ id: `debt-${rate}` });

          await expect(
            service.createDebt('household-1', createDebtDto, 'user-1')
          ).resolves.toBeDefined();
        }
      });
    });

    describe('Currency Validation', () => {
      it('should reject unsupported currencies', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.PERSONAL,
          name: 'Crypto Debt',
          creditor: 'Crypto Lender',
          principalAmount: 1000,
          currency: 'BTC', // Unsupported
          startDate: '2024-01-01',
        };

        await expect(
          service.createDebt('household-1', createDebtDto, 'user-1')
        ).rejects.toThrow(BadRequestException);
      });

      it('should accept all supported currencies', async () => {
        const supportedCurrencies = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'THB'];
        
        for (const currency of supportedCurrencies) {
          const createDebtDto: CreateDebtDto = {
            type: DebtType.PERSONAL,
            name: `${currency} Debt`,
            creditor: 'Multi-Currency Lender',
            principalAmount: 1000,
            currency,
            startDate: '2024-01-01',
          };

          mockDebtsRepository.create.mockResolvedValue({ id: `debt-${currency}` });

          await expect(
            service.createDebt('household-1', createDebtDto, 'user-1')
          ).resolves.toBeDefined();
        }
      });
    });

    describe('Principal Amount Validation', () => {
      it('should enforce currency-specific maximum amounts', async () => {
        const testCases = [
          { currency: 'IDR', maxAmount: 999999999999, shouldPass: true },
          { currency: 'USD', maxAmount: 999999999, shouldPass: true },
          { currency: 'IDR', maxAmount: 1000000000000, shouldPass: false }, // Exceeds limit
          { currency: 'USD', maxAmount: 1000000000, shouldPass: false }, // Exceeds limit
        ];

        for (const testCase of testCases) {
          const createDebtDto: CreateDebtDto = {
            type: DebtType.PERSONAL,
            name: `${testCase.currency} Max Test`,
            creditor: 'Test Lender',
            principalAmount: testCase.maxAmount,
            currency: testCase.currency,
            startDate: '2024-01-01',
          };

          if (testCase.shouldPass) {
            mockDebtsRepository.create.mockResolvedValue({ id: 'debt-max-test' });
            await expect(
              service.createDebt('household-1', createDebtDto, 'user-1')
            ).resolves.toBeDefined();
          } else {
            await expect(
              service.createDebt('household-1', createDebtDto, 'user-1')
            ).rejects.toThrow(BadRequestException);
          }
        }
      });
    });
  });

  describe('Payment Validation Advanced Testing', () => {
    const mockDebt = {
      id: 'debt-1',
      householdId: 'household-1',
      type: DebtType.CONVENTIONAL,
      name: 'Test Debt',
      currentBalanceCents: BigInt(100000), // 1000 IDR
      principalAmountCents: BigInt(200000), // 2000 IDR original
      interestRate: { toNumber: () => 0.12 },
      marginRate: null,
      startDate: new Date('2024-01-01'),
      maturityDate: new Date('2026-01-01'),
      isActive: true,
      payments: [],
    };

    describe('Payment Date Validation', () => {
      it('should reject payment before debt start date', async () => {
        mockDebtsRepository.findById.mockResolvedValue(mockDebt);

        const paymentDto: CreateDebtPaymentDto = {
          amount: 500,
          paymentDate: '2023-12-31', // Before debt start date
          principalAmount: 450,
          interestAmount: 50,
        };

        await expect(
          service.recordPayment('debt-1', 'household-1', paymentDto)
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject future payment dates', async () => {
        mockDebtsRepository.findById.mockResolvedValue(mockDebt);

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        const paymentDto: CreateDebtPaymentDto = {
          amount: 500,
          paymentDate: futureDate.toISOString().split('T')[0],
          principalAmount: 450,
          interestAmount: 50,
        };

        await expect(
          service.recordPayment('debt-1', 'household-1', paymentDto)
        ).rejects.toThrow(BadRequestException);
      });

      it('should accept payment on debt start date', async () => {
        mockDebtsRepository.findById.mockResolvedValue(mockDebt);
        mockDebtsRepository.createPayment.mockResolvedValue({ id: 'payment-1' });

        const paymentDto: CreateDebtPaymentDto = {
          amount: 500,
          paymentDate: '2024-01-01', // Same as debt start date
          principalAmount: 450,
          interestAmount: 50,
        };

        await expect(
          service.recordPayment('debt-1', 'household-1', paymentDto)
        ).resolves.toBeDefined();
      });
    });

    describe('Payment Amount Validation', () => {
      it('should enforce payment amount tolerance (1 cent)', async () => {
        mockDebtsRepository.findById.mockResolvedValue(mockDebt);

        const paymentDto: CreateDebtPaymentDto = {
          amount: 500.02, // 2 cents off from principal + interest
          paymentDate: '2024-02-01',
          principalAmount: 450,
          interestAmount: 50,
        };

        await expect(
          service.recordPayment('debt-1', 'household-1', paymentDto)
        ).rejects.toThrow(BadRequestException);
      });

      it('should accept payment within tolerance', async () => {
        mockDebtsRepository.findById.mockResolvedValue(mockDebt);
        mockDebtsRepository.createPayment.mockResolvedValue({ id: 'payment-1' });

        const paymentDto: CreateDebtPaymentDto = {
          amount: 500.01, // 1 cent off - within tolerance
          paymentDate: '2024-02-01',
          principalAmount: 450,
          interestAmount: 50,
        };

        await expect(
          service.recordPayment('debt-1', 'household-1', paymentDto)
        ).resolves.toBeDefined();
      });
    });

    describe('Duplicate Payment Detection', () => {
      it('should detect and reject duplicate payments on same date', async () => {
        const debtWithPayments = {
          ...mockDebt,
          payments: [
            {
              id: 'existing-payment',
              amountCents: BigInt(50000), // 500 IDR
              paymentDate: new Date('2024-02-01'),
            },
          ],
        };

        mockDebtsRepository.findById.mockResolvedValue(debtWithPayments);

        const paymentDto: CreateDebtPaymentDto = {
          amount: 500, // Same amount as existing payment
          paymentDate: '2024-02-01', // Same date
          principalAmount: 450,
          interestAmount: 50,
        };

        await expect(
          service.recordPayment('debt-1', 'household-1', paymentDto)
        ).rejects.toThrow(BadRequestException);
      });

      it('should allow different amounts on same date', async () => {
        const debtWithPayments = {
          ...mockDebt,
          payments: [
            {
              id: 'existing-payment',
              amountCents: BigInt(30000), // 300 IDR
              paymentDate: new Date('2024-02-01'),
            },
          ],
        };

        mockDebtsRepository.findById.mockResolvedValue(debtWithPayments);
        mockDebtsRepository.createPayment.mockResolvedValue({ id: 'payment-2' });

        const paymentDto: CreateDebtPaymentDto = {
          amount: 500, // Different amount
          paymentDate: '2024-02-01', // Same date
          principalAmount: 450,
          interestAmount: 50,
        };

        await expect(
          service.recordPayment('debt-1', 'household-1', paymentDto)
        ).resolves.toBeDefined();
      });
    });

    describe('Interest/Margin Validation', () => {
      it('should validate reasonable interest amounts for conventional debt', async () => {
        mockDebtsRepository.findById.mockResolvedValue(mockDebt);

        const paymentDto: CreateDebtPaymentDto = {
          amount: 1500,
          paymentDate: '2024-02-01',
          principalAmount: 450,
          interestAmount: 1050, // Unreasonably high interest
        };

        await expect(
          service.recordPayment('debt-1', 'household-1', paymentDto)
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject interest payments for personal loans', async () => {
        const personalDebt = {
          ...mockDebt,
          type: DebtType.PERSONAL,
          interestRate: null,
        };

        mockDebtsRepository.findById.mockResolvedValue(personalDebt);

        const paymentDto: CreateDebtPaymentDto = {
          amount: 500,
          paymentDate: '2024-02-01',
          principalAmount: 450,
          interestAmount: 50, // Should be 0 for personal loans
        };

        await expect(
          service.recordPayment('debt-1', 'household-1', paymentDto)
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('Payment Schedule Calculation Testing', () => {
    describe('Conventional Debt Schedule', () => {
      it('should calculate accurate amortization schedule', async () => {
        const conventionalDebt = {
          id: 'debt-conv',
          householdId: 'household-1',
          type: DebtType.CONVENTIONAL,
          name: 'Car Loan',
          currentBalanceCents: BigInt(2000000), // 20,000 IDR
          principalAmountCents: BigInt(2000000),
          interestRate: { toNumber: () => 0.06 }, // 6% annual
          startDate: new Date('2024-01-01'),
          maturityDate: new Date('2027-01-01'), // 3 years
          payments: [],
        };

        mockDebtsRepository.findById.mockResolvedValue(conventionalDebt);
        mockDebtsRepository.getPaymentsByDebt.mockResolvedValue([]);

        const schedule = await service.calculatePaymentSchedule('debt-conv', 'household-1');

        expect(schedule.debtId).toBe('debt-conv');
        expect(schedule.monthlyPayment).toBeGreaterThan(0);
        expect(schedule.schedule.length).toBeGreaterThan(0);
        
        // Verify amortization logic
        const firstPayment = schedule.schedule[0];
        const lastPayment = schedule.schedule[schedule.schedule.length - 1];
        
        expect(firstPayment.interestAmount).toBeGreaterThan(lastPayment.interestAmount);
        expect(firstPayment.principalAmount).toBeLessThan(lastPayment.principalAmount);
        expect(lastPayment.remainingBalance).toBeLessThan(1); // Should be nearly zero
      });

      it('should handle remaining term calculation correctly', async () => {
        const debtWithPayments = {
          id: 'debt-partial',
          householdId: 'household-1',
          type: DebtType.CONVENTIONAL,
          name: 'Partially Paid Loan',
          currentBalanceCents: BigInt(1000000), // 10,000 IDR remaining
          principalAmountCents: BigInt(2000000), // 20,000 IDR original
          interestRate: { toNumber: () => 0.08 },
          startDate: new Date('2023-01-01'),
          maturityDate: new Date('2028-01-01'), // 5 years total
          payments: [
            {
              id: 'payment-1',
              paymentDate: new Date('2023-06-01'),
              principalAmountCents: BigInt(500000),
              interestAmountCents: BigInt(50000),
            },
            {
              id: 'payment-2',
              paymentDate: new Date('2024-01-01'),
              principalAmountCents: BigInt(500000),
              interestAmountCents: BigInt(40000),
            },
          ],
        };

        mockDebtsRepository.findById.mockResolvedValue(debtWithPayments);
        mockDebtsRepository.getPaymentsByDebt.mockResolvedValue(debtWithPayments.payments);

        const schedule = await service.calculatePaymentSchedule('debt-partial', 'household-1');

        expect(schedule.schedule.length).toBeLessThan(60); // Less than original 5-year term
        expect(schedule.summary.remainingBalance).toBe(10000);
      });
    });

    describe('Islamic Financing Schedule', () => {
      it('should calculate Murabahah schedule with fixed margin', async () => {
        const islamicDebt = {
          id: 'debt-islamic',
          householdId: 'household-1',
          type: DebtType.ISLAMIC,
          name: 'Home Financing',
          currentBalanceCents: BigInt(10000000), // 100,000 IDR
          principalAmountCents: BigInt(10000000),
          marginRate: { toNumber: () => 0.05 }, // 5% margin
          startDate: new Date('2024-01-01'),
          maturityDate: new Date('2034-01-01'), // 10 years
          payments: [],
        };

        mockDebtsRepository.findById.mockResolvedValue(islamicDebt);
        mockDebtsRepository.getPaymentsByDebt.mockResolvedValue([]);

        const schedule = await service.calculatePaymentSchedule('debt-islamic', 'household-1');

        expect(schedule.debtId).toBe('debt-islamic');
        expect(schedule.monthlyPayment).toBeGreaterThan(0);
        
        // Verify Murabahah principles
        const totalMargin = schedule.summary.totalInterest; // Using interestAmount field for margin
        const expectedTotalMargin = 100000 * 0.05; // 5% of principal
        
        expect(Math.abs(totalMargin - expectedTotalMargin)).toBeLessThan(100); // Allow small rounding differences
        
        // Verify equal monthly payments (characteristic of Murabahah)
        const payments = schedule.schedule.filter(s => !s.isPaid);
        if (payments.length > 1) {
          const firstPayment = payments[0].paymentAmount;
          const secondPayment = payments[1].paymentAmount;
          expect(Math.abs(firstPayment - secondPayment)).toBeLessThan(1); // Should be nearly equal
        }
      });
    });

    describe('Personal Loan Schedule', () => {
      it('should handle flexible personal loan schedule', async () => {
        const personalDebt = {
          id: 'debt-personal',
          householdId: 'household-1',
          type: DebtType.PERSONAL,
          name: 'Friend Loan',
          currentBalanceCents: BigInt(75000), // 750 IDR remaining
          principalAmountCents: BigInt(100000), // 1000 IDR original
          interestRate: null,
          marginRate: null,
          startDate: new Date('2024-01-01'),
          payments: [
            {
              id: 'payment-1',
              paymentDate: new Date('2024-02-01'),
              principalAmountCents: BigInt(25000),
              interestAmountCents: BigInt(0),
            },
          ],
        };

        mockDebtsRepository.findById.mockResolvedValue(personalDebt);
        mockDebtsRepository.getPaymentsByDebt.mockResolvedValue(personalDebt.payments);

        const schedule = await service.calculatePaymentSchedule('debt-personal', 'household-1');

        expect(schedule.debtId).toBe('debt-personal');
        expect(schedule.summary.totalInterest).toBe(0); // No interest for personal loans
        expect(schedule.summary.remainingBalance).toBe(750);
        expect(schedule.schedule.every(s => s.interestAmount === 0)).toBe(true);
      });
    });
  });

  describe('Debt Summary Advanced Testing', () => {
    it('should calculate comprehensive debt summary with multiple debt types', async () => {
      const mockDebtsByType = {
        PERSONAL: [
          {
            id: 'personal-1',
            type: DebtType.PERSONAL,
            name: 'Friend Loan',
            creditor: 'John',
            currentBalanceCents: BigInt(50000),
            principalAmountCents: BigInt(100000),
            currency: 'IDR',
            payments: [],
          },
        ],
        CONVENTIONAL: [
          {
            id: 'conv-1',
            type: DebtType.CONVENTIONAL,
            name: 'Credit Card',
            creditor: 'Bank ABC',
            currentBalanceCents: BigInt(200000),
            principalAmountCents: BigInt(300000),
            currency: 'IDR',
            payments: [],
          },
          {
            id: 'conv-2',
            type: DebtType.CONVENTIONAL,
            name: 'Car Loan',
            creditor: 'Auto Finance',
            currentBalanceCents: BigInt(1500000),
            principalAmountCents: BigInt(2000000),
            currency: 'IDR',
            payments: [],
          },
        ],
        ISLAMIC: [
          {
            id: 'islamic-1',
            type: DebtType.ISLAMIC,
            name: 'Home Financing',
            creditor: 'Islamic Bank',
            currentBalanceCents: BigInt(5000000),
            principalAmountCents: BigInt(6000000),
            currency: 'IDR',
            payments: [],
          },
        ],
      };

      const totalDebt = BigInt(675000); // Sum of all current balances

      mockDebtsRepository.getDebtsByType.mockResolvedValue(mockDebtsByType);
      mockDebtsRepository.getTotalDebtByHousehold.mockResolvedValue(totalDebt);

      const summary = await service.getDebtSummary('household-1');

      expect(summary.totalDebt).toBe(6750); // 675000 / 100
      expect(summary.byType).toHaveLength(3);
      
      const personalSummary = summary.byType.find(t => t.type === DebtType.PERSONAL);
      const conventionalSummary = summary.byType.find(t => t.type === DebtType.CONVENTIONAL);
      const islamicSummary = summary.byType.find(t => t.type === DebtType.ISLAMIC);

      expect(personalSummary?.totalBalance).toBe(500);
      expect(personalSummary?.count).toBe(1);
      
      expect(conventionalSummary?.totalBalance).toBe(1700);
      expect(conventionalSummary?.count).toBe(2);
      
      expect(islamicSummary?.totalBalance).toBe(5000);
      expect(islamicSummary?.count).toBe(1);
    });

    it('should handle empty debt summary correctly', async () => {
      const emptyDebtsByType = {
        PERSONAL: [],
        CONVENTIONAL: [],
        ISLAMIC: [],
      };

      mockDebtsRepository.getDebtsByType.mockResolvedValue(emptyDebtsByType);
      mockDebtsRepository.getTotalDebtByHousehold.mockResolvedValue(BigInt(0));

      const summary = await service.getDebtSummary('household-1');

      expect(summary.totalDebt).toBe(0);
      expect(summary.byType).toHaveLength(0);
      expect(summary.upcomingPayments.dueToday).toHaveLength(0);
      expect(summary.upcomingPayments.dueThisWeek).toHaveLength(0);
      expect(summary.upcomingPayments.dueThisMonth).toHaveLength(0);
      expect(summary.upcomingPayments.overdue).toHaveLength(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle repository errors gracefully', async () => {
      mockDebtsRepository.create.mockRejectedValue(new Error('Database connection failed'));

      const createDebtDto: CreateDebtDto = {
        type: DebtType.PERSONAL,
        name: 'Test Debt',
        creditor: 'Test Creditor',
        principalAmount: 1000,
        startDate: '2024-01-01',
      };

      await expect(
        service.createDebt('household-1', createDebtDto, 'user-1')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle non-existent debt access attempts', async () => {
      mockDebtsRepository.findById.mockResolvedValue(null);

      await expect(
        service.getDebtById('non-existent', 'household-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle cross-household access attempts', async () => {
      const debt = {
        id: 'debt-1',
        householdId: 'other-household',
        name: 'Other Household Debt',
      };

      mockDebtsRepository.findById.mockResolvedValue(debt);

      await expect(
        service.getDebtById('debt-1', 'household-1')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle calculation errors for unsupported debt types', async () => {
      const unsupportedDebt = {
        id: 'debt-unsupported',
        householdId: 'household-1',
        type: 'UNSUPPORTED' as DebtType,
        name: 'Unsupported Debt',
        currentBalanceCents: BigInt(100000),
        principalAmountCents: BigInt(100000),
        payments: [],
      };

      mockDebtsRepository.findById.mockResolvedValue(unsupportedDebt);
      mockDebtsRepository.getPaymentsByDebt.mockResolvedValue([]);

      await expect(
        service.calculatePaymentSchedule('debt-unsupported', 'household-1')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
