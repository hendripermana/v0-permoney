import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { BudgetsRepository } from './budgets.repository';
import { CacheService } from '../cache/cache.service';
import { CreateBudgetDto, RecommendationType } from './dto';
import { BudgetPeriod } from '@prisma/client';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let repository: jest.Mocked<BudgetsRepository>;
  let cacheService: jest.Mocked<CacheService>;

  const mockBudget = {
    id: 'budget-1',
    householdId: 'household-1',
    name: 'Monthly Budget',
    period: BudgetPeriod.MONTHLY,
    totalAllocatedCents: 500000,
    currency: 'IDR',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [
      {
        id: 'budget-cat-1',
        budgetId: 'budget-1',
        categoryId: 'category-1',
        allocatedAmountCents: 200000,
        spentAmountCents: 0,
        carryOverCents: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 'category-1',
          name: 'Food',
          icon: '🍔',
          color: '#FF6B6B',
        },
      },
      {
        id: 'budget-cat-2',
        budgetId: 'budget-1',
        categoryId: 'category-2',
        allocatedAmountCents: 300000,
        spentAmountCents: 0,
        carryOverCents: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 'category-2',
          name: 'Transportation',
          icon: '🚗',
          color: '#4ECDC4',
        },
      },
    ],
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findByHousehold: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getSpendingByCategory: jest.fn(),
      getHistoricalSpending: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: BudgetsRepository,
          useValue: mockRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    repository = module.get(BudgetsRepository);
    cacheService = module.get(CacheService);
  });

  describe('createBudget', () => {
    const createBudgetDto: CreateBudgetDto = {
      name: 'Monthly Budget',
      period: BudgetPeriod.MONTHLY,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      categories: [
        {
          categoryId: 'category-1',
          allocatedAmountCents: 200000,
        },
        {
          categoryId: 'category-2',
          allocatedAmountCents: 300000,
        },
      ],
    };

    it('should create a budget successfully', async () => {
      repository.findByHousehold.mockResolvedValue([]);
      repository.create.mockResolvedValue(mockBudget);
      cacheService.del.mockResolvedValue(undefined);

      const result = await service.createBudget('household-1', createBudgetDto);

      expect(result).toEqual(mockBudget);
      expect(repository.create).toHaveBeenCalledWith('household-1', createBudgetDto);
      expect(cacheService.del).toHaveBeenCalledWith('budgets:household-1');
    });

    it('should throw BadRequestException for invalid date range', async () => {
      const invalidDto = {
        ...createBudgetDto,
        startDate: '2024-01-31',
        endDate: '2024-01-01',
      };

      await expect(service.createBudget('household-1', invalidDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for overlapping budgets', async () => {
      repository.findByHousehold.mockResolvedValue([mockBudget]);

      await expect(service.createBudget('household-1', createBudgetDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getBudgetProgress', () => {
    it('should calculate budget progress correctly', async () => {
      repository.findById.mockResolvedValue(mockBudget);
      repository.getSpendingByCategory.mockResolvedValue([
        { categoryId: 'category-1', totalSpentCents: 150000 },
        { categoryId: 'category-2', totalSpentCents: 100000 },
      ]);

      const result = await service.getBudgetProgress('budget-1', 'household-1');

      expect(result).toEqual({
        budgetId: 'budget-1',
        totalAllocatedCents: 500000,
        totalSpentCents: 250000,
        totalRemainingCents: 250000,
        utilizationPercentage: 50,
        categories: [
          {
            categoryId: 'category-1',
            categoryName: 'Food',
            allocatedAmountCents: 200000,
            spentAmountCents: 150000,
            remainingAmountCents: 50000,
            utilizationPercentage: 75,
            isOverspent: false,
            overspentAmountCents: 0,
          },
          {
            categoryId: 'category-2',
            categoryName: 'Transportation',
            allocatedAmountCents: 300000,
            spentAmountCents: 100000,
            remainingAmountCents: 200000,
            utilizationPercentage: 33.33,
            isOverspent: false,
            overspentAmountCents: 0,
          },
        ],
        isOverBudget: false,
        overBudgetAmountCents: 0,
      });
    });

    it('should handle overspent categories', async () => {
      repository.findById.mockResolvedValue(mockBudget);
      repository.getSpendingByCategory.mockResolvedValue([
        { categoryId: 'category-1', totalSpentCents: 250000 }, // Overspent
        { categoryId: 'category-2', totalSpentCents: 100000 },
      ]);

      const result = await service.getBudgetProgress('budget-1', 'household-1');

      expect(result.categories[0]).toEqual({
        categoryId: 'category-1',
        categoryName: 'Food',
        allocatedAmountCents: 200000,
        spentAmountCents: 250000,
        remainingAmountCents: -50000,
        utilizationPercentage: 125,
        isOverspent: true,
        overspentAmountCents: 50000,
      });
    });
  });

  describe('getBudgetAlerts', () => {
    it('should generate critical alert for overspent category', async () => {
      repository.findById.mockResolvedValue(mockBudget);
      repository.getSpendingByCategory.mockResolvedValue([
        { categoryId: 'category-1', totalSpentCents: 250000 }, // Overspent
        { categoryId: 'category-2', totalSpentCents: 100000 },
      ]);

      const result = await service.getBudgetAlerts('budget-1', 'household-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'CRITICAL',
        categoryId: 'category-1',
        categoryName: 'Food',
        message: expect.stringContaining('Budget exceeded'),
        utilizationPercentage: 125,
        remainingAmountCents: -50000,
      });
    });

    it('should generate warning alert for 90% utilization', async () => {
      repository.findById.mockResolvedValue(mockBudget);
      repository.getSpendingByCategory.mockResolvedValue([
        { categoryId: 'category-1', totalSpentCents: 180000 }, // 90% of 200000
        { categoryId: 'category-2', totalSpentCents: 100000 },
      ]);

      const result = await service.getBudgetAlerts('budget-1', 'household-1');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('WARNING');
    });
  });

  describe('generateBudgetRecommendations', () => {
    it('should generate increase allocation recommendation', async () => {
      repository.findByHousehold.mockResolvedValue([mockBudget]);
      repository.getSpendingByCategory.mockResolvedValue([
        { categoryId: 'category-1', totalSpentCents: 250000 }, // Overspent
        { categoryId: 'category-2', totalSpentCents: 100000 },
      ]);
      repository.getHistoricalSpending.mockResolvedValue([
        { month: new Date('2023-12-01'), totalSpentCents: 240000 },
        { month: new Date('2023-11-01'), totalSpentCents: 230000 },
        { month: new Date('2023-10-01'), totalSpentCents: 220000 },
      ]);

      const result = await service.generateBudgetRecommendations('household-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'increase_category-1',
        type: RecommendationType.INCREASE_ALLOCATION,
        title: 'Increase Food Budget',
        description: expect.stringContaining('consider increasing'),
        categoryId: 'category-1',
        suggestedAmountCents: expect.any(Number),
        confidenceScore: 0.85,
        reasoning: expect.stringContaining('Historical average spending'),
      });
    });

    it('should generate decrease allocation recommendation', async () => {
      repository.findByHousehold.mockResolvedValue([mockBudget]);
      repository.getSpendingByCategory.mockResolvedValue([
        { categoryId: 'category-1', totalSpentCents: 50000 }, // Low utilization
        { categoryId: 'category-2', totalSpentCents: 100000 },
      ]);
      repository.getHistoricalSpending.mockResolvedValue([
        { month: new Date('2023-12-01'), totalSpentCents: 60000 },
        { month: new Date('2023-11-01'), totalSpentCents: 55000 },
        { month: new Date('2023-10-01'), totalSpentCents: 50000 },
      ]);

      const result = await service.generateBudgetRecommendations('household-1');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(RecommendationType.DECREASE_ALLOCATION);
    });
  });

  describe('carryOverUnusedBudget', () => {
    it('should create new budget with carry-over amounts', async () => {
      repository.findById.mockResolvedValue(mockBudget);
      repository.getSpendingByCategory.mockResolvedValue([
        { categoryId: 'category-1', totalSpentCents: 150000 },
        { categoryId: 'category-2', totalSpentCents: 200000 },
      ]);
      repository.create.mockResolvedValue({
        ...mockBudget,
        id: 'budget-2',
        name: 'Monthly Budget (Carry-over)',
      });
      repository.findByHousehold.mockResolvedValue([]);
      cacheService.del.mockResolvedValue(undefined);

      const result = await service.carryOverUnusedBudget('budget-1', 'household-1');

      expect(repository.create).toHaveBeenCalledWith('household-1', {
        name: 'Monthly Budget (Carry-over)',
        period: BudgetPeriod.MONTHLY,
        startDate: expect.any(String),
        endDate: expect.any(String),
        currency: 'IDR',
        categories: [
          {
            categoryId: 'category-1',
            allocatedAmountCents: 200000,
            carryOverCents: 50000, // 200000 - 150000
          },
          {
            categoryId: 'category-2',
            allocatedAmountCents: 300000,
            carryOverCents: 100000, // 300000 - 200000
          },
        ],
      });
    });
  });
});
