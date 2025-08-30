import { Injectable, Logger } from '@nestjs/common';
import { ZakatCalculationService } from './services/zakat-calculation.service';
import { ZakatReminderService } from './services/zakat-reminder.service';
import { ShariaComplianceService } from './services/sharia-compliance.service';
import { IslamicReportingService } from './services/islamic-reporting.service';
import { 
  ZakatCalculation, 
  ZakatReminder, 
  ShariaCompliantAccount, 
  IslamicFinanceReport 
} from './types/islamic-finance.types';
import { 
  CalculateZakatDto, 
  CreateZakatReminderDto, 
  UpdateShariaComplianceDto, 
  GenerateIslamicReportDto,
  RecordZakatPaymentDto 
} from './dto/zakat-calculation.dto';

@Injectable()
export class IslamicFinanceService {
  private readonly logger = new Logger(IslamicFinanceService.name);

  constructor(
    private readonly zakatCalculationService: ZakatCalculationService,
    private readonly zakatReminderService: ZakatReminderService,
    private readonly shariaComplianceService: ShariaComplianceService,
    private readonly islamicReportingService: IslamicReportingService,
  ) {}

  // Zakat Calculation Methods
  async calculateZakat(dto: CalculateZakatDto): Promise<ZakatCalculation> {
    this.logger.log(`Calculating zakat for household: ${dto.householdId}`);
    const calculation = await this.zakatCalculationService.calculateZakat(dto);
    
    // Automatically create reminders after calculation
    await this.zakatReminderService.createAutomaticReminders(dto.householdId);
    
    return calculation;
  }

  async getZakatCalculations(householdId: string, limit?: number): Promise<ZakatCalculation[]> {
    return this.zakatCalculationService.getZakatCalculations(householdId, limit);
  }

  async getLatestZakatCalculation(householdId: string): Promise<ZakatCalculation | null> {
    return this.zakatCalculationService.getLatestZakatCalculation(householdId);
  }

  async recordZakatPayment(dto: RecordZakatPaymentDto): Promise<void> {
    return this.zakatCalculationService.recordZakatPayment(dto);
  }

  async getZakatPayments(householdId: string): Promise<any[]> {
    return this.zakatCalculationService.getZakatPayments(householdId);
  }

  // Zakat Reminder Methods
  async createZakatReminder(dto: CreateZakatReminderDto): Promise<ZakatReminder> {
    return this.zakatReminderService.createReminder(dto);
  }

  async getZakatReminders(householdId: string, activeOnly?: boolean): Promise<ZakatReminder[]> {
    return this.zakatReminderService.getReminders(householdId, activeOnly);
  }

  async getUpcomingZakatReminders(householdId: string, daysAhead?: number): Promise<ZakatReminder[]> {
    return this.zakatReminderService.getUpcomingReminders(householdId, daysAhead);
  }

  async updateZakatReminder(id: string, dto: any): Promise<ZakatReminder> {
    return this.zakatReminderService.updateReminder(id, dto);
  }

  async deleteZakatReminder(id: string): Promise<void> {
    return this.zakatReminderService.deleteReminder(id);
  }

  // Sharia Compliance Methods
  async updateAccountCompliance(dto: UpdateShariaComplianceDto, reviewedBy?: string): Promise<ShariaCompliantAccount> {
    return this.shariaComplianceService.updateAccountCompliance(dto, reviewedBy);
  }

  async getAccountCompliance(accountId: string): Promise<ShariaCompliantAccount | null> {
    return this.shariaComplianceService.getAccountCompliance(accountId);
  }

  async getHouseholdCompliance(householdId: string): Promise<ShariaCompliantAccount[]> {
    return this.shariaComplianceService.getHouseholdCompliance(householdId);
  }

  async getComplianceSummary(householdId: string): Promise<any> {
    return this.shariaComplianceService.getComplianceSummary(householdId);
  }

  async getAccountsDueForReview(householdId?: string): Promise<ShariaCompliantAccount[]> {
    return this.shariaComplianceService.getAccountsDueForReview(householdId);
  }

  async autoAssessAccountCompliance(accountId: string): Promise<any> {
    return this.shariaComplianceService.autoAssessAccountCompliance(accountId);
  }

  async bulkAssessCompliance(householdId: string): Promise<void> {
    return this.shariaComplianceService.bulkAssessCompliance(householdId);
  }

  // Islamic Reporting Methods
  async generateIslamicReport(dto: GenerateIslamicReportDto, generatedBy?: string): Promise<IslamicFinanceReport> {
    return this.islamicReportingService.generateReport(dto, generatedBy);
  }

  async getIslamicReports(householdId: string, reportType?: any, limit?: number): Promise<IslamicFinanceReport[]> {
    return this.islamicReportingService.getReports(householdId, reportType, limit);
  }

  async getLatestIslamicReport(householdId: string, reportType: any): Promise<IslamicFinanceReport | null> {
    return this.islamicReportingService.getLatestReport(householdId, reportType);
  }

  // Comprehensive Islamic Finance Dashboard
  async getIslamicFinanceDashboard(householdId: string): Promise<{
    zakatSummary: ZakatCalculation | null;
    complianceSummary: any;
    upcomingReminders: ZakatReminder[];
    recentReports: IslamicFinanceReport[];
  }> {
    this.logger.log(`Getting Islamic finance dashboard for household: ${householdId}`);

    const [
      zakatSummary,
      complianceSummary,
      upcomingReminders,
      recentReports
    ] = await Promise.all([
      this.getLatestZakatCalculation(householdId),
      this.getComplianceSummary(householdId),
      this.getUpcomingZakatReminders(householdId, 30),
      this.getIslamicReports(householdId, undefined, 5)
    ]);

    return {
      zakatSummary,
      complianceSummary,
      upcomingReminders,
      recentReports
    };
  }

  // Utility method for Islamic finance onboarding
  async initializeIslamicFinance(householdId: string): Promise<void> {
    this.logger.log(`Initializing Islamic finance features for household: ${householdId}`);

    try {
      // Auto-assess compliance for all accounts
      await this.bulkAssessCompliance(householdId);

      // Calculate initial zakat if there are eligible assets
      const calculation = await this.calculateZakat({ householdId });

      this.logger.log(`Islamic finance initialization completed for household: ${householdId}`);
    } catch (error) {
      this.logger.error(`Failed to initialize Islamic finance for household ${householdId}:`, error);
      throw error;
    }
  }
}
