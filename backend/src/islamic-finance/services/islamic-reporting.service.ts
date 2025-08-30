import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  IslamicFinanceReport, 
  IslamicReportType, 
  IslamicReportData,
  ZakatSummary,
  ShariaAssetSummary,
  IslamicDebtSummary,
  HalaalIncomeBreakdown,
  MurabahahContract,
  Money
} from '../types/islamic-finance.types';
import { GenerateIslamicReportDto } from '../dto/zakat-calculation.dto';

@Injectable()
export class IslamicReportingService {
  private readonly logger = new Logger(IslamicReportingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateReport(dto: GenerateIslamicReportDto, generatedBy?: string): Promise<IslamicFinanceReport> {
    this.logger.log(`Generating Islamic finance report: ${dto.reportType} for household: ${dto.householdId}`);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    let reportData: IslamicReportData = {};

    switch (dto.reportType) {
      case IslamicReportType.ZAKAT_CALCULATION:
        reportData.zakatSummary = await this.generateZakatSummary(dto.householdId, startDate, endDate);
        break;
      case IslamicReportType.SHARIA_COMPLIANCE:
        reportData.shariaCompliantAssets = await this.generateShariaAssetSummary(dto.householdId);
        break;
      case IslamicReportType.ISLAMIC_DEBT_SUMMARY:
        reportData.islamicDebtSummary = await this.generateIslamicDebtSummary(dto.householdId);
        break;
      case IslamicReportType.HALAAL_INCOME_ANALYSIS:
        reportData.halaalIncomeBreakdown = await this.generateHalaalIncomeBreakdown(dto.householdId, startDate, endDate);
        break;
      case IslamicReportType.COMPREHENSIVE:
        reportData = {
          zakatSummary: await this.generateZakatSummary(dto.householdId, startDate, endDate),
          shariaCompliantAssets: await this.generateShariaAssetSummary(dto.householdId),
          islamicDebtSummary: await this.generateIslamicDebtSummary(dto.householdId),
          halaalIncomeBreakdown: await this.generateHalaalIncomeBreakdown(dto.householdId, startDate, endDate)
        };
        break;
    }

    const report = await this.prisma.islamicFinanceReport.create({
      data: {
        householdId: dto.householdId,
        reportType: dto.reportType,
        periodStartDate: startDate,
        periodEndDate: endDate,
        periodType: dto.periodType || 'MONTHLY',
        reportData: reportData as any,
        generatedBy
      }
    });

    return this.mapToIslamicFinanceReport(report);
  }

  async getReports(householdId: string, reportType?: IslamicReportType, limit = 10): Promise<IslamicFinanceReport[]> {
    const reports = await this.prisma.islamicFinanceReport.findMany({
      where: {
        householdId,
        ...(reportType && { reportType })
      },
      orderBy: { generatedAt: 'desc' },
      take: limit
    });

    return reports.map(report => this.mapToIslamicFinanceReport(report));
  }

  async getLatestReport(householdId: string, reportType: IslamicReportType): Promise<IslamicFinanceReport | null> {
    const report = await this.prisma.islamicFinanceReport.findFirst({
      where: { householdId, reportType },
      orderBy: { generatedAt: 'desc' }
    });

    return report ? this.mapToIslamicFinanceReport(report) : null;
  }

  private async generateZakatSummary(householdId: string, startDate: Date, endDate: Date): Promise<ZakatSummary> {
    // Get latest zakat calculation
    const latestCalculation = await this.prisma.zakatCalculation.findFirst({
      where: { 
        householdId,
        calculationDate: { gte: startDate, lte: endDate }
      },
      orderBy: { calculationDate: 'desc' },
      include: { assetBreakdown: true }
    });

    // Get zakat payments in the period
    const zakatPayments = await this.prisma.zakatPayment.findMany({
      where: {
        householdId,
        paymentDate: { gte: startDate, lte: endDate }
      },
      orderBy: { paymentDate: 'desc' }
    });

    const household = await this.prisma.household.findUnique({
      where: { id: householdId }
    });

    const baseCurrency = household?.baseCurrency || 'IDR';

    const zakatSummary: ZakatSummary = {
      totalZakatableAssets: latestCalculation ? {
        amount: Number(latestCalculation.totalZakatableAssetsCents) / 100,
        currency: latestCalculation.currency
      } : { amount: 0, currency: baseCurrency },
      currentNisabThreshold: latestCalculation ? {
        amount: Number(latestCalculation.nisabThresholdCents) / 100,
        currency: latestCalculation.currency
      } : { amount: 0, currency: baseCurrency },
      zakatDue: latestCalculation ? {
        amount: Number(latestCalculation.zakatAmountCents) / 100,
        currency: latestCalculation.currency
      } : { amount: 0, currency: baseCurrency },
      lastZakatPayment: zakatPayments.length > 0 ? {
        id: zakatPayments[0].id,
        amount: {
          amount: Number(zakatPayments[0].amountCents) / 100,
          currency: zakatPayments[0].currency
        },
        paymentDate: zakatPayments[0].paymentDate,
        hijriDate: zakatPayments[0].hijriDate,
        transactionId: zakatPayments[0].transactionId,
        notes: zakatPayments[0].notes
      } : undefined,
      nextZakatDueDate: latestCalculation?.nextCalculationDate || new Date(),
      haulStatus: latestCalculation?.assetBreakdown.map(asset => ({
        assetType: asset.assetType,
        haulStartDate: asset.haulStartDate || new Date(),
        haulCompletionDate: this.calculateHaulCompletionDate(asset.haulStartDate || new Date()),
        isHaulComplete: asset.haulCompleted,
        daysRemaining: asset.haulCompleted ? 0 : this.calculateDaysRemaining(asset.haulStartDate || new Date())
      })) || []
    };

    return zakatSummary;
  }

  private async generateShariaAssetSummary(householdId: string): Promise<ShariaAssetSummary> {
    const accounts = await this.prisma.account.findMany({
      where: { householdId, isActive: true },
      include: { shariaCompliance: true }
    });

    let compliantAssets = 0;
    let nonCompliantAssets = 0;
    let underReviewAssets = 0;

    accounts.forEach(account => {
      const balance = Number(account.balanceCents) / 100;
      const status = account.shariaCompliance?.complianceStatus;

      switch (status) {
        case 'COMPLIANT':
          compliantAssets += balance;
          break;
        case 'NON_COMPLIANT':
          nonCompliantAssets += balance;
          break;
        default:
          underReviewAssets += balance;
      }
    });

    const totalAssets = compliantAssets + nonCompliantAssets + underReviewAssets;
    const compliancePercentage = totalAssets > 0 ? Math.round((compliantAssets / totalAssets) * 100) : 0;

    const household = await this.prisma.household.findUnique({
      where: { id: householdId }
    });
    const baseCurrency = household?.baseCurrency || 'IDR';

    return {
      compliantAssets: { amount: compliantAssets, currency: baseCurrency },
      nonCompliantAssets: { amount: nonCompliantAssets, currency: baseCurrency },
      underReviewAssets: { amount: underReviewAssets, currency: baseCurrency },
      compliancePercentage
    };
  }

  private async generateIslamicDebtSummary(householdId: string): Promise<IslamicDebtSummary> {
    const islamicDebts = await this.prisma.debt.findMany({
      where: { 
        householdId, 
        type: 'ISLAMIC',
        isActive: true 
      }
    });

    const household = await this.prisma.household.findUnique({
      where: { id: householdId }
    });
    const baseCurrency = household?.baseCurrency || 'IDR';

    const murabahahContracts: MurabahahContract[] = islamicDebts.map(debt => {
      const principalAmount = Number(debt.principalAmountCents) / 100;
      const currentBalance = Number(debt.currentBalanceCents) / 100;
      const marginRate = Number(debt.marginRate) || 0;
      const marginAmount = principalAmount * marginRate;
      const totalAmount = principalAmount + marginAmount;

      // Calculate monthly payment (simplified)
      const monthsRemaining = debt.maturityDate ? 
        Math.ceil((debt.maturityDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)) : 12;
      const monthlyPayment = monthsRemaining > 0 ? currentBalance / monthsRemaining : 0;

      return {
        debtId: debt.id,
        contractName: debt.name,
        principalAmount: { amount: principalAmount, currency: debt.currency },
        marginAmount: { amount: marginAmount, currency: debt.currency },
        totalAmount: { amount: totalAmount, currency: debt.currency },
        remainingBalance: { amount: currentBalance, currency: debt.currency },
        marginRate,
        startDate: debt.startDate,
        maturityDate: debt.maturityDate || new Date(),
        monthlyPayment: { amount: monthlyPayment, currency: debt.currency }
      };
    });

    const totalIslamicDebt = islamicDebts.reduce((sum, debt) => sum + Number(debt.currentBalanceCents) / 100, 0);
    const totalMarginPaid = islamicDebts.reduce((sum, debt) => {
      const principal = Number(debt.principalAmountCents) / 100;
      const current = Number(debt.currentBalanceCents) / 100;
      const marginRate = Number(debt.marginRate) || 0;
      return sum + (principal * marginRate - (current - principal));
    }, 0);

    const averageMarginRate = islamicDebts.length > 0 ? 
      islamicDebts.reduce((sum, debt) => sum + (Number(debt.marginRate) || 0), 0) / islamicDebts.length : 0;

    return {
      murabahahContracts,
      totalIslamicDebt: { amount: totalIslamicDebt, currency: baseCurrency },
      totalMarginPaid: { amount: Math.max(0, totalMarginPaid), currency: baseCurrency },
      averageMarginRate
    };
  }

  private async generateHalaalIncomeBreakdown(householdId: string, startDate: Date, endDate: Date): Promise<HalaalIncomeBreakdown> {
    // Get income transactions in the period
    const incomeTransactions = await this.prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: startDate, lte: endDate },
        amountCents: { lt: 0 }, // Negative amounts are income in our system
        category: {
          type: 'INCOME'
        }
      },
      include: {
        category: true,
        account: {
          include: { shariaCompliance: true }
        }
      }
    });

    const household = await this.prisma.household.findUnique({
      where: { id: householdId }
    });
    const baseCurrency = household?.baseCurrency || 'IDR';

    let totalIncome = 0;
    let halaalIncome = 0;
    let questionableIncome = 0;
    let nonHalaalIncome = 0;

    incomeTransactions.forEach(transaction => {
      const amount = Math.abs(Number(transaction.amountCents) / 100);
      totalIncome += amount;

      // Categorize income based on source account compliance and transaction description
      const accountCompliance = transaction.account.shariaCompliance?.complianceStatus;
      const description = transaction.description.toLowerCase();

      if (this.isNonHalaalIncome(description)) {
        nonHalaalIncome += amount;
      } else if (this.isQuestionableIncome(description) || accountCompliance === 'QUESTIONABLE') {
        questionableIncome += amount;
      } else if (accountCompliance === 'COMPLIANT' || this.isHalaalIncome(description)) {
        halaalIncome += amount;
      } else {
        // Default to questionable if we can't determine
        questionableIncome += amount;
      }
    });

    // Purification required is typically the non-halaal income that should be donated
    const purificationRequired = nonHalaalIncome;

    return {
      totalIncome: { amount: totalIncome, currency: baseCurrency },
      halaalIncome: { amount: halaalIncome, currency: baseCurrency },
      questionableIncome: { amount: questionableIncome, currency: baseCurrency },
      nonHalaalIncome: { amount: nonHalaalIncome, currency: baseCurrency },
      purificationRequired: { amount: purificationRequired, currency: baseCurrency }
    };
  }

  private isHalaalIncome(description: string): boolean {
    const halaalKeywords = [
      'salary', 'wage', 'business', 'trade', 'service', 'consulting',
      'freelance', 'commission', 'bonus', 'allowance'
    ];
    return halaalKeywords.some(keyword => description.includes(keyword));
  }

  private isQuestionableIncome(description: string): boolean {
    const questionableKeywords = [
      'dividend', 'stock', 'investment', 'mutual fund', 'reit'
    ];
    return questionableKeywords.some(keyword => description.includes(keyword));
  }

  private isNonHalaalIncome(description: string): boolean {
    const nonHalaalKeywords = [
      'interest', 'riba', 'gambling', 'lottery', 'alcohol', 'pork',
      'casino', 'betting', 'usury'
    ];
    return nonHalaalKeywords.some(keyword => description.includes(keyword));
  }

  private calculateHaulCompletionDate(haulStartDate: Date): Date {
    const completionDate = new Date(haulStartDate);
    completionDate.setDate(completionDate.getDate() + 354); // Islamic lunar year
    return completionDate;
  }

  private calculateDaysRemaining(haulStartDate: Date): number {
    const completionDate = this.calculateHaulCompletionDate(haulStartDate);
    const today = new Date();
    const diffTime = completionDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  private mapToIslamicFinanceReport(dbReport: any): IslamicFinanceReport {
    return {
      id: dbReport.id,
      householdId: dbReport.householdId,
      reportType: dbReport.reportType,
      period: {
        startDate: dbReport.periodStartDate,
        endDate: dbReport.periodEndDate,
        type: dbReport.periodType
      },
      generatedAt: dbReport.generatedAt,
      data: dbReport.reportData
    };
  }
}
