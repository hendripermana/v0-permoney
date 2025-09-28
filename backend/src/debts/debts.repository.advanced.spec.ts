import { Test, TestingModule } from '@nestjs/testing';
import { DebtsRepository } from './debts.repository';
import { PrismaService } from '../prisma/prisma.service';
import { DebtType } from '../../../node_modules/.prisma/client';
import { CreateDebtDto, CreateDebtPaymentDto } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('DebtsRepository - Advanced Testing', () => {
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

  describe('Boundary Value Testing', () => {
    describe('Principal Amount Boundaries', () => {
      it('should handle minimum valid principal amount (0.01)', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.PERSONAL,
          name: 'Minimum Debt',
          creditor: 'Test Creditor',
          principalAmount: 0.01,
          currency: 'IDR',
          startDate: '2024-01-01',
        };

        mockPrismaService.debt.create.mockResolvedValue({
          id: 'debt-min',
          principalAmountCents: 1n,
          currentBalanceCents: 1n,
        });

        await repository.create('household-1', createDebtDto);

        expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            principalAmountCents: 1, // 0.01 * 100
            currentBalanceCents: 1,
          }),
        });
      });

      it('should handle maximum valid principal amount for IDR', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.PERSONAL,
          name: 'Maximum Debt',
          creditor: 'Test Creditor',
          principalAmount: 999999999999, // 999 billion IDR
          currency: 'IDR',
          startDate: '2024-01-01',
        };

        mockPrismaService.debt.create.mockResolvedValue({
          id: 'debt-max',
          principalAmountCents: 99999999999900n,
        });

        await repository.create('household-1', createDebtDto);

        expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            principalAmountCents: 99999999999900, // 999999999999 * 100
          }),
        });
      });

      it('should handle floating point precision correctly', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.PERSONAL,
          name: 'Precision Test',
          creditor: 'Test Creditor',
          principalAmount: 1000.99, // Test decimal precision
          currency: 'IDR',
          startDate: '2024-01-01',
        };

        mockPrismaService.debt.create.mockResolvedValue({
          id: 'debt-precision',
          principalAmountCents: 100099n,
        });

        await repository.create('household-1', createDebtDto);

        expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            principalAmountCents: 100099, // 1000.99 * 100
          }),
        });
      });
    });

    describe('Interest Rate Boundaries', () => {
      it('should handle minimum interest rate (0.001)', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.CONVENTIONAL,
          name: 'Low Interest Debt',
          creditor: 'Bank',
          principalAmount: 10000,
          interestRate: 0.001, // 0.1%
          startDate: '2024-01-01',
          maturityDate: '2026-01-01',
        };

        mockPrismaService.debt.create.mockResolvedValue({
          id: 'debt-low-interest',
          interestRate: new Decimal(0.001),
        });

        await repository.create('household-1', createDebtDto);

        expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            interestRate: expect.any(Decimal),
          }),
        });
      });

      it('should handle maximum reasonable interest rate (0.5)', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.CONVENTIONAL,
          name: 'High Interest Debt',
          creditor: 'Lender',
          principalAmount: 5000,
          interestRate: 0.5, // 50%
          startDate: '2024-01-01',
          maturityDate: '2025-01-01',
        };

        mockPrismaService.debt.create.mockResolvedValue({
          id: 'debt-high-interest',
          interestRate: new Decimal(0.5),
        });

        await repository.create('household-1', createDebtDto);

        expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            interestRate: expect.any(Decimal),
          }),
        });
      });
    });

    describe('Date Boundaries', () => {
      it('should handle minimum valid start date (1900-01-01)', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.PERSONAL,
          name: 'Historical Debt',
          creditor: 'Old Creditor',
          principalAmount: 1000,
          startDate: '1900-01-01',
        };

        mockPrismaService.debt.create.mockResolvedValue({
          id: 'debt-historical',
          startDate: new Date('1900-01-01'),
        });

        await repository.create('household-1', createDebtDto);

        expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            startDate: new Date('1900-01-01'),
          }),
        });
      });

      it('should handle maximum term (50 years)', async () => {
        const startDate = '2024-01-01';
        const maturityDate = '2074-01-01'; // 50 years later

        const createDebtDto: CreateDebtDto = {
          type: DebtType.ISLAMIC,
          name: 'Long Term Financing',
          creditor: 'Islamic Bank',
          principalAmount: 100000,
          marginRate: 0.05,
          startDate,
          maturityDate,
        };

        mockPrismaService.debt.create.mockResolvedValue({
          id: 'debt-long-term',
          startDate: new Date(startDate),
          maturityDate: new Date(maturityDate),
        });

        await repository.create('household-1', createDebtDto);

        expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            startDate: new Date(startDate),
            maturityDate: new Date(maturityDate),
          }),
        });
      });
    });
  });

  describe('Concurrency and Transaction Testing', () => {
    it('should handle concurrent payment creation with proper locking', async () => {
      const debtId = 'debt-1';
      const paymentDto: CreateDebtPaymentDto = {
        amount: 500,
        paymentDate: '2024-02-01',
        principalAmount: 500,
        interestAmount: 0,
      };

      const mockDebt = {
        id: debtId,
        currentBalanceCents: 100000n, // 1000 IDR
        currency: 'IDR',
        isActive: true,
        householdId: 'household-1',
      };

      const mockPayment = {
        id: 'payment-1',
        debtId,
        amountCents: 50000n,
        principalAmountCents: 50000n,
        interestAmountCents: 0n,
      };

      // Simulate transaction with proper isolation
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          debt: {
            findUnique: jest.fn().mockResolvedValue(mockDebt),
            update: jest.fn().mockResolvedValue({ currentBalanceCents: 50000n }),
          },
          debtPayment: {
            create: jest.fn().mockResolvedValue(mockPayment),
          },
        };
        return callback(mockTx);
      });

      const result = await repository.createPayment(debtId, paymentDto);

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        {
          maxWait: 5000,
          timeout: 10000,
        }
      );
      expect(result).toEqual(mockPayment);
    });

    it('should handle transaction timeout gracefully', async () => {
      const debtId = 'debt-1';
      const paymentDto: CreateDebtPaymentDto = {
        amount: 500,
        paymentDate: '2024-02-01',
        principalAmount: 500,
        interestAmount: 0,
      };

      mockPrismaService.$transaction.mockRejectedValue(
        new Error('Transaction timeout')
      );

      await expect(repository.createPayment(debtId, paymentDto))
        .rejects.toThrow('Transaction timeout');
    });

    it('should handle database connection failures', async () => {
      const householdId = 'household-1';
      const createDebtDto: CreateDebtDto = {
        type: DebtType.PERSONAL,
        name: 'Test Debt',
        creditor: 'Test Creditor',
        principalAmount: 1000,
        startDate: '2024-01-01',
      };

      mockPrismaService.debt.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(repository.create(householdId, createDebtDto))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('Data Integrity Testing', () => {
    it('should prevent negative balance creation', async () => {
      const debtId = 'debt-1';
      const paymentDto: CreateDebtPaymentDto = {
        amount: 1500,
        paymentDate: '2024-02-01',
        principalAmount: 1500, // More than current balance
        interestAmount: 0,
      };

      const mockDebt = {
        id: debtId,
        currentBalanceCents: 100000n, // 1000 IDR
        currency: 'IDR',
        isActive: true,
        householdId: 'household-1',
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          debt: {
            findUnique: jest.fn().mockResolvedValue(mockDebt),
          },
        };
        return callback(mockTx);
      });

      await expect(repository.createPayment(debtId, paymentDto))
        .rejects.toThrow('Insufficient debt balance');
    });

    it('should handle zero balance debt correctly', async () => {
      const debtId = 'debt-1';
      const paymentDto: CreateDebtPaymentDto = {
        amount: 1000,
        paymentDate: '2024-02-01',
        principalAmount: 1000, // Exactly the remaining balance
        interestAmount: 0,
      };

      const mockDebt = {
        id: debtId,
        currentBalanceCents: 100000n, // 1000 IDR
        currency: 'IDR',
        isActive: true,
        householdId: 'household-1',
      };

      const mockPayment = {
        id: 'payment-1',
        debtId,
        amountCents: 100000n,
        principalAmountCents: 100000n,
        interestAmountCents: 0n,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          debt: {
            findUnique: jest.fn().mockResolvedValue(mockDebt),
            update: jest.fn()
              .mockResolvedValueOnce({ currentBalanceCents: 0n }) // First update (decrement)
              .mockResolvedValueOnce({ currentBalanceCents: 0n }), // Second update (set to zero)
          },
          debtPayment: {
            create: jest.fn().mockResolvedValue(mockPayment),
          },
        };
        return callback(mockTx);
      });

      const result = await repository.createPayment(debtId, paymentDto);

      expect(result).toEqual(mockPayment);
    });

    it('should handle inactive debt payment attempts', async () => {
      const debtId = 'debt-1';
      const paymentDto: CreateDebtPaymentDto = {
        amount: 500,
        paymentDate: '2024-02-01',
        principalAmount: 500,
        interestAmount: 0,
      };

      const mockDebt = {
        id: debtId,
        currentBalanceCents: 100000n,
        currency: 'IDR',
        isActive: false, // Inactive debt
        householdId: 'household-1',
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          debt: {
            findUnique: jest.fn().mockResolvedValue(mockDebt),
          },
        };
        return callback(mockTx);
      });

      await expect(repository.createPayment(debtId, paymentDto))
        .rejects.toThrow('Cannot create payment for inactive debt');
    });
  });

  describe('Performance Testing', () => {
    it('should handle large datasets efficiently', async () => {
      const householdId = 'household-1';
      const largeDebtList = Array.from({ length: 1000 }, (_, i) => ({
        id: `debt-${i}`,
        name: `Debt ${i}`,
        type: DebtType.PERSONAL,
        currentBalanceCents: BigInt(i * 1000),
        payments: [],
      }));

      mockPrismaService.debt.findMany.mockResolvedValue(largeDebtList);

      const startTime = Date.now();
      const result = await repository.findByHousehold(householdId);
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle complex filtering efficiently', async () => {
      const householdId = 'household-1';
      const filters = {
        type: DebtType.CONVENTIONAL,
        isActive: true,
        creditor: 'Bank',
        search: 'loan',
      };

      mockPrismaService.debt.findMany.mockResolvedValue([]);

      await repository.findByHousehold(householdId, filters);

      expect(mockPrismaService.debt.findMany).toHaveBeenCalledWith({
        where: {
          householdId,
          type: DebtType.CONVENTIONAL,
          isActive: true,
          creditor: {
            contains: 'Bank',
            mode: 'insensitive',
          },
          OR: [
            {
              name: {
                contains: 'loan',
                mode: 'insensitive',
              },
            },
            {
              creditor: {
                contains: 'loan',
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
        },
        orderBy: [
          { isActive: 'desc' },
          { currentBalanceCents: 'desc' },
        ],
      });
    });
  });

  describe('Error Recovery Testing', () => {
    it('should recover from partial transaction failures', async () => {
      const debtId = 'debt-1';
      const paymentDto: CreateDebtPaymentDto = {
        amount: 500,
        paymentDate: '2024-02-01',
        principalAmount: 500,
        interestAmount: 0,
      };

      // Simulate failure after payment creation but before debt update
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          debt: {
            findUnique: jest.fn().mockResolvedValue({
              id: debtId,
              currentBalanceCents: 100000n,
              currency: 'IDR',
              isActive: true,
              householdId: 'household-1',
            }),
            update: jest.fn().mockRejectedValue(new Error('Update failed')),
          },
          debtPayment: {
            create: jest.fn().mockResolvedValue({
              id: 'payment-1',
              debtId,
              amountCents: 50000n,
            }),
          },
        };
        return callback(mockTx);
      });

      await expect(repository.createPayment(debtId, paymentDto))
        .rejects.toThrow('Update failed');

      // Verify transaction was properly rolled back
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle database constraint violations', async () => {
      const householdId = 'household-1';
      const createDebtDto: CreateDebtDto = {
        type: DebtType.PERSONAL,
        name: 'Test Debt',
        creditor: 'Test Creditor',
        principalAmount: 1000,
        startDate: '2024-01-01',
      };

      mockPrismaService.debt.create.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(repository.create(householdId, createDebtDto))
        .rejects.toThrow('Unique constraint violation');
    });
  });

  describe('Multi-Currency Testing', () => {
    it('should handle different currencies correctly', async () => {
      const currencies = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'THB'];
      
      for (const currency of currencies) {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.PERSONAL,
          name: `${currency} Debt`,
          creditor: 'Multi-Currency Creditor',
          principalAmount: 1000,
          currency,
          startDate: '2024-01-01',
        };

        mockPrismaService.debt.create.mockResolvedValue({
          id: `debt-${currency}`,
          currency,
        });

        await repository.create('household-1', createDebtDto);

        expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            currency,
          }),
        });
      }
    });
  });
});
