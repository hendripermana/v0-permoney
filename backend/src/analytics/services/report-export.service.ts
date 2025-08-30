import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  FinancialReport,
  ReportType,
  ExportFormat,
  ExportOptions,
  AnalyticsFilters,
} from '../types/analytics.types';
import { SpendingAnalyticsService } from './spending-analytics.service';
import { CashflowAnalyticsService } from './cashflow-analytics.service';
import { NetWorthAnalyticsService } from './net-worth-analytics.service';
import { CategoryAnalyticsService } from './category-analytics.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ReportExportService {
  private readonly logger = new Logger(ReportExportService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly EXPORT_DIR = process.env.EXPORT_DIR || './exports';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly spendingAnalyticsService: SpendingAnalyticsService,
    private readonly cashflowAnalyticsService: CashflowAnalyticsService,
    private readonly netWorthAnalyticsService: NetWorthAnalyticsService,
    private readonly categoryAnalyticsService: CategoryAnalyticsService,
  ) {
    this.ensureExportDirectory();
  }

  /**
   * Generate and export a financial report
   */
  async generateReport(
    householdId: string,
    reportType: ReportType,
    filters: AnalyticsFilters,
    exportOptions: ExportOptions,
    title?: string,
    description?: string
  ): Promise<FinancialReport> {
    this.logger.log(`Generating ${reportType} report for household ${householdId}`);

    try {
      // Generate report data based on type
      const reportData = await this.generateReportData(householdId, reportType, filters, exportOptions);

      // Create report record
      const report: FinancialReport = {
        id: this.generateReportId(),
        householdId,
        reportType,
        title: title || this.getDefaultTitle(reportType),
        description: description || this.getDefaultDescription(reportType, filters),
        period: filters.dateRange,
        data: reportData,
        format: exportOptions.format,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      // Export to file
      const fileUrl = await this.exportToFile(report, exportOptions);
      report.fileUrl = fileUrl;

      // Store report metadata (optional - could be stored in database)
      await this.storeReportMetadata(report);

      this.logger.log(`Successfully generated ${reportType} report: ${report.id}`);
      return report;

    } catch (error) {
      this.logger.error(`Failed to generate ${reportType} report for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Get existing report by ID
   */
  async getReport(reportId: string): Promise<FinancialReport | null> {
    try {
      const cached = await this.cacheService.get(`report:${reportId}`);
      if (cached) {
        return cached;
      }

      // In a real implementation, this would fetch from database
      // For now, return null if not in cache
      return null;
    } catch (error) {
      this.logger.error(`Failed to get report ${reportId}:`, error);
      return null;
    }
  }

  /**
   * List reports for a household
   */
  async listReports(
    householdId: string,
    reportType?: ReportType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _limit = 20
  ): Promise<FinancialReport[]> {
    try {
      // In a real implementation, this would query the database
      // For now, return empty array
      // Note: reportType parameter would be used in actual implementation
      this.logger.log(`Listing reports for household ${householdId}${reportType ? ` of type ${reportType}` : ''}`);
      return [];
    } catch (error) {
      this.logger.error(`Failed to list reports for household ${householdId}:`, error);
      return [];
    }
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      const report = await this.getReport(reportId);
      if (!report) {
        throw new BadRequestException(`Report ${reportId} not found`);
      }

      // Delete file if exists
      if (report.fileUrl) {
        const filePath = path.join(this.EXPORT_DIR, path.basename(report.fileUrl));
        try {
          await fs.unlink(filePath);
        } catch (error) {
          this.logger.warn(`Failed to delete report file ${filePath}:`, error);
        }
      }

      // Remove from cache
      await this.cacheService.delete(`report:${reportId}`);

      this.logger.log(`Deleted report ${reportId}`);
    } catch (error) {
      this.logger.error(`Failed to delete report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Generate report data based on type
   */
  private async generateReportData(
    householdId: string,
    reportType: ReportType,
    filters: AnalyticsFilters,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _exportOptions: ExportOptions
  ): Promise<Record<string, unknown>> {
    switch (reportType) {
      case ReportType.SPENDING_SUMMARY:
        return this.spendingAnalyticsService.getSpendingAnalytics(householdId, filters, {
          includeComparisons: true,
          includeTrends: true,
        });

      case ReportType.CASHFLOW_ANALYSIS:
        return this.cashflowAnalyticsService.getCashflowAnalysis(householdId, filters, {
          includeProjections: true,
        });

      case ReportType.NET_WORTH_REPORT:
        return this.netWorthAnalyticsService.getNetWorthAnalysis(householdId, filters, {
          includeProjections: true,
          includeBreakdown: true,
        });

      case ReportType.CATEGORY_BREAKDOWN:
        return this.categoryAnalyticsService.getCategoryBreakdown(householdId, filters, {
          includeSubcategories: true,
          includeTrends: true,
        });

      case ReportType.MONTHLY_SUMMARY:
        return this.generateMonthlySummary(householdId, filters);

      case ReportType.ANNUAL_SUMMARY:
        return this.generateAnnualSummary(householdId, filters);

      default:
        throw new BadRequestException(`Unsupported report type: ${reportType}`);
    }
  }

  /**
   * Generate monthly summary report
   */
  private async generateMonthlySummary(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<Record<string, unknown>> {
    const [spending, cashflow, categories] = await Promise.all([
      this.spendingAnalyticsService.getSpendingAnalytics(householdId, filters, {
        includeComparisons: true,
      }),
      this.cashflowAnalyticsService.getCashflowAnalysis(householdId, filters),
      this.categoryAnalyticsService.getCategoryBreakdown(householdId, filters, {
        limit: 10,
      }),
    ]);

    return {
      period: filters.dateRange,
      spending,
      cashflow,
      topCategories: categories,
      summary: {
        totalSpent: spending.totalSpent,
        totalIncome: spending.totalIncome,
        netCashflow: spending.netCashflow,
        savingsRate: spending.totalIncome > 0 
          ? ((spending.totalIncome - spending.totalSpent) / spending.totalIncome) * 100 
          : 0,
      },
    };
  }

  /**
   * Generate annual summary report
   */
  private async generateAnnualSummary(
    householdId: string,
    filters: AnalyticsFilters
  ): Promise<Record<string, unknown>> {
    const [spending, netWorth, categories] = await Promise.all([
      this.spendingAnalyticsService.getSpendingAnalytics(householdId, filters, {
        includeComparisons: true,
        includeTrends: true,
        groupBy: 'month',
      }),
      this.netWorthAnalyticsService.getNetWorthAnalysis(householdId, filters, {
        includeBreakdown: true,
        interval: 'monthly',
      }),
      this.categoryAnalyticsService.getCategoryBreakdown(householdId, filters, {
        includeSubcategories: true,
        includeTrends: true,
      }),
    ]);

    return {
      period: filters.dateRange,
      spending,
      netWorth,
      categories,
      yearOverYear: spending.comparisons,
      highlights: this.generateYearHighlights(spending, netWorth, categories),
    };
  }

  /**
   * Generate year highlights
   */
  private generateYearHighlights(
    spending: Record<string, unknown>, 
    netWorth: Record<string, unknown>, 
    categories: Record<string, unknown>[]
  ): Record<string, unknown> {
    return {
      totalSpent: spending.totalSpent,
      totalIncome: spending.totalIncome,
      netWorthGrowth: netWorth.currentNetWorth - (netWorth.history[0]?.netWorth || 0),
      topSpendingCategory: categories[0]?.categoryName || 'N/A',
      averageMonthlySpending: spending.totalSpent / 12,
      savingsRate: spending.totalIncome > 0 
        ? ((spending.totalIncome - spending.totalSpent) / spending.totalIncome) * 100 
        : 0,
    };
  }

  /**
   * Export report to file
   */
  private async exportToFile(
    report: FinancialReport,
    exportOptions: ExportOptions
  ): Promise<string> {
    const fileName = `${report.id}.${exportOptions.format.toLowerCase()}`;
    const filePath = path.join(this.EXPORT_DIR, fileName);

    switch (exportOptions.format) {
      case ExportFormat.JSON:
        await this.exportToJSON(report, filePath);
        break;
      case ExportFormat.CSV:
        await this.exportToCSV(report, filePath);
        break;
      case ExportFormat.PDF:
        await this.exportToPDF(report, filePath, exportOptions);
        break;
      case ExportFormat.EXCEL:
        await this.exportToExcel(report, filePath);
        break;
      default:
        throw new BadRequestException(`Unsupported export format: ${exportOptions.format}`);
    }

    return `/exports/${fileName}`;
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(report: FinancialReport, filePath: string): Promise<void> {
    const jsonData = JSON.stringify(report, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf8');
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(report: FinancialReport, filePath: string): Promise<void> {
    let csvContent = '';

    // Add report header
    csvContent += `Report Type,${report.reportType}\n`;
    csvContent += `Title,${report.title}\n`;
    csvContent += `Period,"${report.period.startDate.toISOString().split('T')[0]} to ${report.period.endDate.toISOString().split('T')[0]}"\n`;
    csvContent += `Generated,${report.createdAt.toISOString()}\n\n`;

    // Add data based on report type
    if (report.reportType === ReportType.SPENDING_SUMMARY) {
      csvContent += this.generateSpendingCSV(report.data);
    } else if (report.reportType === ReportType.CATEGORY_BREAKDOWN) {
      csvContent += this.generateCategoryCSV(report.data);
    } else {
      // Generic data export
      csvContent += 'Data\n';
      csvContent += JSON.stringify(report.data);
    }

    await fs.writeFile(filePath, csvContent, 'utf8');
  }

  /**
   * Generate spending CSV content
   */
  private generateSpendingCSV(data: Record<string, unknown>): string {
    let csv = 'Summary\n';
    csv += 'Metric,Value\n';
    csv += `Total Spent,${data.totalSpent}\n`;
    csv += `Total Income,${data.totalIncome}\n`;
    csv += `Net Cashflow,${data.netCashflow}\n`;
    csv += `Average Daily,${data.averageDaily}\n\n`;

    csv += 'Top Categories\n';
    csv += 'Category,Amount,Percentage,Transactions\n';
    for (const category of data.topCategories) {
      csv += `${category.categoryName},${category.totalAmount},${category.percentage.toFixed(2)}%,${category.transactionCount}\n`;
    }

    return csv;
  }

  /**
   * Generate category CSV content
   */
  private generateCategoryCSV(data: Record<string, unknown>[]): string {
    let csv = 'Category Breakdown\n';
    csv += 'Category,Amount,Percentage,Transactions,Average Amount,Trend\n';
    
    for (const category of data) {
      csv += `${category.categoryName},${category.totalAmount},${category.percentage.toFixed(2)}%,${category.transactionCount},${category.averageAmount},${category.trend.direction}\n`;
    }

    return csv;
  }

  /**
   * Export to PDF format (simplified - would use a proper PDF library in production)
   */
  private async exportToPDF(
    report: FinancialReport,
    filePath: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _exportOptions: ExportOptions
  ): Promise<void> {
    // This is a placeholder - in production, you'd use a library like puppeteer or pdfkit
    const htmlContent = this.generateHTMLReport(report, exportOptions);
    
    // For now, just save as HTML
    const htmlPath = filePath.replace('.pdf', '.html');
    await fs.writeFile(htmlPath, htmlContent, 'utf8');
    
    // In production, convert HTML to PDF here
    this.logger.warn('PDF export not fully implemented - saved as HTML instead');
  }

  /**
   * Generate HTML report content
   */
  private generateHTMLReport(
    report: FinancialReport, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _exportOptions: ExportOptions
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${report.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .data-table th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.title}</h1>
        <p><strong>Period:</strong> ${report.period.startDate.toISOString().split('T')[0]} to ${report.period.endDate.toISOString().split('T')[0]}</p>
        <p><strong>Generated:</strong> ${report.createdAt.toISOString()}</p>
    </div>
    
    <div class="section">
        <h2>Report Data</h2>
        <pre>${JSON.stringify(report.data, null, 2)}</pre>
    </div>
</body>
</html>
    `;
  }

  /**
   * Export to Excel format (placeholder)
   */
  private async exportToExcel(report: FinancialReport, filePath: string): Promise<void> {
    // This is a placeholder - in production, you'd use a library like exceljs
    const csvPath = filePath.replace('.excel', '.csv');
    await this.exportToCSV(report, csvPath);
    this.logger.warn('Excel export not fully implemented - saved as CSV instead');
  }

  /**
   * Store report metadata
   */
  private async storeReportMetadata(report: FinancialReport): Promise<void> {
    // Store in cache for now - in production, store in database
    await this.cacheService.set(`report:${report.id}`, report, this.CACHE_TTL);
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default title for report type
   */
  private getDefaultTitle(reportType: ReportType): string {
    switch (reportType) {
      case ReportType.SPENDING_SUMMARY:
        return 'Spending Summary Report';
      case ReportType.CASHFLOW_ANALYSIS:
        return 'Cashflow Analysis Report';
      case ReportType.NET_WORTH_REPORT:
        return 'Net Worth Report';
      case ReportType.CATEGORY_BREAKDOWN:
        return 'Category Breakdown Report';
      case ReportType.MONTHLY_SUMMARY:
        return 'Monthly Summary Report';
      case ReportType.ANNUAL_SUMMARY:
        return 'Annual Summary Report';
      default:
        return 'Financial Report';
    }
  }

  /**
   * Get default description for report type
   */
  private getDefaultDescription(reportType: ReportType, filters: AnalyticsFilters): string {
    const period = `${filters.dateRange.startDate.toISOString().split('T')[0]} to ${filters.dateRange.endDate.toISOString().split('T')[0]}`;
    
    switch (reportType) {
      case ReportType.SPENDING_SUMMARY:
        return `Comprehensive spending analysis for the period ${period}`;
      case ReportType.CASHFLOW_ANALYSIS:
        return `Detailed cashflow analysis and projections for the period ${period}`;
      case ReportType.NET_WORTH_REPORT:
        return `Net worth tracking and asset breakdown for the period ${period}`;
      case ReportType.CATEGORY_BREAKDOWN:
        return `Category-wise spending breakdown and trends for the period ${period}`;
      case ReportType.MONTHLY_SUMMARY:
        return `Monthly financial summary for the period ${period}`;
      case ReportType.ANNUAL_SUMMARY:
        return `Annual financial summary and highlights for the period ${period}`;
      default:
        return `Financial report for the period ${period}`;
    }
  }

  /**
   * Ensure export directory exists
   */
  private async ensureExportDirectory(): Promise<void> {
    try {
      await fs.access(this.EXPORT_DIR);
    } catch {
      await fs.mkdir(this.EXPORT_DIR, { recursive: true });
      this.logger.log(`Created export directory: ${this.EXPORT_DIR}`);
    }
  }
}
