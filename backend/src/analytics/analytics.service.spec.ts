import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { SpendingAnalyticsService } from './services/spending-analytics.service';
import { CashflowAnalyticsService } from './services/cashflow-analytics.service';
import { NetWorthAnalyticsService } from './services/net-worth-analytics.service';
import { CategoryAnalyticsService } from './services/category-analytics.service';
import { TrendAnalyticsService } from './services/trend-analytics.service';
import { ReportExportService } from './services/report-export.service';
import { MaterializedViewService } from './services/materialized-view.service';
import { BadRequestException } from '@nestjs/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockPrismaService = {
    transaction: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    account: {
      count: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  const mockSpendingAnalyticsService = {
    getSpendingAnalytics: jest.fn(),
  };

  const mockCashflowAnalyticsService = {
    getCashflowAnalysis: jest.fn(),
  };

  const mockNetWorthAnalyticsService = {
    getNetWorthAnalysis: jest.fn(),
  };

  const mockCategoryAnalyticsService = {
    getCategoryBreakdown: jest.fn(),
  };

  const mockTrendAnalyticsService = {
    getTrendAnalysis: jest.fn(),
  };

  const mockReportExportService = {
    generateReport: jest.fn(),
    getReport: jest.fn(),
    listReports: jest.fn(),
    deleteReport: jest.fn(),
  };

  const mockMaterializedViewService = {
    createMaterializedViews: jest.fn(),
    refreshAllViews: jest.fn(),
    refreshMaterializedView: jest.fn(),
    getRefreshStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: SpendingAnalyticsService,
          useValue: mockSpendingAnalyticsService,
        },
        {
          provide: CashflowAnalyticsService,
          useValue: mockCashflowAnalyticsService,
        },
        {
          provide: NetWorthAnalyticsService,
          useValue: mockNetWorthAnalyticsService,
        },
        {
          provide: CategoryAnalyticsService,
          useValue: mockCategoryAnalyticsService,
        },
        {
          provide: TrendAnalyticsService,
          useValue: mockTrendAnalyticsService,
        },
        {
          provide: ReportExportService,
          useValue: mockReportExportService,
        },
        {
          provide: MaterializedViewService,
          useValue: mockMaterializedViewService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    // Remove unused variables
    // prismaService = module.get<PrismaService>(PrismaService);
    // cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializeAnalytics', () => {
    it('should initialize analytics infrastructure successfully', async () => {
      mockMaterializedViewService.createMaterializedViews.mockResolvedValue(undefined);
      mockMaterializedViewService.refreshAllViews.mockResolvedValue([]);

      await service.initializeAnalytics();

      expect(mockMaterializedViewService.createMaterializedViews).toHaveBeenCalled();
      expect(mockMaterializedViewService.refreshAllViews).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockMaterializedViewService.createMaterializedViews.mockRejectedValue(error);

      await expect(service.initializeAnalytics()).rejects.toThrow('Initialization failed');
    });
  });

  describe('getDashboardAnalytics', () => {
    const householdId = 'test-household-id';
    const filters = {
      dateRange: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      },
    };

    it('should return comprehensive dashboard analytics', async () => {
      const mockSpending = {
        totalSpent: 1000,
        totalIncome: 2000,
        netCashflow: 1000,
        averageDaily: 32.26,
        averageTransaction: 50,
        transactionCount: 20,
        topCategories: [],
        trends: [],
        comparisons: {
          previousPeriod: { totalSpent: 900, totalIncome: 1800, netCashflow: 900 },
          changePercentage: { spending: 11.11, income: 11.11, netCashflow: 11.11 },
          trend: 'IMPROVING',
        },
        currency: 'IDR',
      };

      const mockCashflow = {
        totalInflow: 2000,
        totalOutflow: 1000,
        netCashflow: 1000,
        inflowByCategory: [],
        outflowByCategory: [],
        monthlyFlow: [],
        projectedFlow: [],
        currency: 'IDR',
      };

      const mockNetWorth = {
        currentNetWorth: 10000,
        totalAssets: 15000,
        totalLiabilities: 5000,
        history: [],
        assetBreakdown: [],
        liabilityBreakdown: [],
        projectedNetWorth: [],
        currency: 'IDR',
      };

      const mockCategories = [];

      mockSpendingAnalyticsService.getSpendingAnalytics.mockResolvedValue(mockSpending);
      mockCashflowAnalyticsService.getCashflowAnalysis.mockResolvedValue(mockCashflow);
      mockNetWorthAnalyticsService.getNetWorthAnalysis.mockResolvedValue(mockNetWorth);
      mockCategoryAnalyticsService.getCategoryBreakdown.mockResolvedValue(mockCategories);

      const result = await service.getDashboardAnalytics(householdId, filters);

      expect(result).toEqual({
        spending: mockSpending,
        cashflow: mockCashflow,
        netWorth: mockNetWorth,
        topCategories: mockCategories,
        performance: expect.any(Object),
      });

      expect(mockSpendingAnalyticsService.getSpendingAnalytics).toHaveBeenCalledWith(
        householdId,
        filters,
        { includeComparisons: true, includeTrends: true }
      );
      expect(mockCashflowAnalyticsService.getCashflowAnalysis).toHaveBeenCalledWith(
        householdId,
        filters,
        { includeProjections: true }
      );
      expect(mockNetWorthAnalyticsService.getNetWorthAnalysis).toHaveBeenCalledWith(
        householdId,
        filters,
        { includeBreakdown: true, interval: 'monthly' }
      );
      expect(mockCategoryAnalyticsService.getCategoryBreakdown).toHaveBeenCalledWith(
        householdId,
        filters,
        { limit: 10, includeTrends: true }
      );
    });
  });

  describe('validateFilters', () => {
    it('should validate filters successfully', () => {
      const validFilters = {
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
      };

      expect(() => service.validateFilters(validFilters)).not.toThrow();
    });

    it('should throw error for missing date range', () => {
      const invalidFilters = {};

      expect(() => service.validateFilters(invalidFilters as { dateRange?: { startDate: Date; endDate: Date } })).toThrow(
        BadRequestException
      );
    });

    it('should throw error for invalid date range', () => {
      const invalidFilters = {
        dateRange: {
          startDate: new Date('2024-01-31'),
          endDate: new Date('2024-01-01'),
        },
      };

      expect(() => service.validateFilters(invalidFilters)).toThrow(
        'Start date must be before end date'
      );
    });

    it('should throw error for date range exceeding 1 year', () => {
      const invalidFilters = {
        dateRange: {
          startDate: new Date('2023-01-01'),
          endDate: new Date('2024-12-31'),
        },
      };

      expect(() => service.validateFilters(invalidFilters)).toThrow(
        'Date range cannot exceed 1 year'
      );
    });

    it('should throw error for invalid amount range', () => {
      const invalidFilters = {
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        amountRange: {
          min: 1000,
          max: 500,
        },
      };

      expect(() => service.validateFilters(invalidFilters)).toThrow(
        'Amount range minimum cannot be greater than maximum'
      );
    });
  });

  describe('getPerformanceMetrics', () => {
    const householdId = 'test-household-id';

    it('should return performance metrics', async () => {
      mockPrismaService.transaction.count.mockResolvedValue(100);
      mockPrismaService.account.count.mockResolvedValue(5);
      mockPrismaService.transaction.findFirst.mockResolvedValue({
        createdAt: new Date(),
      });

      const result = await service.getPerformanceMetrics(householdId);

      expect(result).toEqual({
        queryExecutionTime: expect.any(Number),
        cacheHitRate: expect.any(Number),
        dataFreshness: expect.any(Date),
        recordsProcessed: 105,
      });
    });

    it('should handle errors gracefully', async () => {
      mockPrismaService.transaction.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getPerformanceMetrics(householdId)).rejects.toThrow();
    });
  });

  describe('refreshMaterializedViews', () => {
    it('should refresh all views when no specific views provided', async () => {
      const mockStatus = [
        {
          viewName: 'daily_spending_summary',
          lastRefreshed: new Date(),
          nextRefresh: new Date(),
          status: 'COMPLETED' as const,
        },
      ];

      mockMaterializedViewService.refreshAllViews.mockResolvedValue(mockStatus);

      const result = await service.refreshMaterializedViews();

      expect(result).toEqual(mockStatus);
      expect(mockMaterializedViewService.refreshAllViews).toHaveBeenCalledWith(false);
    });

    it('should refresh specific views when provided', async () => {
      const viewNames = ['daily_spending_summary'];
      const mockStatus = {
        viewName: 'daily_spending_summary',
        lastRefreshed: new Date(),
        nextRefresh: new Date(),
        status: 'COMPLETED' as const,
      };

      mockMaterializedViewService.refreshMaterializedView.mockResolvedValue(mockStatus);

      const result = await service.refreshMaterializedViews(viewNames);

      expect(result).toEqual([mockStatus]);
      expect(mockMaterializedViewService.refreshMaterializedView).toHaveBeenCalledWith(
        'daily_spending_summary',
        false
      );
    });
  });
});
