import { Test, TestingModule } from '@nestjs/testing';
import { DebtsService } from './debts.service';
import { DebtsRepository } from './debts.repository';
import { PrismaService } from '../prisma/prisma.service';
import { DebtType } from '@prisma/client';
import { CreateDebtDto, CreateDebtPaymentDto } from './dto';

describe('Debts Performance Testing', () => {
  let service: DebtsService;
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
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DebtsService>(DebtsService);
    repository = module.get<DebtsRepository>(DebtsRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Debt Creation Performance', () => {
    it('should create single debt within performance threshold', async () => {
      const createDebtDto: CreateDebtDto = {
        type: DebtType.PERSONAL,
        name: 'Performance Test Debt',
        creditor: 'Test Creditor',
        principalAmount: 5000,
        startDate: '2024-01-01',
      };

      mockDebtsRepository.create.mockResolvedValue({
        id: 'debt-1',
        ...createDebtDto,
      });

      const startTime = performance.now();
      await service.createDebt('household-1', createDebtDto, 'user-1');
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle bulk debt creation efficiently', async () => {
      const debtCount = 100;
      const debts: CreateDebtDto[] = Array.from({ length: debtCount }, (_, i) => ({
        type: DebtType.PERSONAL,
        name: `Bulk Test Debt ${i}`,
        creditor: `Creditor ${i}`,
        principalAmount: 1000 + i,
        startDate: '2024-01-01',
      }));

      mockDebtsRepository.create.mockImplementation((householdId, data) =>
        Promise.resolve({ id: `debt-${data.name}`, ...data })
      );

      const startTime = performance.now();
      const promises = debts.map(debt =>
        service.createDebt('household-1', debt, 'user-1')
      );
      await Promise.all(promises);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      const averageTime = executionTime / debtCount;

      expect(executionTime).toBeLessThan(5000); // Total should complete within 5 seconds
      expect(averageTime).toBeLessThan(50); // Average per debt should be under 50ms
    });
  });

  describe('Debt Retrieval Performance', () => {
    it('should retrieve single debt efficiently', async () => {
      const mockDebt = {
        id: 'debt-1',
        householdId: 'household-1',
        name: 'Test Debt',
        type: DebtType.PERSONAL,
        payments: [],
      };

      mockDebtsRepository.findById.mockResolvedValue(mockDebt);

      const startTime = performance.now();
      await service.getDebtById('debt-1', 'household-1');
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(50); // Should complete within 50ms
    });

    it('should handle large debt lists efficiently', async () => {
      const debtCount = 1000;
      const mockDebts = Array.from({ length: debtCount }, (_, i) => ({
        id: `debt-${i}`,
        householdId: 'household-1',
        name: `Debt ${i}`,
        type: DebtType.PERSONAL,
        currentBalanceCents: BigInt(i * 1000),
        payments: [],
      }));

      mockDebtsRepository.findByHousehold.mockResolvedValue(mockDebts);

      const startTime = performance.now();
      const result = await service.getDebtsByHousehold('household-1');
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(200); // Should complete within 200ms
      expect(result).toHaveLength(debtCount);
    });

    it('should handle complex filtering without performance degradation', async () => {
      const debtCount = 500;
      const mockDebts = Array.from({ length: debtCount }, (_, i) => ({
        id: `debt-${i}`,
        householdId: 'household-1',
        name: `Test Debt ${i}`,
        type: i % 3 === 0 ? DebtType.PERSONAL : 
              i % 3 === 1 ? DebtType.CONVENTIONAL : DebtType.ISLAMIC,
        creditor: `Creditor ${i % 10}`,
        isActive: i % 4 !== 0,
        payments: [],
      }));

      mockDebtsRepository.findByHousehold.mockResolvedValue(
        mockDebts.filter(debt => 
          debt.type === DebtType.PERSONAL && 
          debt.isActive && 
          debt.creditor.includes('5')
        )
      );

      const filters = {
        type: DebtType.PERSONAL,
        isActive: true,
        creditor: '5',
        search: 'test',
      };

      const startTime = performance.now();
      await service.getDebtsByHousehold('household-1', filters);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe('Payment Processing Performance', () => {
    it('should process single payment efficiently', async () => {
      const mockDebt = {
        id: 'debt-1',
        householdId: 'household-1',
        type: DebtType.PERSONAL,
        currentBalanceCents: BigInt(500000),
        principalAmountCents: BigInt(500000),
        startDate: new Date('2024-01-01'),
        isActive: true,
        payments: [],
      };

      const paymentDto: CreateDebtPaymentDto = {
        amount: 1000,
        paymentDate: '2024-02-01',
        principalAmount: 1000,
        interestAmount: 0,
      };

      mockDebtsRepository.findById.mockResolvedValue(mockDebt);
      mockDebtsRepository.createPayment.mockResolvedValue({
        id: 'payment-1',
        debtId: 'debt-1',
        amountCents: BigInt(100000),
      });

      const startTime = performance.now();
      await service.recordPayment('debt-1', 'household-1', paymentDto);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle concurrent payment processing', async () => {
      const mockDebt = {
        id: 'debt-1',
        householdId: 'household-1',
        type: DebtType.PERSONAL,
        currentBalanceCents: BigInt(1000000), // Large balance for multiple payments
        principalAmountCents: BigInt(1000000),
        startDate: new Date('2024-01-01'),
        isActive: true,
        payments: [],
      };

      const paymentCount = 50;
      const payments: CreateDebtPaymentDto[] = Array.from({ length: paymentCount }, (_, i) => ({
        amount: 100,
        paymentDate: `2024-02-${String(i + 1).padStart(2, '0')}`,
        principalAmount: 100,
        interestAmount: 0,
      }));

      mockDebtsRepository.findById.mockResolvedValue(mockDebt);
      mockDebtsRepository.createPayment.mockImplementation((debtId, data) =>
        Promise.resolve({
          id: `payment-${data.paymentDate}`,
          debtId,
          amountCents: BigInt(data.amount * 100),
        })
      );

      const startTime = performance.now();
      const promises = payments.map(payment =>
        service.recordPayment('debt-1', 'household-1', payment)
      );
      await Promise.all(promises);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      const averageTime = executionTime / paymentCount;

      expect(executionTime).toBeLessThan(3000); // Total should complete within 3 seconds
      expect(averageTime).toBeLessThan(60); // Average per payment should be under 60ms
    });
  });

  describe('Payment Schedule Calculation Performance', () => {
    it('should calculate conventional schedule efficiently', async () => {
      const mockDebt = {
        id: 'debt-conv',
        householdId: 'household-1',
        type: DebtType.CONVENTIONAL,
        name: 'Performance Test Debt',
        currentBalanceCents: BigInt(10000000), // 100,000 IDR
        principalAmountCents: BigInt(10000000),
        interestRate: { toNumber: () => 0.12 },
        startDate: new Date('2024-01-01'),
        maturityDate: new Date('2044-01-01'), // 20 years - long term
        payments: [],
      };

      mockDebtsRepository.findById.mockResolvedValue(mockDebt);
      mockDebtsRepository.getPaymentsByDebt.mockResolvedValue([]);

      const startTime = performance.now();
      const schedule = await service.calculatePaymentSchedule('debt-conv', 'household-1');
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(500); // Should complete within 500ms
      expect(schedule.schedule.length).toBeGreaterThan(0);
    });

    it('should calculate Islamic schedule efficiently', async () => {
      const mockDebt = {
        id: 'debt-islamic',
        householdId: 'household-1',
        type: DebtType.ISLAMIC,
        name: 'Performance Test Islamic Debt',
        currentBalanceCents: BigInt(50000000), // 500,000 IDR
        principalAmountCents: BigInt(50000000),
        marginRate: { toNumber: () => 0.06 },
        startDate: new Date('2024-01-01'),
        maturityDate: new Date('2054-01-01'), // 30 years - very long term
        payments: [],
      };

      mockDebtsRepository.findById.mockResolvedValue(mockDebt);
      mockDebtsRepository.getPaymentsByDebt.mockResolvedValue([]);

      const startTime = performance.now();
      const schedule = await service.calculatePaymentSchedule('debt-islamic', 'household-1');
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(800); // Should complete within 800ms
      expect(schedule.schedule.length).toBeGreaterThan(0);
    });

    it('should handle schedule with extensive payment history', async () => {
      const paymentCount = 120; // 10 years of monthly payments
      const mockPayments = Array.from({ length: paymentCount }, (_, i) => ({
        id: `payment-${i}`,
        paymentDate: new Date(2014, i % 12, 1), // Historical payments
        amountCents: BigInt(50000),
        principalAmountCents: BigInt(40000),
        interestAmountCents: BigInt(10000),
      }));

      const mockDebt = {
        id: 'debt-history',
        householdId: 'household-1',
        type: DebtType.CONVENTIONAL,
        name: 'Historical Debt',
        currentBalanceCents: BigInt(5000000), // Remaining balance
        principalAmountCents: BigInt(10000000), // Original amount
        interestRate: { toNumber: () => 0.08 },
        startDate: new Date('2014-01-01'),
        maturityDate: new Date('2034-01-01'),
        payments: mockPayments,
      };

      mockDebtsRepository.findById.mockResolvedValue(mockDebt);
      mockDebtsRepository.getPaymentsByDebt.mockResolvedValue(mockPayments);

      const startTime = performance.now();
      const schedule = await service.calculatePaymentSchedule('debt-history', 'household-1');
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      expect(schedule.schedule.length).toBeGreaterThan(paymentCount);
    });
  });

  describe('Debt Summary Performance', () => {
    it('should generate summary for large household efficiently', async () => {
      const debtTypes = [DebtType.PERSONAL, DebtType.CONVENTIONAL, DebtType.ISLAMIC];
      const debtsPerType = 100;
      
      const mockDebtsByType = {
        PERSONAL: Array.from({ length: debtsPerType }, (_, i) => ({
          id: `personal-${i}`,
          type: DebtType.PERSONAL,
          name: `Personal Debt ${i}`,
          creditor: `Person ${i}`,
          currentBalanceCents: BigInt(i * 10000),
          principalAmountCents: BigInt(i * 15000),
          currency: 'IDR',
          payments: [],
        })),
        CONVENTIONAL: Array.from({ length: debtsPerType }, (_, i) => ({
          id: `conv-${i}`,
          type: DebtType.CONVENTIONAL,
          name: `Conventional Debt ${i}`,
          creditor: `Bank ${i}`,
          currentBalanceCents: BigInt(i * 50000),
          principalAmountCents: BigInt(i * 75000),
          currency: 'IDR',
          payments: [],
        })),
        ISLAMIC: Array.from({ length: debtsPerType }, (_, i) => ({
          id: `islamic-${i}`,
          type: DebtType.ISLAMIC,
          name: `Islamic Debt ${i}`,
          creditor: `Islamic Bank ${i}`,
          currentBalanceCents: BigInt(i * 100000),
          principalAmountCents: BigInt(i * 150000),
          currency: 'IDR',
          payments: [],
        })),
      };

      const totalDebt = BigInt(
        debtsPerType * (debtsPerType - 1) / 2 * (10000 + 50000 + 100000)
      );

      mockDebtsRepository.getDebtsByType.mockResolvedValue(mockDebtsByType);
      mockDebtsRepository.getTotalDebtByHousehold.mockResolvedValue(totalDebt);

      const startTime = performance.now();
      const summary = await service.getDebtSummary('household-1');
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(300); // Should complete within 300ms
      expect(summary.byType).toHaveLength(3);
      expect(summary.byType.reduce((sum, type) => sum + type.count, 0)).toBe(debtsPerType * 3);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should handle large datasets without memory leaks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate processing large amounts of data
      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        const mockDebt = {
          id: `debt-${i}`,
          householdId: 'household-1',
          type: DebtType.PERSONAL,
          name: `Memory Test Debt ${i}`,
          currentBalanceCents: BigInt(i * 1000),
          payments: Array.from({ length: 10 }, (_, j) => ({
            id: `payment-${i}-${j}`,
            amountCents: BigInt(j * 100),
          })),
        };

        mockDebtsRepository.findById.mockResolvedValue(mockDebt);
        await service.getDebtById(`debt-${i}`, 'household-1');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePerIteration = memoryIncrease / iterations;

      // Memory increase should be reasonable (less than 1KB per iteration)
      expect(memoryIncreasePerIteration).toBeLessThan(1024);
    });
  });

  describe('Database Query Performance Simulation', () => {
    it('should optimize query patterns for debt retrieval', async () => {
      let queryCount = 0;
      
      // Mock repository to count queries
      mockDebtsRepository.findByHousehold.mockImplementation(() => {
        queryCount++;
        return Promise.resolve([]);
      });

      // Simulate multiple calls that should be optimized
      await Promise.all([
        service.getDebtsByHousehold('household-1'),
        service.getDebtsByHousehold('household-1', { type: DebtType.PERSONAL }),
        service.getDebtsByHousehold('household-1', { isActive: true }),
      ]);

      // Each call should result in exactly one query (no N+1 problems)
      expect(queryCount).toBe(3);
    });

    it('should batch operations efficiently', async () => {
      let transactionCount = 0;
      
      mockDebtsRepository.createPayment.mockImplementation(() => {
        transactionCount++;
        return Promise.resolve({ id: 'payment-1' });
      });

      const mockDebt = {
        id: 'debt-1',
        householdId: 'household-1',
        type: DebtType.PERSONAL,
        currentBalanceCents: BigInt(1000000),
        principalAmountCents: BigInt(1000000),
        startDate: new Date('2024-01-01'),
        isActive: true,
        payments: [],
      };

      mockDebtsRepository.findById.mockResolvedValue(mockDebt);

      // Process multiple payments
      const payments = Array.from({ length: 5 }, (_, i) => ({
        amount: 100,
        paymentDate: `2024-02-${String(i + 1).padStart(2, '0')}`,
        principalAmount: 100,
        interestAmount: 0,
      }));

      for (const payment of payments) {
        await service.recordPayment('debt-1', 'household-1', payment);
      }

      // Each payment should be processed in its own transaction
      expect(transactionCount).toBe(5);
    });
  });

  describe('Algorithmic Complexity Testing', () => {
    it('should maintain O(n) complexity for payment schedule calculation', async () => {
      const termLengths = [12, 60, 120, 240, 360]; // 1, 5, 10, 20, 30 years
      const executionTimes: number[] = [];

      for (const termMonths of termLengths) {
        const mockDebt = {
          id: 'debt-complexity',
          householdId: 'household-1',
          type: DebtType.CONVENTIONAL,
          name: 'Complexity Test Debt',
          currentBalanceCents: BigInt(10000000),
          principalAmountCents: BigInt(10000000),
          interestRate: { toNumber: () => 0.06 },
          startDate: new Date('2024-01-01'),
          maturityDate: new Date(2024 + Math.floor(termMonths / 12), 0, 1),
          payments: [],
        };

        mockDebtsRepository.findById.mockResolvedValue(mockDebt);
        mockDebtsRepository.getPaymentsByDebt.mockResolvedValue([]);

        const startTime = performance.now();
        await service.calculatePaymentSchedule('debt-complexity', 'household-1');
        const endTime = performance.now();

        executionTimes.push(endTime - startTime);
      }

      // Verify that execution time grows linearly with term length
      // (allowing for some variance due to system factors)
      for (let i = 1; i < executionTimes.length; i++) {
        const ratio = executionTimes[i] / executionTimes[i - 1];
        const termRatio = termLengths[i] / termLengths[i - 1];
        
        // Execution time ratio should be roughly proportional to term ratio
        // Allow up to 3x variance for system factors
        expect(ratio).toBeLessThan(termRatio * 3);
      }
    });
  });
});
