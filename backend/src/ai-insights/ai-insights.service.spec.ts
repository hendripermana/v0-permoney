import { Test, TestingModule } from '@nestjs/testing';
import { AIInsightsService } from './ai-insights.service';
import { PrismaService } from '../prisma/prisma.service';
import { SpendingPatternService } from './services/spending-pattern.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { NarrativeGenerationService } from './services/narrative-generation.service';
import { RecommendationService } from './services/recommendation.service';

describe('AIInsightsService', () => {
  let service: AIInsightsService;
  let prismaService: PrismaService;
  let spendingPatternService: SpendingPatternService;
  let anomalyDetectionService: AnomalyDetectionService;
  let narrativeGenerationService: NarrativeGenerationService;
  let recommendationService: RecommendationService;

  const mockPrismaService = {
    financialInsight: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockSpendingPatternService = {
    analyzeSpendingPatterns: jest.fn(),
  };

  const mockAnomalyDetectionService = {
    detectAnomalies: jest.fn(),
  };

  const mockNarrativeGenerationService = {
    generateMonthlyReport: jest.fn(),
  };

  const mockRecommendationService = {
    generateRecommendations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIInsightsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SpendingPatternService,
          useValue: mockSpendingPatternService,
        },
        {
          provide: AnomalyDetectionService,
          useValue: mockAnomalyDetectionService,
        },
        {
          provide: NarrativeGenerationService,
          useValue: mockNarrativeGenerationService,
        },
        {
          provide: RecommendationService,
          useValue: mockRecommendationService,
        },
      ],
    }).compile();

    service = module.get<AIInsightsService>(AIInsightsService);
    prismaService = module.get<PrismaService>(PrismaService);
    spendingPatternService = module.get<SpendingPatternService>(SpendingPatternService);
    anomalyDetectionService = module.get<AnomalyDetectionService>(AnomalyDetectionService);
    narrativeGenerationService = module.get<NarrativeGenerationService>(NarrativeGenerationService);
    recommendationService = module.get<RecommendationService>(RecommendationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateInsights', () => {
    it('should generate comprehensive AI insights', async () => {
      const householdId = 'test-household-id';
      const mockSpendingPatterns = [
        {
          type: 'DAILY',
          categoryName: 'Food',
          averageAmount: 50000,
          confidence: 0.8,
        },
      ];
      const mockAnomalies = [
        {
          type: 'UNUSUAL_SPENDING',
          title: 'High spending detected',
          description: 'Unusual spending pattern',
          severity: 'HIGH',
          confidence: 0.9,
        },
      ];
      const mockRecommendations = [
        {
          type: 'BUDGET_OPTIMIZATION',
          title: 'Create budget',
          description: 'You should create a budget',
          priority: 'HIGH',
        },
      ];

      mockSpendingPatternService.analyzeSpendingPatterns.mockResolvedValue(mockSpendingPatterns);
      mockAnomalyDetectionService.detectAnomalies.mockResolvedValue(mockAnomalies);
      mockRecommendationService.generateRecommendations.mockResolvedValue(mockRecommendations);
      mockPrismaService.financialInsight.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.financialInsight.createMany.mockResolvedValue({ count: 3 });

      const result = await service.generateInsights(householdId);

      expect(result).toHaveLength(3);
      expect(mockSpendingPatternService.analyzeSpendingPatterns).toHaveBeenCalledWith(householdId);
      expect(mockAnomalyDetectionService.detectAnomalies).toHaveBeenCalledWith(householdId);
      expect(mockRecommendationService.generateRecommendations).toHaveBeenCalledWith(householdId);
      expect(mockPrismaService.financialInsight.createMany).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const householdId = 'test-household-id';
      const error = new Error('Database error');

      mockSpendingPatternService.analyzeSpendingPatterns.mockRejectedValue(error);

      await expect(service.generateInsights(householdId)).rejects.toThrow(error);
    });
  });

  describe('generateMonthlyReport', () => {
    it('should generate monthly report with storytelling', async () => {
      const householdId = 'test-household-id';
      const year = 2024;
      const month = 1;
      const mockReport = {
        householdId,
        year,
        month,
        title: 'January 2024 Financial Report',
        summary: 'Test summary',
        narrative: 'Test narrative',
        keyInsights: ['Test insight'],
        financialHighlights: [],
        spendingStory: {
          totalSpent: 1000000,
          topCategories: [],
          unusualSpending: [],
          savingsOpportunities: [],
          narrative: 'Test spending story',
        },
        achievements: [],
        recommendations: [],
        visualData: {
          spendingByCategory: [],
          incomeVsExpenses: [],
          netWorthTrend: [],
          budgetProgress: [],
        },
      };

      mockNarrativeGenerationService.generateMonthlyReport.mockResolvedValue(mockReport);
      mockPrismaService.financialInsight.create.mockResolvedValue({});

      const result = await service.generateMonthlyReport(householdId, year, month);

      expect(result).toEqual(mockReport);
      expect(mockNarrativeGenerationService.generateMonthlyReport).toHaveBeenCalledWith(
        householdId,
        year,
        month,
      );
      expect(mockPrismaService.financialInsight.create).toHaveBeenCalled();
    });
  });

  describe('getStoredInsights', () => {
    it('should retrieve stored insights', async () => {
      const householdId = 'test-household-id';
      const mockInsights = [
        {
          id: 'insight-1',
          insightType: 'SPENDING_PATTERN',
          title: 'Test insight',
          description: 'Test description',
          data: {},
          priority: 'HIGH',
          isActionable: true,
          validUntil: null,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.financialInsight.findMany.mockResolvedValue(mockInsights);

      const result = await service.getStoredInsights(householdId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('insight-1');
      expect(mockPrismaService.financialInsight.findMany).toHaveBeenCalledWith({
        where: {
          householdId,
          OR: [
            { validUntil: { gte: expect.any(Date) } },
            { validUntil: null },
          ],
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      });
    });
  });

  describe('dismissInsight', () => {
    it('should dismiss an insight', async () => {
      const insightId = 'insight-1';

      mockPrismaService.financialInsight.update.mockResolvedValue({});

      await service.dismissInsight(insightId);

      expect(mockPrismaService.financialInsight.update).toHaveBeenCalledWith({
        where: { id: insightId },
        data: { isDismissed: true },
      });
    });
  });

  describe('getSpendingPatterns', () => {
    it('should get spending patterns', async () => {
      const householdId = 'test-household-id';
      const mockPatterns = [
        {
          type: 'DAILY',
          categoryName: 'Food',
          averageAmount: 50000,
          confidence: 0.8,
        },
      ];

      mockSpendingPatternService.analyzeSpendingPatterns.mockResolvedValue(mockPatterns);

      const result = await service.getSpendingPatterns(householdId);

      expect(result).toEqual(mockPatterns);
      expect(mockSpendingPatternService.analyzeSpendingPatterns).toHaveBeenCalledWith(householdId, undefined);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies', async () => {
      const householdId = 'test-household-id';
      const mockAnomalies = [
        {
          type: 'UNUSUAL_SPENDING',
          title: 'High spending detected',
          description: 'Unusual spending pattern',
          severity: 'HIGH',
          confidence: 0.9,
        },
      ];

      mockAnomalyDetectionService.detectAnomalies.mockResolvedValue(mockAnomalies);

      const result = await service.detectAnomalies(householdId);

      expect(result).toEqual(mockAnomalies);
      expect(mockAnomalyDetectionService.detectAnomalies).toHaveBeenCalledWith(householdId, undefined);
    });
  });

  describe('getRecommendations', () => {
    it('should get recommendations', async () => {
      const householdId = 'test-household-id';
      const mockRecommendations = [
        {
          type: 'BUDGET_OPTIMIZATION',
          title: 'Create budget',
          description: 'You should create a budget',
          priority: 'HIGH',
        },
      ];

      mockRecommendationService.generateRecommendations.mockResolvedValue(mockRecommendations);

      const result = await service.getRecommendations(householdId);

      expect(result).toEqual(mockRecommendations);
      expect(mockRecommendationService.generateRecommendations).toHaveBeenCalledWith(householdId);
    });
  });
});
