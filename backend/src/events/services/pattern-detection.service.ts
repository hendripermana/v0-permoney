import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SpendingPatternData } from '../types/event.types';

@Injectable()
export class PatternDetectionService {
  private readonly logger = new Logger(PatternDetectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Detect anomalies in spending patterns
   */
  async detectSpendingAnomalies(householdId: string, userId?: string) {
    const where: any = { householdId };
    if (userId) where.createdBy = userId;

    // Get recent transactions (last 30 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);

    const recentTransactions = await this.prisma.transaction.findMany({
      where: {
        ...where,
        date: { gte: recentDate },
        amountCents: { gt: 0 },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    // Get historical average for comparison (last 6 months)
    const historicalDate = new Date();
    historicalDate.setMonth(historicalDate.getMonth() - 6);

    const historicalTransactions = await this.prisma.transaction.findMany({
      where: {
        ...where,
        date: { gte: historicalDate, lt: recentDate },
        amountCents: { gt: 0 },
      },
      include: { category: true },
    });

    const anomalies = [];

    // Detect amount anomalies
    const amountAnomalies = this.detectAmountAnomalies(recentTransactions, historicalTransactions);
    anomalies.push(...amountAnomalies);

    // Detect frequency anomalies
    const frequencyAnomalies = this.detectFrequencyAnomalies(recentTransactions, historicalTransactions);
    anomalies.push(...frequencyAnomalies);

    // Detect category anomalies
    const categoryAnomalies = this.detectCategoryAnomalies(recentTransactions, historicalTransactions);
    anomalies.push(...categoryAnomalies);

    return {
      anomalies,
      totalAnomalies: anomalies.length,
      analysisDate: new Date(),
      recentTransactionCount: recentTransactions.length,
      historicalTransactionCount: historicalTransactions.length,
    };
  }

  /**
   * Detect recurring transaction patterns
   */
  async detectRecurringPatterns(householdId: string, userId?: string) {
    const where: any = { householdId };
    if (userId) where.createdBy = userId;

    // Get transactions from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        ...where,
        date: { gte: sixMonthsAgo },
      },
      include: { category: true },
      orderBy: { date: 'asc' },
    });

    const patterns = [];

    // Group by merchant and amount (potential recurring transactions)
    const merchantAmountGroups = transactions.reduce((acc, tx) => {
      if (!tx.merchant) return acc;
      
      const key = `${tx.merchant}_${tx.amountCents}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(tx);
      return acc;
    }, {} as Record<string, any[]>);

    // Analyze each group for recurring patterns
    Object.entries(merchantAmountGroups).forEach(([key, txs]) => {
      if (txs.length >= 3) { // Minimum 3 occurrences
        const intervals = this.calculateIntervals(txs.map(tx => new Date(tx.date)));
        const recurringPattern = this.detectRecurringInterval(intervals);
        
        if (recurringPattern) {
          patterns.push({
            merchant: txs[0].merchant,
            amount: txs[0].amountCents,
            currency: txs[0].currency,
            category: txs[0].category?.name,
            occurrences: txs.length,
            pattern: recurringPattern,
            confidence: this.calculatePatternConfidence(intervals, recurringPattern),
            transactions: txs.map(tx => ({
              id: tx.id,
              date: tx.date,
              amount: tx.amountCents,
            })),
          });
        }
      }
    });

    return {
      patterns: patterns.sort((a, b) => b.confidence - a.confidence),
      totalPatterns: patterns.length,
      analysisDate: new Date(),
    };
  }

  /**
   * Detect seasonal spending patterns
   */
  async detectSeasonalPatterns(householdId: string, userId?: string) {
    const where: any = { householdId };
    if (userId) where.createdBy = userId;

    // Get transactions from last 2 years for seasonal analysis
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        ...where,
        date: { gte: twoYearsAgo },
        amountCents: { gt: 0 },
      },
      include: { category: true },
    });

    // Group by month and category
    const monthlySpending = transactions.reduce((acc, tx) => {
      const month = new Date(tx.date).getMonth() + 1;
      const categoryId = tx.categoryId || 'uncategorized';
      
      if (!acc[month]) acc[month] = {};
      if (!acc[month][categoryId]) {
        acc[month][categoryId] = {
          total: 0,
          count: 0,
          category: tx.category?.name || 'Uncategorized',
        };
      }
      
      acc[month][categoryId].total += Number(tx.amountCents);
      acc[month][categoryId].count += 1;
      
      return acc;
    }, {} as Record<number, Record<string, any>>);

    // Detect seasonal patterns
    const seasonalPatterns = [];
    
    Object.entries(monthlySpending).forEach(([month, categories]) => {
      Object.entries(categories).forEach(([categoryId, data]) => {
        if (data.count >= 4) { // Minimum transactions for pattern
          const avgAmount = data.total / data.count;
          const monthNum = parseInt(month);
          
          // Determine season
          const season = this.getSeason(monthNum);
          
          seasonalPatterns.push({
            month: monthNum,
            season,
            categoryId,
            categoryName: data.category,
            averageAmount: Math.round(avgAmount),
            totalSpent: data.total,
            transactionCount: data.count,
          });
        }
      });
    });

    // Group by season for summary
    const seasonalSummary = seasonalPatterns.reduce((acc, pattern) => {
      if (!acc[pattern.season]) {
        acc[pattern.season] = {
          totalSpent: 0,
          transactionCount: 0,
          categories: new Set(),
        };
      }
      
      acc[pattern.season].totalSpent += pattern.totalSpent;
      acc[pattern.season].transactionCount += pattern.transactionCount;
      acc[pattern.season].categories.add(pattern.categoryName);
      
      return acc;
    }, {} as Record<string, any>);

    // Convert sets to arrays
    Object.values(seasonalSummary).forEach((summary: any) => {
      summary.categories = Array.from(summary.categories);
    });

    return {
      patterns: seasonalPatterns,
      seasonalSummary,
      analysisDate: new Date(),
    };
  }

  /**
   * Detect merchant loyalty patterns
   */
  async detectMerchantLoyalty(householdId: string, userId?: string) {
    const where: any = { householdId };
    if (userId) where.createdBy = userId;

    // Get transactions from last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        ...where,
        date: { gte: oneYearAgo },
        merchant: { not: null },
        amountCents: { gt: 0 },
      },
      orderBy: { date: 'asc' },
    });

    // Group by merchant
    const merchantStats = transactions.reduce((acc, tx) => {
      const merchant = tx.merchant!;
      
      if (!acc[merchant]) {
        acc[merchant] = {
          transactions: [],
          totalSpent: 0,
          visitCount: 0,
          firstVisit: tx.date,
          lastVisit: tx.date,
        };
      }
      
      acc[merchant].transactions.push(tx);
      acc[merchant].totalSpent += Number(tx.amountCents);
      acc[merchant].visitCount += 1;
      acc[merchant].lastVisit = tx.date;
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate loyalty metrics
    const loyaltyPatterns = Object.entries(merchantStats).map(([merchant, stats]) => {
      const daysBetweenVisits = this.calculateAverageVisitInterval(stats.transactions);
      const loyaltyScore = this.calculateLoyaltyScore(stats);
      
      return {
        merchant,
        totalSpent: stats.totalSpent,
        visitCount: stats.visitCount,
        averageSpent: Math.round(stats.totalSpent / stats.visitCount),
        daysBetweenVisits,
        loyaltyScore,
        firstVisit: stats.firstVisit,
        lastVisit: stats.lastVisit,
        isRegular: daysBetweenVisits <= 30 && stats.visitCount >= 6,
      };
    }).sort((a, b) => b.loyaltyScore - a.loyaltyScore);

    return {
      loyaltyPatterns,
      regularMerchants: loyaltyPatterns.filter(p => p.isRegular),
      totalMerchants: loyaltyPatterns.length,
      analysisDate: new Date(),
    };
  }

  // Helper methods
  private detectAmountAnomalies(recent: any[], historical: any[]) {
    const anomalies = [];
    
    // Calculate historical average and standard deviation
    const historicalAmounts = historical.map(tx => Number(tx.amountCents));
    const historicalAvg = historicalAmounts.reduce((sum, amt) => sum + amt, 0) / historicalAmounts.length;
    const historicalStdDev = Math.sqrt(
      historicalAmounts.reduce((sum, amt) => sum + Math.pow(amt - historicalAvg, 2), 0) / historicalAmounts.length
    );

    // Check recent transactions for anomalies
    recent.forEach(tx => {
      const amount = Number(tx.amountCents);
      const zScore = Math.abs((amount - historicalAvg) / historicalStdDev);
      
      if (zScore > 2.5) { // More than 2.5 standard deviations
        anomalies.push({
          type: 'AMOUNT_ANOMALY',
          transaction: tx,
          severity: zScore > 3 ? 'HIGH' : 'MEDIUM',
          description: `Transaction amount ${amount} is ${zScore.toFixed(2)} standard deviations from historical average`,
          historicalAverage: Math.round(historicalAvg),
          zScore: zScore.toFixed(2),
        });
      }
    });

    return anomalies;
  }

  private detectFrequencyAnomalies(recent: any[], historical: any[]) {
    const anomalies = [];
    
    // Calculate daily transaction frequency
    const recentDailyCount = recent.length / 30; // Last 30 days
    const historicalDailyCount = historical.length / 150; // Previous 5 months (approx 150 days)
    
    const frequencyChange = (recentDailyCount - historicalDailyCount) / historicalDailyCount;
    
    if (Math.abs(frequencyChange) > 0.5) { // 50% change in frequency
      anomalies.push({
        type: 'FREQUENCY_ANOMALY',
        severity: Math.abs(frequencyChange) > 1 ? 'HIGH' : 'MEDIUM',
        description: `Transaction frequency changed by ${(frequencyChange * 100).toFixed(1)}%`,
        recentDailyCount: recentDailyCount.toFixed(2),
        historicalDailyCount: historicalDailyCount.toFixed(2),
        changePercentage: (frequencyChange * 100).toFixed(1),
      });
    }

    return anomalies;
  }

  private detectCategoryAnomalies(recent: any[], historical: any[]) {
    const anomalies = [];
    
    // Group by category
    const recentByCategory = this.groupByCategory(recent);
    const historicalByCategory = this.groupByCategory(historical);
    
    // Check for new categories with significant spending
    Object.entries(recentByCategory).forEach(([categoryId, recentData]) => {
      const historicalData = historicalByCategory[categoryId];
      
      if (!historicalData) {
        // New category
        if (recentData.total > 100000) { // More than 1M IDR
          anomalies.push({
            type: 'NEW_CATEGORY_ANOMALY',
            severity: 'MEDIUM',
            categoryId,
            categoryName: recentData.categoryName,
            description: `New spending category with significant amount: ${recentData.categoryName}`,
            amount: recentData.total,
            transactionCount: recentData.count,
          });
        }
      } else {
        // Existing category with unusual spending
        const spendingChange = (recentData.total - historicalData.total) / historicalData.total;
        
        if (Math.abs(spendingChange) > 0.75) { // 75% change
          anomalies.push({
            type: 'CATEGORY_SPENDING_ANOMALY',
            severity: Math.abs(spendingChange) > 1.5 ? 'HIGH' : 'MEDIUM',
            categoryId,
            categoryName: recentData.categoryName,
            description: `Unusual spending change in ${recentData.categoryName}: ${(spendingChange * 100).toFixed(1)}%`,
            recentAmount: recentData.total,
            historicalAmount: historicalData.total,
            changePercentage: (spendingChange * 100).toFixed(1),
          });
        }
      }
    });

    return anomalies;
  }

  private groupByCategory(transactions: any[]) {
    return transactions.reduce((acc, tx) => {
      const categoryId = tx.categoryId || 'uncategorized';
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          total: 0,
          count: 0,
          categoryName: tx.category?.name || 'Uncategorized',
        };
      }
      
      acc[categoryId].total += Number(tx.amountCents);
      acc[categoryId].count += 1;
      
      return acc;
    }, {} as Record<string, any>);
  }

  private calculateIntervals(dates: Date[]): number[] {
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    const intervals = [];
    
    for (let i = 1; i < sortedDates.length; i++) {
      const daysDiff = Math.round(
        (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
      );
      intervals.push(daysDiff);
    }
    
    return intervals;
  }

  private detectRecurringInterval(intervals: number[]): string | null {
    if (intervals.length < 2) return null;
    
    // Check for common patterns
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const tolerance = 3; // days
    
    // Weekly pattern (7 days ± tolerance)
    if (Math.abs(avgInterval - 7) <= tolerance) {
      return 'WEEKLY';
    }
    
    // Bi-weekly pattern (14 days ± tolerance)
    if (Math.abs(avgInterval - 14) <= tolerance) {
      return 'BI_WEEKLY';
    }
    
    // Monthly pattern (30 days ± tolerance)
    if (Math.abs(avgInterval - 30) <= tolerance * 2) {
      return 'MONTHLY';
    }
    
    // Quarterly pattern (90 days ± tolerance)
    if (Math.abs(avgInterval - 90) <= tolerance * 3) {
      return 'QUARTERLY';
    }
    
    return null;
  }

  private calculatePatternConfidence(intervals: number[], pattern: string): number {
    const expectedInterval = this.getExpectedInterval(pattern);
    if (!expectedInterval) return 0;
    
    const deviations = intervals.map(interval => Math.abs(interval - expectedInterval));
    const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    
    // Confidence decreases with deviation
    const maxDeviation = expectedInterval * 0.3; // 30% tolerance
    const confidence = Math.max(0, 1 - (avgDeviation / maxDeviation));
    
    return Math.round(confidence * 100) / 100;
  }

  private getExpectedInterval(pattern: string): number | null {
    switch (pattern) {
      case 'WEEKLY': return 7;
      case 'BI_WEEKLY': return 14;
      case 'MONTHLY': return 30;
      case 'QUARTERLY': return 90;
      default: return null;
    }
  }

  private getSeason(month: number): string {
    if (month >= 12 || month <= 2) return 'WINTER';
    if (month >= 3 && month <= 5) return 'SPRING';
    if (month >= 6 && month <= 8) return 'SUMMER';
    return 'AUTUMN';
  }

  private calculateAverageVisitInterval(transactions: any[]): number {
    if (transactions.length < 2) return 0;
    
    const dates = transactions.map(tx => new Date(tx.date)).sort((a, b) => a.getTime() - b.getTime());
    const intervals = this.calculateIntervals(dates);
    
    return Math.round(intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length);
  }

  private calculateLoyaltyScore(stats: any): number {
    const { visitCount, totalSpent, transactions } = stats;
    
    // Factors: frequency, recency, monetary value
    const frequencyScore = Math.min(visitCount / 12, 1); // Max score at 12+ visits
    const monetaryScore = Math.min(totalSpent / 10000000, 1); // Max score at 10M IDR
    
    // Recency score (higher for more recent visits)
    const daysSinceLastVisit = Math.round(
      (new Date().getTime() - new Date(stats.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
    );
    const recencyScore = Math.max(0, 1 - (daysSinceLastVisit / 365)); // Decreases over a year
    
    // Combined score
    const loyaltyScore = (frequencyScore * 0.4 + monetaryScore * 0.3 + recencyScore * 0.3);
    
    return Math.round(loyaltyScore * 100) / 100;
  }
}
