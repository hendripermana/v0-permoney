import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShariaCompliantAccount, ShariaComplianceStatus } from '../types/islamic-finance.types';
import { UpdateShariaComplianceDto } from '../dto/zakat-calculation.dto';

@Injectable()
export class ShariaComplianceService {
  private readonly logger = new Logger(ShariaComplianceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updateAccountCompliance(dto: UpdateShariaComplianceDto, reviewedBy?: string): Promise<ShariaCompliantAccount> {
    this.logger.log(`Updating Sharia compliance for account: ${dto.accountId}`);

    const nextReviewDate = this.calculateNextReviewDate(dto.complianceStatus);

    const compliance = await this.prisma.shariaCompliantAccount.upsert({
      where: { accountId: dto.accountId },
      update: {
        complianceStatus: dto.complianceStatus,
        complianceNotes: dto.complianceNotes,
        lastReviewDate: new Date(),
        nextReviewDate,
        reviewedBy
      },
      create: {
        accountId: dto.accountId,
        complianceStatus: dto.complianceStatus,
        complianceNotes: dto.complianceNotes,
        lastReviewDate: new Date(),
        nextReviewDate,
        reviewedBy
      }
    });

    return this.mapToShariaCompliantAccount(compliance);
  }

  async getAccountCompliance(accountId: string): Promise<ShariaCompliantAccount | null> {
    const compliance = await this.prisma.shariaCompliantAccount.findUnique({
      where: { accountId }
    });

    return compliance ? this.mapToShariaCompliantAccount(compliance) : null;
  }

  async getHouseholdCompliance(householdId: string): Promise<ShariaCompliantAccount[]> {
    const compliances = await this.prisma.shariaCompliantAccount.findMany({
      where: {
        account: {
          householdId
        }
      },
      include: {
        account: true
      }
    });

    return compliances.map(compliance => this.mapToShariaCompliantAccount(compliance));
  }

  async getComplianceSummary(householdId: string): Promise<{
    totalAccounts: number;
    compliantAccounts: number;
    nonCompliantAccounts: number;
    underReviewAccounts: number;
    questionableAccounts: number;
    compliancePercentage: number;
  }> {
    const accounts = await this.prisma.account.findMany({
      where: { householdId, isActive: true },
      include: { shariaCompliance: true }
    });

    const totalAccounts = accounts.length;
    let compliantAccounts = 0;
    let nonCompliantAccounts = 0;
    let underReviewAccounts = 0;
    let questionableAccounts = 0;

    accounts.forEach(account => {
      const status = account.shariaCompliance?.complianceStatus;
      switch (status) {
        case ShariaComplianceStatus.COMPLIANT:
          compliantAccounts++;
          break;
        case ShariaComplianceStatus.NON_COMPLIANT:
          nonCompliantAccounts++;
          break;
        case ShariaComplianceStatus.UNDER_REVIEW:
          underReviewAccounts++;
          break;
        case ShariaComplianceStatus.QUESTIONABLE:
          questionableAccounts++;
          break;
        default:
          // Accounts without compliance status are considered under review
          underReviewAccounts++;
      }
    });

    const compliancePercentage = totalAccounts > 0 
      ? Math.round((compliantAccounts / totalAccounts) * 100) 
      : 0;

    return {
      totalAccounts,
      compliantAccounts,
      nonCompliantAccounts,
      underReviewAccounts,
      questionableAccounts,
      compliancePercentage
    };
  }

  async getAccountsDueForReview(householdId?: string): Promise<ShariaCompliantAccount[]> {
    const where: any = {
      nextReviewDate: {
        lte: new Date()
      }
    };

    if (householdId) {
      where.account = { householdId };
    }

    const compliances = await this.prisma.shariaCompliantAccount.findMany({
      where,
      include: { account: true },
      orderBy: { nextReviewDate: 'asc' }
    });

    return compliances.map(compliance => this.mapToShariaCompliantAccount(compliance));
  }

  async autoAssessAccountCompliance(accountId: string): Promise<ShariaComplianceStatus> {
    this.logger.log(`Auto-assessing Sharia compliance for account: ${accountId}`);

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { institution: true }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Auto-assessment logic based on account type and institution
    let suggestedStatus = ShariaComplianceStatus.UNDER_REVIEW;

    // Check institution type
    if (account.institution) {
      const institutionName = account.institution.name.toLowerCase();
      
      // Islamic banks are generally compliant
      if (this.isIslamicBank(institutionName)) {
        suggestedStatus = ShariaComplianceStatus.COMPLIANT;
      }
      // Conventional banks with interest-bearing accounts are non-compliant
      else if (this.isInterestBearingAccount(account.subtype)) {
        suggestedStatus = ShariaComplianceStatus.NON_COMPLIANT;
      }
    }

    // Check account subtype
    if (account.subtype.toLowerCase().includes('islamic') || 
        account.subtype.toLowerCase().includes('sharia') ||
        account.subtype.toLowerCase().includes('mudharabah') ||
        account.subtype.toLowerCase().includes('murabaha')) {
      suggestedStatus = ShariaComplianceStatus.COMPLIANT;
    }

    // Investment accounts need manual review
    if (account.subtype.toLowerCase().includes('investment') ||
        account.subtype.toLowerCase().includes('mutual') ||
        account.subtype.toLowerCase().includes('stock')) {
      suggestedStatus = ShariaComplianceStatus.UNDER_REVIEW;
    }

    return suggestedStatus;
  }

  async bulkAssessCompliance(householdId: string): Promise<void> {
    this.logger.log(`Bulk assessing Sharia compliance for household: ${householdId}`);

    const accounts = await this.prisma.account.findMany({
      where: { 
        householdId, 
        isActive: true,
        shariaCompliance: null // Only assess accounts without existing compliance status
      }
    });

    for (const account of accounts) {
      try {
        const suggestedStatus = await this.autoAssessAccountCompliance(account.id);
        
        await this.updateAccountCompliance({
          accountId: account.id,
          complianceStatus: suggestedStatus,
          complianceNotes: 'Auto-assessed based on account type and institution'
        });
      } catch (error) {
        this.logger.error(`Failed to assess compliance for account ${account.id}:`, error);
      }
    }
  }

  private isIslamicBank(institutionName: string): boolean {
    const islamicBankKeywords = [
      'syariah', 'sharia', 'islamic', 'muamalat', 'bsi', 'bank syariah indonesia',
      'bni syariah', 'bri syariah', 'bca syariah', 'mandiri syariah',
      'mega syariah', 'bukopin syariah', 'panin dubai syariah'
    ];

    return islamicBankKeywords.some(keyword => 
      institutionName.includes(keyword)
    );
  }

  private isInterestBearingAccount(subtype: string): boolean {
    const interestBearingTypes = [
      'savings', 'time_deposit', 'certificate_deposit', 'fixed_deposit'
    ];

    return interestBearingTypes.some(type => 
      subtype.toLowerCase().includes(type)
    );
  }

  private calculateNextReviewDate(status: ShariaComplianceStatus): Date {
    const nextReview = new Date();
    
    switch (status) {
      case ShariaComplianceStatus.COMPLIANT:
        // Review compliant accounts annually
        nextReview.setFullYear(nextReview.getFullYear() + 1);
        break;
      case ShariaComplianceStatus.NON_COMPLIANT:
        // Review non-compliant accounts quarterly (in case they change)
        nextReview.setMonth(nextReview.getMonth() + 3);
        break;
      case ShariaComplianceStatus.QUESTIONABLE:
        // Review questionable accounts every 6 months
        nextReview.setMonth(nextReview.getMonth() + 6);
        break;
      case ShariaComplianceStatus.UNDER_REVIEW:
        // Review pending accounts monthly
        nextReview.setMonth(nextReview.getMonth() + 1);
        break;
      default:
        nextReview.setMonth(nextReview.getMonth() + 3);
    }

    return nextReview;
  }

  private mapToShariaCompliantAccount(dbCompliance: any): ShariaCompliantAccount {
    return {
      accountId: dbCompliance.accountId,
      complianceStatus: dbCompliance.complianceStatus,
      complianceNotes: dbCompliance.complianceNotes,
      lastReviewDate: dbCompliance.lastReviewDate,
      nextReviewDate: dbCompliance.nextReviewDate
    };
  }
}
