import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { BadRequestException } from '@nestjs/common';
import { ReportType, ExportFormat } from './types/analytics.types';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: AnalyticsService;

  const mockAnalyticsService = {
    validateFilters: jest.fn(),
    getDashboardAnalytics: jest.fn(),
    getSpendingAnalytics: jest.fn(),
    getCashflowAnalysis: jest.fn(),
    getNetWorthAnalysis: jest.fn(),
    getCategoryBreakdown: jest.fn(),
    getTrendAnalysis: jest.fn(),
    generateReport: jest.fn(),
    getReport: jest.fn(),
    listReports: jest.fn(),
    deleteReport: jest.fn(),
    getPerformanceMetrics: jest.fn(),
    initializeAnalytics: jest.fn(),
    refreshMaterializedViews: jest.fn(),
    getMaterializedViewStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardAnalytics', () => {
    it('should return dashboard analytics', async () => {
      const householdId = 'test-household-id';
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const mockResult = {
        spending: {},
        cashflow: {},
        netWorth: {},
        topCategories: [],
        performance: {},
      };

      mockAnalyticsService.validateFilters.mockReturnValue(undefined);
      mockAnalyticsService.getDashboardAnalytics.mockResolvedValue(mockResult);

      const result = await controller.getDashboardAnalytics(householdId, filters);

      expect(result).toEqual(mockResult);
      expect(mockAnalyticsService.validateFilters).toHaveBeenCalled();
      expect(mockAnalyticsService.getDashboardAnalytics).toHaveBeenCalledWith(
        householdId,
        expect.objectContaining({
          dateRange: {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
          },
        })
      );
    });
  });

  describe('getSpendingAnalytics', () => {
    it('should return spending analytics', async () => {
      const householdId = 'test-household-id';
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeComparisons: true,
        includeTrends: true,
        groupBy: 'month' as const,
      };

      const mockResult = {
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
          trend: 'IMPROVING' as const,
        },
        currency: 'IDR',
      };

      mockAnalyticsService.validateFilters.mockReturnValue(undefined);
      mockAnalyticsService.getSpendingAnalytics.mockResolvedValue(mockResult);

      const result = await controller.getSpendingAnalytics(householdId, dto);

      expect(result).toEqual(mockResult);
      expect(mockAnalyticsService.getSpendingAnalytics).toHaveBeenCalledWith(
        householdId,
        expect.any(Object),
        {
          includeComparisons: true,
          includeTrends: true,
          groupBy: 'month',
        }
      );
    });
  });

  describe('getCashflowAnalysis', () => {
    it('should return cashflow analysis', async () => {
      const householdId = 'test-household-id';
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeProjections: true,
        projectionMonths: 6,
      };

      const mockResult = {
        totalInflow: 2000,
        totalOutflow: 1000,
        netCashflow: 1000,
        inflowByCategory: [],
        outflowByCategory: [],
        monthlyFlow: [],
        projectedFlow: [],
        currency: 'IDR',
      };

      mockAnalyticsService.validateFilters.mockReturnValue(undefined);
      mockAnalyticsService.getCashflowAnalysis.mockResolvedValue(mockResult);

      const result = await controller.getCashflowAnalysis(householdId, dto);

      expect(result).toEqual(mockResult);
      expect(mockAnalyticsService.getCashflowAnalysis).toHaveBeenCalledWith(
        householdId,
        expect.any(Object),
        {
          includeProjections: true,
          projectionMonths: 6,
        }
      );
    });
  });

  describe('getNetWorthAnalysis', () => {
    it('should return net worth analysis', async () => {
      const householdId = 'test-household-id';
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeProjections: true,
        includeBreakdown: true,
        interval: 'monthly' as const,
      };

      const mockResult = {
        currentNetWorth: 10000,
        totalAssets: 15000,
        totalLiabilities: 5000,
        history: [],
        assetBreakdown: [],
        liabilityBreakdown: [],
        projectedNetWorth: [],
        currency: 'IDR',
      };

      mockAnalyticsService.validateFilters.mockReturnValue(undefined);
      mockAnalyticsService.getNetWorthAnalysis.mockResolvedValue(mockResult);

      const result = await controller.getNetWorthAnalysis(householdId, dto);

      expect(result).toEqual(mockResult);
      expect(mockAnalyticsService.getNetWorthAnalysis).toHaveBeenCalledWith(
        householdId,
        expect.any(Object),
        {
          includeProjections: true,
          includeBreakdown: true,
          interval: 'monthly',
        }
      );
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should return category breakdown', async () => {
      const householdId = 'test-household-id';
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeSubcategories: true,
        includeTrends: true,
        limit: 10,
      };

      const mockResult = [
        {
          categoryId: 'cat-1',
          categoryName: 'Food',
          totalAmount: 500,
          transactionCount: 10,
          percentage: 50,
          averageAmount: 50,
          trend: {
            direction: 'UP' as const,
            percentage: 10,
            previousPeriodAmount: 450,
          },
        },
      ];

      mockAnalyticsService.validateFilters.mockReturnValue(undefined);
      mockAnalyticsService.getCategoryBreakdown.mockResolvedValue(mockResult);

      const result = await controller.getCategoryBreakdown(householdId, dto);

      expect(result).toEqual(mockResult);
      expect(mockAnalyticsService.getCategoryBreakdown).toHaveBeenCalledWith(
        householdId,
        expect.any(Object),
        {
          includeSubcategories: true,
          includeTrends: true,
          limit: 10,
        }
      );
    });
  });

  describe('getTrendAnalysis', () => {
    it('should return trend analysis', async () => {
      const householdId = 'test-household-id';
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        period: 'monthly' as const,
        trendType: 'spending' as const,
        includeSeasonality: true,
        includeForecast: true,
        forecastPeriods: 6,
      };

      const mockResult = {
        period: 'MONTHLY' as const,
        trends: [],
        seasonality: {
          hasSeasonality: false,
          seasonalFactors: [],
          peakPeriods: [],
        },
        forecast: [],
      };

      mockAnalyticsService.validateFilters.mockReturnValue(undefined);
      mockAnalyticsService.getTrendAnalysis.mockResolvedValue(mockResult);

      const result = await controller.getTrendAnalysis(householdId, dto);

      expect(result).toEqual(mockResult);
      expect(mockAnalyticsService.getTrendAnalysis).toHaveBeenCalledWith(
        householdId,
        expect.any(Object),
        {
          period: 'monthly',
          trendType: 'spending',
          includeSeasonality: true,
          includeForecast: true,
          forecastPeriods: 6,
        }
      );
    });
  });

  describe('generateReport', () => {
    it('should generate and return report', async () => {
      const householdId = 'test-household-id';
      const dto = {
        reportType: ReportType.SPENDING_SUMMARY,
        format: ExportFormat.PDF,
        filters: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        title: 'Test Report',
        description: 'Test Description',
        includeCharts: true,
        includeDetails: true,
        locale: 'en-US',
      };

      const mockResult = {
        id: 'report-123',
        householdId,
        reportType: ReportType.SPENDING_SUMMARY,
        title: 'Test Report',
        description: 'Test Description',
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        data: {},
        format: ExportFormat.PDF,
        fileUrl: '/exports/report-123.pdf',
        createdAt: new Date(),
      };

      mockAnalyticsService.validateFilters.mockReturnValue(undefined);
      mockAnalyticsService.generateReport.mockResolvedValue(mockResult);

      const result = await controller.generateReport(householdId, dto);

      expect(result).toEqual(mockResult);
      expect(mockAnalyticsService.generateReport).toHaveBeenCalledWith(
        householdId,
        ReportType.SPENDING_SUMMARY,
        expect.any(Object),
        {
          format: ExportFormat.PDF,
          includeCharts: true,
          includeDetails: true,
          locale: 'en-US',
        },
        'Test Report',
        'Test Description'
      );
    });
  });

  describe('getReport', () => {
    it('should return existing report', async () => {
      const reportId = 'report-123';
      const mockResult = {
        id: reportId,
        householdId: 'test-household-id',
        reportType: ReportType.SPENDING_SUMMARY,
        title: 'Test Report',
        description: 'Test Description',
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        data: {},
        format: ExportFormat.PDF,
        fileUrl: '/exports/report-123.pdf',
        createdAt: new Date(),
      };

      mockAnalyticsService.getReport.mockResolvedValue(mockResult);

      const result = await controller.getReport(reportId);

      expect(result).toEqual(mockResult);
      expect(mockAnalyticsService.getReport).toHaveBeenCalledWith(reportId);
    });

    it('should throw error if report not found', async () => {
      const reportId = 'non-existent-report';

      mockAnalyticsService.getReport.mockResolvedValue(null);

      await expect(controller.getReport(reportId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('listReports', () => {
    it('should return list of reports', async () => {
      const householdId = 'test-household-id';
      const mockResult = [
        {
          id: 'report-1',
          householdId,
          reportType: ReportType.SPENDING_SUMMARY,
          title: 'Report 1',
          description: 'Description 1',
          period: {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
          },
          data: {},
          format: ExportFormat.PDF,
          createdAt: new Date(),
        },
      ];

      mockAnalyticsService.listReports.mockResolvedValue(mockResult);

      const result = await controller.listReports(householdId, ReportType.SPENDING_SUMMARY, 10);

      expect(result).toEqual(mockResult);
      expect(mockAnalyticsService.listReports).toHaveBeenCalledWith(
        householdId,
        ReportType.SPENDING_SUMMARY,
        10
      );
    });
  });

  describe('deleteReport', () => {
    it('should delete report', async () => {
      const reportId = 'report-123';

      mockAnalyticsService.deleteReport.mockResolvedValue(undefined);

      await controller.deleteReport(reportId);

      expect(mockAnalyticsService.deleteReport).toHaveBeenCalledWith(reportId);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics', async () => {
      const householdId = 'test-household-id';
      const mockResult = {
        queryExecutionTime: 150,
        cacheHitRate: 0.85,
        dataFreshness: new Date(),
        recordsProcessed: 1000,
      };

      mockAnalyticsService.getPerformanceMetrics.mockResolvedValue(mockResult);

      const result = await controller.getPerformanceMetrics(householdId);

      expect(result).toEqual(mockResult);
      expect(mockAnalyticsService.getPerformanceMetrics).toHaveBeenCalledWith(householdId);
    });
  });

  describe('initializeAnalytics', () => {
    it('should initialize analytics infrastructure', async () => {
      mockAnalyticsService.initializeAnalytics.mockResolvedValue(undefined);

      const result = await controller.initializeAnalytics();

      expect(result).toEqual({ message: 'Analytics infrastructure initialized successfully' });
      expect(mockAnalyticsService.initializeAnalytics).toHaveBeenCalled();
    });
  });

  describe('refreshMaterializedViews', () => {
    it('should refresh materialized views', async () => {
      const dto = {
        viewNames: ['daily_spending_summary'],
        force: true,
      };

      const mockResult = [
        {
          viewName: 'daily_spending_summary',
          lastRefreshed: new Date(),
          nextRefresh: new Date(),
          status: 'COMPLETED' as const,
        },
      ];

      mockAnalyticsService.refreshMaterializedViews.mockResolvedValue(mockResult);

      const result = await controller.refreshMaterializedViews(dto);

      expect(result).toEqual(mockResult);
      expect(mockAnalyticsService.refreshMaterializedViews).toHaveBeenCalledWith(
        ['daily_spending_summary'],
        true
      );
    });
  });

  describe('getMaterializedViewStatus', () => {
    it('should return materialized view status', async () => {
      const mockResult = [
        {
          viewName: 'daily_spending_summary',
          lastRefreshed: new Date(),
          nextRefresh: new Date(),
          status: 'COMPLETED' as const,
        },
      ];

      mockAnalyticsService.getMaterializedViewStatus.mockResolvedValue(mockResult);

      const result = await controller.getMaterializedViewStatus();

      expect(result).toEqual(mockResult);
      expect(mockAnalyticsService.getMaterializedViewStatus).toHaveBeenCalled();
    });
  });

  describe('convertFilters', () => {
    it('should convert DTO filters to internal format', () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        categoryIds: ['cat-1', 'cat-2'],
        accountIds: ['acc-1'],
        merchantIds: ['merchant-1'],
        tags: ['tag-1'],
        amountRange: { min: 100, max: 1000 },
        currency: 'IDR',
        includeTransfers: false,
      };

      // Access private method through type assertion
      const result = (controller as any).convertFilters(dto);

      expect(result).toEqual({
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        categoryIds: ['cat-1', 'cat-2'],
        accountIds: ['acc-1'],
        merchantIds: ['merchant-1'],
        tags: ['tag-1'],
        amountRange: { min: 100, max: 1000 },
        currency: 'IDR',
        includeTransfers: false,
      });
    });
  });
});
