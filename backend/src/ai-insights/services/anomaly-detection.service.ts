import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FinancialAnomaly, AnomalyDetectionOptions } from '../types/ai-insights.types';

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Detect financial anomalies for a household
   */
  async detectAnomalies(
    householdId: string,
    options: AnomalyDetectionOptions = {},
  ): Promise<FinancialAnomaly[]> {
    this.logger.log(`Detecting anomalies for household ${householdId}`);

    const {
      sensitivity = 'MEDIUM',
      minDeviation = 50, // 50% deviation threshold
      includeTimeBasedAnomalies = true,
      includeAmountBasedAnomalies = true,
    } = options;

    try {
      const anomalies: FinancialAnomaly[] = [];

      // Get recent transactions for analysis
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTransactions = await this.prisma.transaction.findMany({
        where: {
          householdId,
          date: { gte: thirtyDaysAgo },
        },
        include: { category: true },
        orderBy: { date: 'desc' },
      });

      // Get historical data for comparison (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const historicalTransactions = await this.prisma.transaction.findMany({
        where: {
          householdId,
          date: { gte: sixMonthsAgo, lt: thirtyDaysAgo },
        },
        include: { category: true },
      });

      if (includeAmountBasedAnomalies) {
        const amountAnomalies = await this.detectAmountAnomalies(
          recentTransactions,
          historicalTransactions,
          sensitivity,
          minDeviation,
        );
        anomalies.push(...amountAnomalies);
      }

      if (includeTimeBasedAnomalies) {
        const timeAnomalies = await this.detectTimeBasedAnomalies(
          recentTransactions,
          historicalTransactions,
          sensitivity,
        );
        anomalies.push(...timeAnomalies);
      }

      // Detect merchant anomalies
      const merchantAnomalies = await this.detectMerchantAnomalies(
        recentTransactions,
        historicalTransactions,
        sensitivity,
      );
      anomalies.push(...merchantAnomalies);

      // Detect category anomalies
      const categoryAnomalies = await this.detectCategoryAnomalies(
        recentTransactions,
        historicalTransactions,
        sensitivity,
        minDeviation,
      );
      anomalies.push(...categoryAnomalies);

      // Sort by severity and confidence
      anomalies.sort((a, b) => {
        const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return b.confidence - a.confidence;
      });

      this.logger.log(`Detected ${anomalies.length} anomalies for household ${householdId}`);
      return anomalies;
    } catch (error) {
      this.logger.error(`Failed to detect anomalies for household ${householdId}:`, error);
      throw error;
    }
  }

  /**
   * Detect amount-based anomalies
   */
  private async detectAmountAnomalies(
    recentTransactions: any[],
    historicalTransactions: any[],
    sensitivity: 'LOW' | 'MEDIUM' | 'HIGH',
    minDeviation: number,
  ): Promise<FinancialAnomaly[]> {
    const anomalies: FinancialAnomaly[] = [];

    // Calculate historical spending patterns by category
    const historicalPatterns = this.calculateHistoricalPatterns(historicalTransactions);

    // Sensitivity thresholds
    const thresholds = {
      LOW: { multiplier: 3, minAmount: 1000000 }, // 10,000 IDR
      MEDIUM: { multiplier: 2.5, minAmount: 500000 }, // 5,000 IDR
      HIGH: { multiplier: 2, minAmount: 100000 }, // 1,000 IDR
    };

    const threshold = thresholds[sensitivity];

    for (const transaction of recentTransactions) {
      const amount = Math.abs(Number(transaction.amountCents));
      const categoryId = transaction.categoryId || 'uncategorized';
      const pattern = historicalPatterns.get(categoryId);

      if (!pattern || amount < threshold.minAmount) continue;

      const expectedAmount = pattern.average;
      const deviation = Math.abs(amount - expectedAmount) / expectedAmount * 100;

      // Check if amount is significantly different from historical pattern
      if (amount > expectedAmount * threshold.multiplier && deviation > minDeviation) {
        const confidence = Math.min(0.95, deviation / 100);
        
        anomalies.push({
          type: 'UNUSUAL_SPENDING',
          title: 'Unusually High Spending Detected',
          description: `Spent ${this.formatCurrency(amount)} on ${transaction.category?.name || 'Uncategorized'}, which is ${deviation.toFixed(0)}% higher than usual`,
          severity: this.calculateSeverity(deviation, amount),
          transactionId: transaction.id,
          amount,
          expectedAmount,
          deviation,
          confidence,
          detectedAt: new Date(),
          data: {
            categoryName: transaction.category?.name || 'Uncategorized',
            merchant: transaction.merchant,
            date: transaction.date,
            historicalAverage: expectedAmount,
            historicalCount: pattern.count,
          },
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect time-based anomalies
   */
  private async detectTimeBasedAnomalies(
    recentTransactions: any[],
    historicalTransactions: any[],
    sensitivity: 'LOW' | 'MEDIUM' | 'HIGH',
  ): Promise<FinancialAnomaly[]> {
    const anomalies: FinancialAnomaly[] = [];

    // Analyze spending by time patterns
    const historicalTimePatterns = this.analyzeTimePatterns(historicalTransactions);
    
    for (const transaction of recentTransactions) {
      const transactionDate = new Date(transaction.date);
      const dayOfWeek = transactionDate.getDay();
      const hour = transactionDate.getHours();
      const amount = Math.abs(Number(transaction.amountCents));

      // Check day of week anomalies
      const dayPattern = historicalTimePatterns.dayOfWeek.get(dayOfWeek);
      if (dayPattern && dayPattern.count > 5) { // Minimum historical data
        const expectedFrequency = dayPattern.frequency;
        const actualFrequency = this.calculateRecentFrequency(recentTransactions, 'dayOfWeek', dayOfWeek);
        
        if (actualFrequency > expectedFrequency * 2) {
          anomalies.push({
            type: 'UNUSUAL_TIME',
            title: 'Unusual Spending Day Pattern',
            description: `Increased spending activity on ${this.getDayName(dayOfWeek)}s compared to historical pattern`,
            severity: 'MEDIUM',
            transactionId: transaction.id,
            amount,
            deviation: ((actualFrequency - expectedFrequency) / expectedFrequency) * 100,
            confidence: 0.7,
            detectedAt: new Date(),
            data: {
              dayOfWeek,
              dayName: this.getDayName(dayOfWeek),
              expectedFrequency,
              actualFrequency,
            },
          });
        }
      }

      // Check hour anomalies (for significant amounts)
      if (amount > 500000) { // Only for amounts > 5,000 IDR
        const hourPattern = historicalTimePatterns.hourOfDay.get(hour);
        if (hourPattern && hourPattern.count < 2) { // Unusual hour
          anomalies.push({
            type: 'UNUSUAL_TIME',
            title: 'Unusual Spending Time',
            description: `Large transaction at ${hour}:00, which is unusual for your spending pattern`,
            severity: 'LOW',
            transactionId: transaction.id,
            amount,
            deviation: 100, // 100% unusual
            confidence: 0.6,
            detectedAt: new Date(),
            data: {
              hour,
              amount,
              merchant: transaction.merchant,
              category: transaction.category?.name,
            },
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect merchant anomalies
   */
  private async detectMerchantAnomalies(
    recentTransactions: any[],
    historicalTransactions: any[],
    sensitivity: 'LOW' | 'MEDIUM' | 'HIGH',
  ): Promise<FinancialAnomaly[]> {
    const anomalies: FinancialAnomaly[] = [];

    // Get historical merchants
    const historicalMerchants = new Set(
      historicalTransactions
        .map(t => t.merchant)
        .filter(Boolean)
    );

    // Find new merchants with significant spending
    const newMerchantSpending = new Map<string, { amount: number; count: number; transactions: any[] }>();

    for (const transaction of recentTransactions) {
      if (!transaction.merchant) continue;

      const amount = Math.abs(Number(transaction.amountCents));
      
      // Skip if merchant is known
      if (historicalMerchants.has(transaction.merchant)) continue;

      if (!newMerchantSpending.has(transaction.merchant)) {
        newMerchantSpending.set(transaction.merchant, { amount: 0, count: 0, transactions: [] });
      }

      const merchantData = newMerchantSpending.get(transaction.merchant)!;
      merchantData.amount += amount;
      merchantData.count += 1;
      merchantData.transactions.push(transaction);
    }

    // Create anomalies for significant new merchant spending
    const thresholds = {
      LOW: 2000000, // 20,000 IDR
      MEDIUM: 1000000, // 10,000 IDR
      HIGH: 500000, // 5,000 IDR
    };

    const threshold = thresholds[sensitivity];

    for (const [merchant, data] of newMerchantSpending.entries()) {
      if (data.amount > threshold) {
        anomalies.push({
          type: 'UNUSUAL_MERCHANT',
          title: 'New Merchant Spending',
          description: `First time spending at ${merchant} with total of ${this.formatCurrency(data.amount)}`,
          severity: data.amount > threshold * 5 ? 'HIGH' : 'MEDIUM',
          amount: data.amount,
          deviation: 100, // 100% new
          confidence: 0.8,
          detectedAt: new Date(),
          data: {
            merchant,
            totalAmount: data.amount,
            transactionCount: data.count,
            transactions: data.transactions.map(t => ({
              id: t.id,
              amount: t.amountCents,
              date: t.date,
              category: t.category?.name,
            })),
          },
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect category anomalies
   */
  private async detectCategoryAnomalies(
    recentTransactions: any[],
    historicalTransactions: any[],
    sensitivity: 'LOW' | 'MEDIUM' | 'HIGH',
    minDeviation: number,
  ): Promise<FinancialAnomaly[]> {
    const anomalies: FinancialAnomaly[] = [];

    // Calculate category spending patterns
    const historicalCategorySpending = this.calculateCategorySpending(historicalTransactions);
    const recentCategorySpending = this.calculateCategorySpending(recentTransactions);

    for (const [categoryId, recentAmount] of recentCategorySpending.entries()) {
      const historicalAmount = historicalCategorySpending.get(categoryId);
      
      if (!historicalAmount) continue;

      // Normalize to monthly amounts for comparison
      const recentMonthlyAmount = recentAmount; // Already 30 days
      const historicalMonthlyAmount = historicalAmount / 5; // 5 months of historical data

      const deviation = Math.abs(recentMonthlyAmount - historicalMonthlyAmount) / historicalMonthlyAmount * 100;

      if (deviation > minDeviation && recentMonthlyAmount > historicalMonthlyAmount * 1.5) {
        const category = recentTransactions.find(t => t.categoryId === categoryId)?.category;
        
        anomalies.push({
          type: 'UNUSUAL_CATEGORY',
          title: 'Unusual Category Spending',
          description: `Spending in ${category?.name || 'Uncategorized'} is ${deviation.toFixed(0)}% higher than usual this month`,
          severity: this.calculateSeverity(deviation, recentMonthlyAmount),
          amount: recentMonthlyAmount,
          expectedAmount: historicalMonthlyAmount,
          deviation,
          confidence: Math.min(0.9, deviation / 100),
          detectedAt: new Date(),
          data: {
            categoryId,
            categoryName: category?.name || 'Uncategorized',
            recentAmount: recentMonthlyAmount,
            historicalAverage: historicalMonthlyAmount,
            period: '30 days',
          },
        });
      }
    }

    return anomalies;
  }

  /**
   * Calculate historical spending patterns by category
   */
  private calculateHistoricalPatterns(transactions: any[]): Map<string, { average: number; count: number }> {
    const patterns = new Map<string, { total: number; count: number }>();

    for (const transaction of transactions) {
      const categoryId = transaction.categoryId || 'uncategorized';
      const amount = Math.abs(Number(transaction.amountCents));

      if (!patterns.has(categoryId)) {
        patterns.set(categoryId, { total: 0, count: 0 });
      }

      const pattern = patterns.get(categoryId)!;
      pattern.total += amount;
      pattern.count += 1;
    }

    // Convert to averages
    const result = new Map<string, { average: number; count: number }>();
    for (const [categoryId, pattern] of patterns.entries()) {
      result.set(categoryId, {
        average: pattern.total / pattern.count,
        count: pattern.count,
      });
    }

    return result;
  }

  /**
   * Analyze time patterns in historical data
   */
  private analyzeTimePatterns(transactions: any[]): {
    dayOfWeek: Map<number, { frequency: number; count: number }>;
    hourOfDay: Map<number, { frequency: number; count: number }>;
  } {
    const dayOfWeekCounts = new Map<number, number>();
    const hourOfDayCounts = new Map<number, number>();

    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();

      dayOfWeekCounts.set(dayOfWeek, (dayOfWeekCounts.get(dayOfWeek) || 0) + 1);
      hourOfDayCounts.set(hour, (hourOfDayCounts.get(hour) || 0) + 1);
    }

    // Calculate frequencies (transactions per week/day)
    const totalWeeks = Math.max(1, transactions.length / 7);
    const totalDays = Math.max(1, transactions.length / 24);

    const dayOfWeekPatterns = new Map<number, { frequency: number; count: number }>();
    const hourOfDayPatterns = new Map<number, { frequency: number; count: number }>();

    for (const [day, count] of dayOfWeekCounts.entries()) {
      dayOfWeekPatterns.set(day, {
        frequency: count / totalWeeks,
        count,
      });
    }

    for (const [hour, count] of hourOfDayCounts.entries()) {
      hourOfDayPatterns.set(hour, {
        frequency: count / totalDays,
        count,
      });
    }

    return {
      dayOfWeek: dayOfWeekPatterns,
      hourOfDay: hourOfDayPatterns,
    };
  }

  /**
   * Calculate recent frequency for time patterns
   */
  private calculateRecentFrequency(transactions: any[], type: 'dayOfWeek' | 'hourOfDay', value: number): number {
    const matches = transactions.filter(t => {
      const date = new Date(t.date);
      if (type === 'dayOfWeek') {
        return date.getDay() === value;
      } else {
        return date.getHours() === value;
      }
    });

    const period = type === 'dayOfWeek' ? 4 : 30; // 4 weeks or 30 days
    return matches.length / period;
  }

  /**
   * Calculate category spending totals
   */
  private calculateCategorySpending(transactions: any[]): Map<string, number> {
    const spending = new Map<string, number>();

    for (const transaction of transactions) {
      const categoryId = transaction.categoryId || 'uncategorized';
      const amount = Math.abs(Number(transaction.amountCents));

      spending.set(categoryId, (spending.get(categoryId) || 0) + amount);
    }

    return spending;
  }

  /**
   * Calculate severity based on deviation and amount
   */
  private calculateSeverity(deviation: number, amount: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (deviation > 200 || amount > 10000000) { // 200% deviation or > 100,000 IDR
      return 'HIGH';
    } else if (deviation > 100 || amount > 5000000) { // 100% deviation or > 50,000 IDR
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Get day name from day number
   */
  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amountCents: number): string {
    const amount = amountCents / 100;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}
