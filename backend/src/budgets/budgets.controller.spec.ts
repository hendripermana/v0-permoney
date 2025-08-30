import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto';
import { BudgetPeriod } from '@prisma/client';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

describe('BudgetsController', () => {
  let controller: BudgetsController;
  let service: jest.Mocked<BudgetsService>;

  const mockRequest: RequestWithUser = {
    user: {
      id: 'user-1',
      householdId: 'household-1',
      email: 'test@example.com',
      name: 'Test User',
    },
  } as RequestWithUser;

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
    categories: [],
  };

  beforeEach(async () => {
    const mockService = {
      createBudget: jest.fn(),
      getBudgets: jest.fn(),
      getBudgetById: jest.fn(),
      updateBudget: jest.fn(),
      deleteBudget: jest.fn(),
      getBudgetProgress: jest.fn(),
      getBudgetAlerts: jest.fn(),
      generateBudgetRecommendations: jest.fn(),
      carryOverUnusedBudget: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [
        {
          provide: BudgetsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BudgetsController>(BudgetsController);
    service = module.get(BudgetsService);
  });

  describe('createBudget', () => {
    it('should create a budget', async () => {
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
        ],
      };

      service.createBudget.mockResolvedValue(mockBudget);

      const result = await controller.createBudget(mockRequest, createBudgetDto);

      expect(service.createBudget).toHaveBeenCalledWith('household-1', createBudgetDto);
      expect(result).toEqual(mockBudget);
    });
  });

  describe('getBudgets', () => {
    it('should return budgets with filters', async () => {
      const filters = { isActive: true };
      service.getBudgets.mockResolvedValue([mockBudget]);

      const result = await controller.getBudgets(mockRequest, filters);

      expect(service.getBudgets).toHaveBeenCalledWith('household-1', filters);
      expect(result).toEqual([mockBudget]);
    });
  });

  describe('getBudgetById', () => {
    it('should return a specific budget', async () => {
      service.getBudgetById.mockResolvedValue(mockBudget);

      const result = await controller.getBudgetById(mockRequest, 'budget-1');

      expect(service.getBudgetById).toHaveBeenCalledWith('budget-1', 'household-1');
      expect(result).toEqual(mockBudget);
    });
  });

  describe('getBudgetProgress', () => {
    it('should return budget progress', async () => {
      const mockProgress = {
        budgetId: 'budget-1',
        totalAllocatedCents: 500000,
        totalSpentCents: 250000,
        totalRemainingCents: 250000,
        utilizationPercentage: 50,
        categories: [],
        isOverBudget: false,
        overBudgetAmountCents: 0,
      };

      service.getBudgetProgress.mockResolvedValue(mockProgress);

      const result = await controller.getBudgetProgress(mockRequest, 'budget-1');

      expect(service.getBudgetProgress).toHaveBeenCalledWith('budget-1', 'household-1');
      expect(result).toEqual(mockProgress);
    });
  });

  describe('getBudgetAlerts', () => {
    it('should return budget alerts', async () => {
      const mockAlerts = [
        {
          type: 'WARNING' as const,
          categoryId: 'category-1',
          categoryName: 'Food',
          message: '90% of budget used',
          utilizationPercentage: 90,
          remainingAmountCents: 20000,
        },
      ];

      service.getBudgetAlerts.mockResolvedValue(mockAlerts);

      const result = await controller.getBudgetAlerts(mockRequest, 'budget-1');

      expect(service.getBudgetAlerts).toHaveBeenCalledWith('budget-1', 'household-1');
      expect(result).toEqual(mockAlerts);
    });
  });

  describe('getBudgetRecommendations', () => {
    it('should return budget recommendations', async () => {
      const mockRecommendations = [
        {
          id: 'rec-1',
          type: 'INCREASE_ALLOCATION' as const,
          title: 'Increase Food Budget',
          description: 'Consider increasing food budget',
          categoryId: 'category-1',
          suggestedAmountCents: 250000,
          confidenceScore: 0.85,
          reasoning: 'Historical spending patterns',
        },
      ];

      service.generateBudgetRecommendations.mockResolvedValue(mockRecommendations);

      const result = await controller.getBudgetRecommendations(mockRequest);

      expect(service.generateBudgetRecommendations).toHaveBeenCalledWith('household-1');
      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('updateBudget', () => {
    it('should update a budget', async () => {
      const updateDto = { name: 'Updated Budget' };
      const updatedBudget = { ...mockBudget, name: 'Updated Budget' };

      service.updateBudget.mockResolvedValue(updatedBudget);

      const result = await controller.updateBudget(mockRequest, 'budget-1', updateDto);

      expect(service.updateBudget).toHaveBeenCalledWith('budget-1', 'household-1', updateDto);
      expect(result).toEqual(updatedBudget);
    });
  });

  describe('carryOverBudget', () => {
    it('should carry over unused budget', async () => {
      const carryOverBudget = { ...mockBudget, name: 'Monthly Budget (Carry-over)' };

      service.carryOverUnusedBudget.mockResolvedValue(carryOverBudget);

      const result = await controller.carryOverBudget(mockRequest, 'budget-1');

      expect(service.carryOverUnusedBudget).toHaveBeenCalledWith('budget-1', 'household-1');
      expect(result).toEqual(carryOverBudget);
    });
  });

  describe('deleteBudget', () => {
    it('should delete a budget', async () => {
      service.deleteBudget.mockResolvedValue(undefined);

      const result = await controller.deleteBudget(mockRequest, 'budget-1');

      expect(service.deleteBudget).toHaveBeenCalledWith('budget-1', 'household-1');
      expect(result).toEqual({ message: 'Budget deleted successfully' });
    });
  });
});
