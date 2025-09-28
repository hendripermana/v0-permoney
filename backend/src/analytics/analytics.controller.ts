import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import {
  AnalyticsFiltersDto,
  SpendingAnalyticsDto,
  CashflowAnalyticsDto,
  NetWorthAnalyticsDto,
  CategoryAnalyticsDto,
  TrendAnalyticsDto,
  ExportReportDto,
  RefreshMaterializedViewDto,
  BulkRefreshDto,
} from './dto/analytics.dto';
import {
  SpendingAnalytics,
  CashflowAnalysis,
  NetWorthAnalysis,
  CategoryBreakdown,
  TrendAnalysis,
  FinancialReport,
  MaterializedViewRefreshStatus,
  PerformanceMetrics,
  ReportType,
} from './types/analytics.types';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get comprehensive dashboard analytics
   */
  @Post(':householdId/dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboardAnalytics(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() filters: AnalyticsFiltersDto
  ): Promise<{
    spending: SpendingAnalytics;
    cashflow: CashflowAnalysis;
    netWorth: NetWorthAnalysis;
    topCategories: CategoryBreakdown[];
    performance: PerformanceMetrics;
  }> {
    this.analyticsService.validateFilters(this.convertFilters(filters));
    return this.analyticsService.getDashboardAnalytics(
      householdId,
      this.convertFilters(filters)
    );
  }

  /**
   * Get spending analytics
   */
  @Post(':householdId/spending')
  @HttpCode(HttpStatus.OK)
  async getSpendingAnalytics(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: SpendingAnalyticsDto
  ): Promise<SpendingAnalytics> {
    this.analyticsService.validateFilters(this.convertFilters(dto));
    return this.analyticsService.getSpendingAnalytics(
      householdId,
      this.convertFilters(dto),
      {
        includeComparisons: dto.includeComparisons,
        includeTrends: dto.includeTrends,
        groupBy: dto.groupBy,
      }
    );
  }

  /**
   * Get cashflow analysis
   */
  @Post(':householdId/cashflow')
  @HttpCode(HttpStatus.OK)
  async getCashflowAnalysis(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CashflowAnalyticsDto
  ): Promise<CashflowAnalysis> {
    this.analyticsService.validateFilters(this.convertFilters(dto));
    return this.analyticsService.getCashflowAnalysis(
      householdId,
      this.convertFilters(dto),
      {
        includeProjections: dto.includeProjections,
        projectionMonths: dto.projectionMonths,
      }
    );
  }

  /**
   * Get net worth analysis
   */
  @Post(':householdId/net-worth')
  @HttpCode(HttpStatus.OK)
  async getNetWorthAnalysis(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: NetWorthAnalyticsDto
  ): Promise<NetWorthAnalysis> {
    this.analyticsService.validateFilters(this.convertFilters(dto));
    return this.analyticsService.getNetWorthAnalysis(
      householdId,
      this.convertFilters(dto),
      {
        includeProjections: dto.includeProjections,
        includeBreakdown: dto.includeBreakdown,
        interval: dto.interval,
      }
    );
  }

  /**
   * Get category breakdown
   */
  @Post(':householdId/categories')
  @HttpCode(HttpStatus.OK)
  async getCategoryBreakdown(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CategoryAnalyticsDto
  ): Promise<CategoryBreakdown[]> {
    this.analyticsService.validateFilters(this.convertFilters(dto));
    return this.analyticsService.getCategoryBreakdown(
      householdId,
      this.convertFilters(dto),
      {
        includeSubcategories: dto.includeSubcategories,
        includeTrends: dto.includeTrends,
        limit: dto.limit,
      }
    );
  }

  /**
   * Get trend analysis
   */
  @Post(':householdId/trends')
  @HttpCode(HttpStatus.OK)
  async getTrendAnalysis(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: TrendAnalyticsDto
  ): Promise<TrendAnalysis> {
    this.analyticsService.validateFilters(this.convertFilters(dto));
    return this.analyticsService.getTrendAnalysis(
      householdId,
      this.convertFilters(dto),
      {
        period: dto.period,
        trendType: dto.trendType,
        includeSeasonality: dto.includeSeasonality,
        includeForecast: dto.includeForecast,
        forecastPeriods: dto.forecastPeriods,
      }
    );
  }

  /**
   * Generate and export report
   */
  @Post(':householdId/reports/generate')
  @HttpCode(HttpStatus.CREATED)
  async generateReport(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: ExportReportDto
  ): Promise<FinancialReport> {
    this.analyticsService.validateFilters(this.convertFilters(dto.filters));
    return this.analyticsService.generateReport(
      householdId,
      dto.reportType,
      this.convertFilters(dto.filters),
      {
        format: dto.format,
        includeCharts: dto.includeCharts,
        includeDetails: dto.includeDetails,
        locale: dto.locale,
      },
      dto.title,
      dto.description
    );
  }

  /**
   * Get existing report
   */
  @Get('reports/:reportId')
  async getReport(
    @Param('reportId') reportId: string
  ): Promise<FinancialReport> {
    const report = await this.analyticsService.getReport(reportId);
    if (!report) {
      throw new BadRequestException(`Report ${reportId} not found`);
    }
    return report;
  }

  /**
   * List reports for household
   */
  @Get(':householdId/reports')
  async listReports(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query('reportType') reportType?: ReportType,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ): Promise<FinancialReport[]> {
    return this.analyticsService.listReports(householdId, reportType, limit);
  }

  /**
   * Delete report
   */
  @Delete('reports/:reportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReport(
    @Param('reportId') reportId: string
  ): Promise<void> {
    return this.analyticsService.deleteReport(reportId);
  }

  /**
   * Get performance metrics
   */
  @Get(':householdId/performance')
  async getPerformanceMetrics(
    @Param('householdId', ParseUUIDPipe) householdId: string
  ): Promise<PerformanceMetrics> {
    return this.analyticsService.getPerformanceMetrics(householdId);
  }

  /**
   * Initialize analytics infrastructure
   */
  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  async initializeAnalytics(): Promise<{ message: string }> {
    await this.analyticsService.initializeAnalytics();
    return { message: 'Analytics infrastructure initialized successfully' };
  }

  /**
   * Refresh materialized views
   */
  @Post('materialized-views/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshMaterializedViews(
    @Body() dto: BulkRefreshDto
  ): Promise<MaterializedViewRefreshStatus[]> {
    return this.analyticsService.refreshMaterializedViews(dto.viewNames, dto.force);
  }

  /**
   * Refresh specific materialized view
   */
  @Post('materialized-views/:viewName/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshMaterializedView(
    @Param('viewName') viewName: string,
    @Body() dto: RefreshMaterializedViewDto
  ): Promise<MaterializedViewRefreshStatus> {
    const results = await this.analyticsService.refreshMaterializedViews([viewName], dto.force);
    return results[0];
  }

  /**
   * Get materialized view status
   */
  @Get('materialized-views/status')
  async getMaterializedViewStatus(): Promise<MaterializedViewRefreshStatus[]> {
    return this.analyticsService.getMaterializedViewStatus();
  }

  /**
   * Convert DTO filters to internal format
   */
  private convertFilters(dto: AnalyticsFiltersDto): {
    dateRange: { startDate: Date; endDate: Date };
    categoryIds?: string[];
    accountIds?: string[];
    merchantIds?: string[];
    tags?: string[];
    amountRange?: { min: number; max: number };
    currency?: string;
    includeTransfers?: boolean;
  } {
    return {
      dateRange: {
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      categoryIds: dto.categoryIds,
      accountIds: dto.accountIds,
      merchantIds: dto.merchantIds,
      tags: dto.tags,
      amountRange: dto.amountRange,
      currency: dto.currency,
      includeTransfers: dto.includeTransfers,
    };
  }
}
