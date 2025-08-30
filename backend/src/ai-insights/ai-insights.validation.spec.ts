import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AIInsightsService } from './ai-insights.service';
import { AIInsightsController } from './ai-insights.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SpendingPatternService } from './services/spending-pattern.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { NarrativeGenerationService } from './services/narrative-generation.service';
import { RecommendationService } from './services/recommendation.service';

describe('AI Insights Validation & QA', () => {
  let controller: AIInsightsController;
  let service: AIInsightsService;
  let spendingPatternService: SpendingPatternService;

  const mockPrismaService = {
    financialInsight: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
    spendingPattern: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
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
      controllers: [AIInsightsController],
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

    controller = module.get<AIInsightsController>(AIInsightsController);
    service = module.get<AIInsightsService>(AIInsightsService);
    spendingPatternService = module.get<SpendingPatternService>(SpendingPatternService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    describe('Controller Validation', () => {
      it('should reject empty household ID', async () => {
        await expect(controller.generateInsights('')).rejects.toThrow(BadRequestException);
      });

      it('should reject null household ID', async () => {
        await expect(controller.generateInsights(null as any)).rejects.toThrow();
      });

      it('should reject invalid year for monthly report', async () => {
        const householdId = '123e4567-e89b-12d3-a456-426614174000';
        await expect(controller.generateMonthlyReport(householdId, 1999, 1)).rejects.toThrow(BadRequestException);
        await expect(controller.generateMonthlyReport(householdId, 2030, 1)).rejects.toThrow(BadRequestException);
      });

      it('should reject invalid month for monthly report', async () => {
        const householdId = '123e4567-e89b-12d3-a456-426614174000';
        await expect(controller.generateMonthlyReport(householdId, 2024, 0)).rejects.toThrow(BadRequestException);
        await expect(controller.generateMonthlyReport(householdId, 2024, 13)).rejects.toThrow(BadRequestException);
      });

      it('should reject future dates for monthly report', async () => {
        const householdId = '123e4567-e89b-12d3-a456-426614174000';
        const futureYear = new Date().getFullYear() + 1;
        await expect(controller.generateMonthlyReport(householdId, futureYear, 1)).rejects.toThrow(BadRequestException);
      });

      it('should reject empty insight ID for dismissal', async () => {
        await expect(controller.dismissInsight('')).rejects.toThrow(BadRequestException);
      });
    });

    describe('Service Validation', () => {
      it('should validate household ID in service methods', async () => {
        await expect(service.generateInsights('')).rejects.toThrow(BadRequestException);
        await expect(service.getSpendingPatterns('')).rejects.toThrow(BadRequestException);
        await expect(service.detectAnomalies('')).rejects.toThrow(BadRequestException);
        await expect(service.getRecommendations('')).rejects.toThrow(BadRequestException);
      });

      it('should validate date parameters in monthly report', async () => {
        const householdId = '123e4567-e89b-12d3-a456-426614174000';
        await expect(service.generateMonthlyReport(householdId, 1999, 1)).rejects.toThrow(BadRequestException);
        await expect(service.generateMonthlyReport(householdId, 2024, 0)).rejects.toThrow(BadRequestException);
        await expect(service.generateMonthlyReport(householdId, 2024, 13)).rejects.toThrow(BadRequestException);
      });

      it('should handle non-existent insight dismissal', async () => {
        const insightId = '123e4567-e89b-12d3-a456-426614174000';
        mockPrismaService.financialInsight.update.mockRejectedValue({ code: 'P2025' });

        await expect(service.dismissInsight(insightId)).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const householdId = '123e4567-e89b-12d3-a456-426614174000';
      const dbError = new Error('Database connection failed');
      
      mockSpendingPatternService.analyzeSpendingPatterns.mockRejectedValue(dbError);
      mockAnomalyDetectionService.detectAnomalies.mockRejectedValue(dbError);
      mockRecommendationService.generateRecommendations.mockRejectedValue(dbError);

      await expect(service.generateInsights(householdId)).rejects.toThrow(dbError);
    });

    it('should handle service timeouts', async () => {
      const householdId = '123e4567-e89b-12d3-a456-426614174000';
      const timeoutError = new Error('Service timeout');
      
      mockNarrativeGenerationService.generateMonthlyReport.mockRejectedValue(timeoutError);

      await expect(service.generateMonthlyReport(householdId, 2024, 1)).rejects.toThrow(timeoutError);
    });
  });

  describe('Data Integrity', () => {
    it('should return consistent data types', async () => {
      const householdId = '123e4567-e89b-12d3-a456-426614174000';
      
      mockSpendingPatternService.analyzeSpendingPatterns.mockResolvedValue([]);
      mockAnomalyDetectionService.detectAnomalies.mockResolvedValue([]);
      mockRecommendationService.generateRecommendations.mockResolvedValue([]);
      mockPrismaService.financialInsight.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.financialInsight.createMany.mockResolvedValue({ count: 0 });

      const result = await service.generateInsights(householdId);
      
      expect(Array.isArray(result)).toBe(true);
      expect(typeof result).toBe('object');
    });

    it('should validate insight data structure', async () => {
      const householdId = '123e4567-e89b-12d3-a456-426614174000';
      
      mockPrismaService.financialInsight.findMany.mockResolvedValue([
        {
          id: 'insight-1',
          insightType: 'SPENDING_PATTERN',
          title: 'Test Insight',
          description: 'Test Description',
          data: { test: 'data' },
          priority: 'HIGH',
          isActionable: true,
          validUntil: null,
          createdAt: new Date(),
        },
      ]);

      const result = await service.getStoredInsights(householdId);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('priority');
      expect(result[0]).toHaveProperty('isActionable');
    });
  });

  describe('Performance & Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      const householdId = '123e4567-e89b-12d3-a456-426614174000';
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        type: 'SPENDING_PATTERN',
        title: `Pattern ${i}`,
        description: `Description ${i}`,
        data: { index: i },
        priority: 'LOW' as const,
        isActionable: true,
      }));

      mockSpendingPatternService.analyzeSpendingPatterns.mockResolvedValue([]);
      mockAnomalyDetectionService.detectAnomalies.mockResolvedValue([]);
      mockRecommendationService.generateRecommendations.mockResolvedValue(largeDataset);
      mockPrismaService.financialInsight.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.financialInsight.createMany.mockResolvedValue({ count: largeDataset.length });

      const startTime = Date.now();
      const result = await service.generateInsights(householdId);
      const endTime = Date.now();

      expect(result).toHaveLength(largeDataset.length);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Security Validation', () => {
    it('should validate input parameters', async () => {
      // Test that empty household ID is rejected
      await expect(service.generateInsights('')).rejects.toThrow(BadRequestException);
      
      // Test that null household ID is rejected
      await expect(service.generateInsights(null as unknown)).rejects.toThrow(BadRequestException);
    });

    it('should handle malformed input gracefully', async () => {
      // Test that service handles malformed data without crashing
      const result = await service.generateInsights('123e4567-e89b-12d3-a456-426614174000');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('API Documentation', () => {
    it('should have proper controller structure', () => {
      expect(AIInsightsController).toBeDefined();
      expect(typeof AIInsightsController).toBe('function');
    });
  });
});
