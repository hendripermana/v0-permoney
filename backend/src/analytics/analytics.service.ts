import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { SpendingAnalyticsService } from './services/spending-analytics.service';
import { CashflowAnalyticsService } from './services/cashflow-analytics.service';
import { NetWorthAnalyticsService } from './services/net-worth-analytics.service';
import { CategoryAnalyticsService } from './services/category-analytics.service';
import { TrendAnalyticsService } from './services/trend-analytics.service';
import { ReportExportService } from './services/report-export.service';
import { MaterializedViewService } from './services/materialized-view.service';
import {
  SpendingAnalytics,
  CashflowAnalysis,
  NetWorthAnalysis,
  CategoryBreakdown,
  TrendAnalysis,
  FinancialReport,
  AnalyticsFilters,
  PerformanceMetrics,
  MaterializedViewRefreshStatus,
  ReportType,
  ExportOptions,
} from './types/analytics.types';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly spendingAnalyticsService: SpendingAnalyticsService,
    private readonly cashflowAnalyticsService: CashflowAnalyticsService,
    private readonly netWorthAnalyticsService: NetWorthAnalyticsService,
    private readonly categoryAnalyticsService: CategoryAnalyticsService,
    private readonly trendAnalyticsService: TrendAnalyticsService,
    private readonly reportExportService: ReportExportService,
    private readonly materializedViewService: MaterializedViewService,
  ) {}

  /**
   * Initialize analytics infrastructure
   */
  async initializeAnalytics(): Promise<void> {
    this.logger.log('Initializing analytics infrastructure');

    try {
      // Create materialized views for performance optimization
      await this.materializedViewService.createMaterializedViews();
      
      // Perform initial refresh
      await this.materializedViewService.refreshAllViews();

      this.logger.log('Analytics infrastructure initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize analytics infrastructure:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<{
    spending: SpendingAnalytics;
    cashflow: CashflowAnalysis;
    netWorth: NetWorthAnalysis;
    topCategories: CategoryBreakdown[];
    performance: PerformanceMetrics;
  }> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Generating dashboard analytics for household ${householdId}`);

      const [spending, cashflow, netWorth, topCategories] = await Promise.all([
        this.spendingAnalyticsService.getSpendingAnalytics(householdId, filters, {
          includeComparisons: true,
          includeTrends: true,
        }),
        this.cashflowAnalyticsService.getCashflowAnalysis(householdId, filters, {
          includeProjections: true,
        }),
        this.netWorthAnalyticsService.getNetWorthAnalysis(householdId, filters, {
          includeBreakdown: true,
          interval: 'monthly',
        }),
        this.categoryAnalyticsService.getCategoryBreakdown(householdId, filters, {
          limit: 10,
          includeTrends: true,
        }),
      ]);

      const performance = this.calculatePerformanceMetrics(startTime);

      return {
        spending,
        cashflow,
        netWorth,
        topCategories,
        performance,
      };
    } catch (error) {
      this.logger.error(`Failed to generate dashboard analytics for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Get spending analytics
   */
  async getSpendingAnalytics(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      includeComparisons?: boolean;
      includeTrends?: boolean;
      groupBy?: 'day' | 'week' | 'month';
    } = {}
  ): Promise<SpendingAnalytics> {
    return this.spendingAnalyticsService.getSpendingAnalytics(householdId, filters, options);
  }

  /**
   * Get cashflow analysis
   */
  async getCashflowAnalysis(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      includeProjections?: boolean;
      projectionMonths?: number;
    } = {}
  ): Promise<CashflowAnalysis> {
    return this.cashflowAnalyticsService.getCashflowAnalysis(householdId, filters, options);
  }

  /**
   * Get net worth analysis
   */
  async getNetWorthAnalysis(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      includeProjections?: boolean;
      includeBreakdown?: boolean;
      interval?: 'daily' | 'weekly' | 'monthly';
    } = {}
  ): Promise<NetWorthAnalysis> {
    return this.netWorthAnalyticsService.getNetWorthAnalysis(householdId, filters, options);
  }

  /**
   * Get category breakdown
   */
  async getCategoryBreakdown(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      includeSubcategories?: boolean;
      includeTrends?: boolean;
      limit?: number;
    } = {}
  ): Promise<CategoryBreakdown[]> {
    return this.categoryAnalyticsService.getCategoryBreakdown(householdId, filters, options);
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(
    householdId: string,
    filters: AnalyticsFilters,
    options: {
      period: 'daily' | 'weekly' | 'monthly' | 'yearly';
      trendType?: 'spending' | 'income' | 'net_worth' | 'category';
      includeSeasonality?: boolean;
      includeForecast?: boolean;
      forecastPeriods?: number;
    }
  ): Promise<TrendAnalysis> {
    return this.trendAnalyticsService.getTrendAnalysis(householdId, filters, options);
  }

  /**
   * Generate and export report
   */
  async generateReport(
    householdId: string,
    reportType: ReportType,
    filters: AnalyticsFilters,
    exportOptions: ExportOptions,
    title?: string,
    description?: string
  ): Promise<FinancialReport> {
    return this.reportExportService.generateReport(
      householdId,
      reportType,
      filters,
      exportOptions,
      title,
      description
    );
  }

  /**
   * Get existing report
   */
  async getReport(reportId: string): Promise<FinancialReport | null> {
    return this.reportExportService.getReport(reportId);
  }

  /**
   * List reports for household
   */
  async listReports(
    householdId: string,
    reportType?: ReportType,
    limit = 20
  ): Promise<FinancialReport[]> {
    return this.reportExportService.listReports(householdId, reportType, limit);
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<void> {
    return this.reportExportService.deleteReport(reportId);
  }

  /**
   * Refresh materialized views
   */
  async refreshMaterializedViews(
    viewNames?: string[],
    force = false
  ): Promise<MaterializedViewRefreshStatus[]> {
    if (viewNames && viewNames.length > 0) {
      const results = await Promise.allSettled(
        viewNames.map(viewName => 
          this.materializedViewService.refreshMaterializedView(viewName, force)
        )
      );

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            viewName: viewNames[index],
            lastRefreshed: new Date(),
            nextRefresh: new Date(),
            status: 'FAILED' as const,
            error: result.reason?.message || 'Unknown error',
          };
        }
      });
    } else {
      return this.materializedViewService.refreshAllViews(force);
    }
  }

  /**
   * Get materialized view refresh status
   */
  async getMaterializedViewStatus(): Promise<MaterializedViewRefreshStatus[]> {
    return this.materializedViewService.getRefreshStatus();
  }

  /**
   * Get analytics performance metrics
   */
  async getPerformanceMetrics(householdId: string): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    
    try {
      // Test query performance
      await this.prisma.transaction.count({
        where: { householdId },
      });

      const queryTime = Date.now() - startTime;

      // Get cache hit rate (simplified)
      const cacheHitRate = await this.estimateCacheHitRate();

      // Get data freshness
      const dataFreshness = await this.getDataFreshness(householdId);

      // Get record count
      const recordsProcessed = await this.getRecordCount(householdId);

      return {
        queryExecutionTime: queryTime,
        cacheHitRate,
        dataFreshness,
        recordsProcessed,
      };
    } catch (error) {
      this.logger.error(`Failed to get performance metrics for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Validate analytics filters
   */
  validateFilters(filters: AnalyticsFilters): void {
    if (!filters.dateRange) {
      throw new BadRequestException('Date range is required');
    }

    if (filters.dateRange.startDate >= filters.dateRange.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const maxDateRange = 365 * 24 * 60 * 60 * 1000; // 1 year
    const dateRangeLength = filters.dateRange.endDate.getTime() - filters.dateRange.startDate.getTime();
    
    if (dateRangeLength > maxDateRange) {
      throw new BadRequestException('Date range cannot exceed 1 year');
    }

    if (filters.amountRange && filters.amountRange.min > filters.amountRange.max) {
      throw new BadRequestException('Amount range minimum cannot be greater than maximum');
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(startTime: number): PerformanceMetrics {
    return {
      queryExecutionTime: Date.now() - startTime,
      cacheHitRate: 0.85, // Placeholder
      dataFreshness: new Date(),
      recordsProcessed: 0, // Would be calculated based on actual queries
    };
  }

  /**
   * Estimate cache hit rate
   */
  private async estimateCacheHitRate(): Promise<number> {
    // This is a simplified implementation
    // In production, you'd track actual cache hits/misses
    return 0.75; // 75% hit rate
  }

  /**
   * Get data freshness timestamp
   */
  private async getDataFreshness(householdId: string): Promise<Date> {
    try {
      const latestTransaction = await this.prisma.transaction.findFirst({
        where: { householdId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      return latestTransaction?.createdAt || new Date();
    } catch {
      return new Date();
    }
  }

  /**
   * Get total record count for household
   */
  private async getRecordCount(householdId: string): Promise<number> {
    try {
      const [transactionCount, accountCount] = await Promise.all([
        this.prisma.transaction.count({ where: { householdId } }),
        this.prisma.account.count({ where: { householdId } }),
      ]);

      return transactionCount + accountCount;
    } catch {
      return 0;
    }
  }
}
