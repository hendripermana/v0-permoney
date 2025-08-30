import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  ZakatCalculation, 
  ZakatAssetBreakdown, 
  ZakatAssetType, 
  ZAKAT_RATES, 
  NISAB_THRESHOLDS, 
  HAUL_PERIOD_DAYS,
  Money 
} from '../types/islamic-finance.types';
import { CalculateZakatDto, RecordZakatPaymentDto } from '../dto/zakat-calculation.dto';

@Injectable()
export class ZakatCalculationService {
  private readonly logger = new Logger(ZakatCalculationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateZakat(dto: CalculateZakatDto): Promise<ZakatCalculation> {
    this.logger.log(`Calculating zakat for household: ${dto.householdId}`);

    const calculationDate = dto.calculationDate ? new Date(dto.calculationDate) : new Date();
    const hijriYear = this.getHijriYear(calculationDate);

    // Get household accounts
    const accounts = await this.prisma.account.findMany({
      where: {
        householdId: dto.householdId,
        isActive: true,
        ...(dto.assetTypes && {
          type: 'ASSET' // Only consider asset accounts for zakat
        })
      },
      include: {
        shariaCompliance: true
      }
    });

    // Calculate nisab threshold in household's base currency
    const household = await this.prisma.household.findUnique({
      where: { id: dto.householdId }
    });

    if (!household) {
      throw new Error('Household not found');
    }

    const nisabThreshold = await this.calculateNisabThreshold(household.baseCurrency, calculationDate);
    
    // Calculate zakat for each eligible asset
    const assetBreakdown: ZakatAssetBreakdown[] = [];
    let totalZakatableAssets = 0;
    let totalZakatAmount = 0;

    for (const account of accounts) {
      // Skip non-compliant accounts if they have sharia compliance status
      if (account.shariaCompliance?.complianceStatus === 'NON_COMPLIANT') {
        continue;
      }

      const assetType = this.determineAssetType(account);
      
      // Skip if specific asset types are requested and this doesn't match
      if (dto.assetTypes && !dto.assetTypes.includes(assetType)) {
        continue;
      }

      const haulCompleted = await this.checkHaulCompletion(account.id, calculationDate);
      
      if (haulCompleted) {
        const assetAmount = Number(account.balanceCents) / 100;
        const zakatRate = ZAKAT_RATES[assetType];
        const zakatAmount = assetAmount * zakatRate;

        assetBreakdown.push({
          assetType,
          accountId: account.id,
          accountName: account.name,
          amount: { amount: assetAmount, currency: account.currency },
          zakatRate,
          zakatAmount: { amount: zakatAmount, currency: account.currency },
          haulCompleted: true,
          haulStartDate: await this.getHaulStartDate(account.id, calculationDate)
        });

        // Convert to base currency for totals (simplified - in real implementation, use exchange rates)
        if (account.currency === household.baseCurrency) {
          totalZakatableAssets += assetAmount;
          totalZakatAmount += zakatAmount;
        }
      } else {
        assetBreakdown.push({
          assetType,
          accountId: account.id,
          accountName: account.name,
          amount: { amount: Number(account.balanceCents) / 100, currency: account.currency },
          zakatRate: ZAKAT_RATES[assetType],
          zakatAmount: { amount: 0, currency: account.currency },
          haulCompleted: false,
          haulStartDate: await this.getHaulStartDate(account.id, calculationDate)
        });
      }
    }

    const isZakatDue = totalZakatableAssets >= nisabThreshold.amount && totalZakatAmount > 0;
    const nextCalculationDate = this.calculateNextCalculationDate(calculationDate);

    // Save calculation to database
    const zakatCalculation = await this.prisma.zakatCalculation.create({
      data: {
        householdId: dto.householdId,
        calculationDate,
        hijriYear,
        nisabThresholdCents: Math.round(nisabThreshold.amount * 100),
        totalZakatableAssetsCents: Math.round(totalZakatableAssets * 100),
        zakatAmountCents: Math.round(totalZakatAmount * 100),
        currency: household.baseCurrency,
        isZakatDue,
        nextCalculationDate,
        assetBreakdown: {
          create: assetBreakdown.map(breakdown => ({
            assetType: breakdown.assetType,
            accountId: breakdown.accountId,
            accountName: breakdown.accountName,
            amountCents: Math.round(breakdown.amount.amount * 100),
            currency: breakdown.amount.currency,
            zakatRate: breakdown.zakatRate,
            zakatAmountCents: Math.round(breakdown.zakatAmount.amount * 100),
            haulCompleted: breakdown.haulCompleted,
            haulStartDate: breakdown.haulStartDate
          }))
        }
      },
      include: {
        assetBreakdown: true
      }
    });

    return this.mapToZakatCalculation(zakatCalculation);
  }

  async getZakatCalculations(householdId: string, limit = 10): Promise<ZakatCalculation[]> {
    const calculations = await this.prisma.zakatCalculation.findMany({
      where: { householdId },
      include: { assetBreakdown: true },
      orderBy: { calculationDate: 'desc' },
      take: limit
    });

    return calculations.map(calc => this.mapToZakatCalculation(calc));
  }

  async getLatestZakatCalculation(householdId: string): Promise<ZakatCalculation | null> {
    const calculation = await this.prisma.zakatCalculation.findFirst({
      where: { householdId },
      include: { assetBreakdown: true },
      orderBy: { calculationDate: 'desc' }
    });

    return calculation ? this.mapToZakatCalculation(calculation) : null;
  }

  async recordZakatPayment(dto: RecordZakatPaymentDto): Promise<void> {
    this.logger.log(`Recording zakat payment for household: ${dto.householdId}`);

    await this.prisma.zakatPayment.create({
      data: {
        householdId: dto.householdId,
        amountCents: Math.round(dto.amount * 100),
        currency: dto.currency,
        paymentDate: new Date(dto.paymentDate),
        hijriDate: dto.hijriDate,
        transactionId: dto.transactionId,
        notes: dto.notes
      }
    });
  }

  async getZakatPayments(householdId: string): Promise<any[]> {
    return this.prisma.zakatPayment.findMany({
      where: { householdId },
      include: { transaction: true },
      orderBy: { paymentDate: 'desc' }
    });
  }

  private async calculateNisabThreshold(currency: string, date: Date): Promise<Money> {
    // In a real implementation, this would fetch current gold/silver prices
    // For now, we'll use a simplified calculation based on gold price
    const goldPricePerGram = await this.getGoldPrice(currency, date);
    const nisabAmount = NISAB_THRESHOLDS.GOLD_GRAMS * goldPricePerGram;
    
    return { amount: nisabAmount, currency };
  }

  private async getGoldPrice(currency: string, date: Date): Promise<number> {
    // Simplified gold price - in real implementation, fetch from external API
    // Current approximate gold price in IDR per gram
    if (currency === 'IDR') {
      return 1000000; // ~1M IDR per gram
    }
    return 65; // ~$65 USD per gram
  }

  private determineAssetType(account: any): ZakatAssetType {
    const subtype = account.subtype.toLowerCase();
    
    if (subtype.includes('cash') || subtype.includes('checking')) {
      return ZakatAssetType.CASH;
    }
    if (subtype.includes('savings')) {
      return ZakatAssetType.SAVINGS;
    }
    if (subtype.includes('investment') || subtype.includes('mutual')) {
      return ZakatAssetType.INVESTMENT;
    }
    if (subtype.includes('gold')) {
      return ZakatAssetType.GOLD;
    }
    if (subtype.includes('silver')) {
      return ZakatAssetType.SILVER;
    }
    if (subtype.includes('crypto')) {
      return ZakatAssetType.CRYPTOCURRENCY;
    }
    
    return ZakatAssetType.CASH; // Default
  }

  private async checkHaulCompletion(accountId: string, calculationDate: Date): Promise<boolean> {
    // Check if the account has maintained the nisab threshold for a full haul period
    // This is a simplified implementation - in reality, you'd need to track daily balances
    const haulStartDate = new Date(calculationDate);
    haulStartDate.setDate(haulStartDate.getDate() - HAUL_PERIOD_DAYS);

    // For now, assume haul is completed if account is older than haul period
    const account = await this.prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account) return false;

    const accountAge = calculationDate.getTime() - account.createdAt.getTime();
    const haulPeriodMs = HAUL_PERIOD_DAYS * 24 * 60 * 60 * 1000;

    return accountAge >= haulPeriodMs;
  }

