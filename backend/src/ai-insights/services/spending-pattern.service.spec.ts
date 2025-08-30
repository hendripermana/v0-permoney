import { Test, TestingModule } from '@nestjs/testing';
import { SpendingPatternService } from './spending-pattern.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SpendingPatternService', () => {
  let service: SpendingPatternService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
    },
    spendingPattern: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpendingPatternService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SpendingPatternService>(SpendingPatternService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeSpendingPatterns', () => {
    it('should analyze spending patterns successfully', async () => {
      const householdId = 'test-household-id';
      const mockTransactions = [
        {
          id: 'tx-1',
          householdId,
          amountCents: 50000,
          date: new Date('2024-01-15'),
          categoryId: 'cat-1',
          category: { name: 'Food' },
        },
        {
          id: 'tx-2',
          householdId,
          amountCents: 45000,
          date: new Date('2024-01-16'),
          categoryId: 'cat-1',
          category: { name: 'Food' },
        },
        {
          id: 'tx-3',
          householdId,
          amountCents: 55000,
          date: new Date('2024-01-17'),
          categoryId: 'cat-1',
          category: { name: 'Food' },
        },
      ];

      // Mock all the different time period queries
      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce(mockTransactions) // Daily patterns (90 days)
        .mockResolvedValueOnce(mockTransactions) // Weekly patterns (12 weeks)
        .mockResolvedValueOnce(mockTransactions) // Monthly patterns (12 months)
        .mockResolvedValueOnce(mockTransactions) // Seasonal patterns (24 months)
        .mockResolvedValue(mockTransactions); // Trend analysis

      mockPrismaService.spendingPattern.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.spendingPattern.createMany.mockResolvedValue({ count: 1 });

      const result = await service.analyzeSpendingPatterns(householdId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalled();
      expect(mockPrismaService.spendingPattern.deleteMany).toHaveBeenCalledWith({
        where: { householdId },
      });
    });

    it('should handle empty transaction data', async () => {
      const householdId = 'test-household-id';

      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.spendingPattern.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.spendingPattern.createMany.mockResolvedValue({ count: 0 });

      const result = await service.analyzeSpendingPatterns(householdId);

      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const householdId = 'test-household-id';
      const error = new Error('Database error');

      mockPrismaService.transaction.findMany.mockRejectedValue(error);

      await expect(service.analyzeSpendingPatterns(householdId)).rejects.toThrow(error);
    });

    it('should respect minimum frequency and confidence options', async () => {
      const householdId = 'test-household-id';
      const options = {
        minFrequency: 5,
        minConfidence: 0.8,
      };

      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.spendingPattern.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.spendingPattern.createMany.mockResolvedValue({ count: 0 });

      const result = await service.analyzeSpendingPatterns(householdId, options);

      expect(result).toEqual([]);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalled();
    });

    it('should skip seasonality when disabled', async () => {
      const householdId = 'test-household-id';
      const options = {
        includeSeasonality: false,
      };

      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce([]) // Daily patterns
        .mockResolvedValueOnce([]) // Weekly patterns
        .mockResolvedValueOnce([]); // Monthly patterns
        // No seasonal patterns call

      mockPrismaService.spendingPattern.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.spendingPattern.createMany.mockResolvedValue({ count: 0 });

      const result = await service.analyzeSpendingPatterns(householdId, options);

      expect(result).toEqual([]);
      // Should only call findMany 3 times (daily, weekly, monthly) instead of 4
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledTimes(3);
    });
  });
});