  private async getHaulStartDate(accountId: string, calculationDate: Date): Promise<Date> {
    // In a real implementation, this would track when the account first reached nisab
    const haulStartDate = new Date(calculationDate);
    haulStartDate.setDate(haulStartDate.getDate() - HAUL_PERIOD_DAYS);
    return haulStartDate;
  }

  private getHijriYear(date: Date): number {
    // Simplified Hijri year calculation
    // In a real implementation, use a proper Hijri calendar library
    const gregorianYear = date.getFullYear();
    return Math.floor((gregorianYear - 622) * 1.030684);
  }

  private calculateNextCalculationDate(currentDate: Date): Date {
    const nextDate = new Date(currentDate);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    return nextDate;
  }

  private mapToZakatCalculation(dbCalculation: any): ZakatCalculation {
    return {
      id: dbCalculation.id,
      householdId: dbCalculation.householdId,
      calculationDate: dbCalculation.calculationDate,
      hijriYear: dbCalculation.hijriYear,
      nisabThreshold: {
        amount: Number(dbCalculation.nisabThresholdCents) / 100,
        currency: dbCalculation.currency
      },
      totalZakatableAssets: {
        amount: Number(dbCalculation.totalZakatableAssetsCents) / 100,
        currency: dbCalculation.currency
      },
      zakatAmount: {
        amount: Number(dbCalculation.zakatAmountCents) / 100,
        currency: dbCalculation.currency
      },
      assetBreakdown: dbCalculation.assetBreakdown.map((breakdown: any) => ({
        assetType: breakdown.assetType,
        accountId: breakdown.accountId,
        accountName: breakdown.accountName,
        amount: {
          amount: Number(breakdown.amountCents) / 100,
          currency: breakdown.currency
        },
        zakatRate: Number(breakdown.zakatRate),
        zakatAmount: {
          amount: Number(breakdown.zakatAmountCents) / 100,
          currency: breakdown.currency
        },
        haulCompleted: breakdown.haulCompleted,
        haulStartDate: breakdown.haulStartDate
      })),
      isZakatDue: dbCalculation.isZakatDue,
      nextCalculationDate: dbCalculation.nextCalculationDate,
      createdAt: dbCalculation.createdAt,
      updatedAt: dbCalculation.updatedAt
    };
  }
}
