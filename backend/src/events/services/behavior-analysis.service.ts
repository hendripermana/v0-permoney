import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BehaviorAnalysisDto, AnalysisType, PatternType } from '../dto/behavior-analysis.dto';
import { SpendingPatternData, BehaviorInsight } from '../types/event.types';

@Injectable()
export class BehaviorAnalysisService {
  private readonly logger = new Logger(BehaviorAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analyze user behavior based on events and transactions
   */
  async analyzeBehavior(dto: BehaviorAnalysisDto) {
    const { householdId, userId, analysisType, startDate, endDate } = dto;

    const dateFilter = this.buildDateFilter(startDate, endDate);

    switch (analysisType) {
      case AnalysisType.SPENDING_PATTERNS:
        return this.analyzeSpendingPatterns(householdId, userId, dateFilter);
      
      case AnalysisType.USER_BEHAVIOR:
        return this.analyzeUserBehavior(householdId, userId, dateFilter);
      
      case AnalysisType.TRANSACTION_TRENDS:
        return this.analyzeTransactionTrends(householdId, userId, dateFilter);
      
      case AnalysisType.CATEGORY_PREFERENCES:
        return this.analyzeCategoryPreferences(householdId, userId, dateFilter);
      
      case AnalysisType.TIME_BASED_PATTERNS:
        return this.analyzeTimeBasedPatterns(householdId, userId, dateFilter);
      
      case AnalysisType.MERCHANT_FREQUENCY:
        return this.analyzeMerchantFrequency(householdId, userId, dateFilter);
      
      default:
        throw new Error(`Unsupported analysis type: ${analysisType}`);
    }
  }

  /**
   * Analyze spending patterns and detect recurring behaviors
   */
  private async analyzeSpendingPatterns(
    householdId: string,
    userId?: string,
    dateFilter?: any,
  ) {
    const where: any = { householdId };
    if (userId) where.createdBy = userId;
    if (dateFilter) where.date = dateFilter;

    // Get transaction data for pattern analysis
    const transactions = await this.prisma.transaction.findMany({
      where: {
        ...where,
        amountCents: { gt: 0 }, // Only expenses
      },
      include: {
        category: true,
      },
      orderBy: { date: 'asc' },
    });

    // Analyze daily patterns
    const dailyPatterns = this.detectDailyPatterns(transactions);
    
    // Analyze weekly patterns
    const weeklyPatterns = this.detectWeeklyPatterns(transactions);
    
    // Analyze monthly patterns
    const monthlyPatterns = this.detectMonthlyPatterns(transactions);

    // Store patterns in database
    await this.storeSpendingPatterns(householdId, userId, [
      ...dailyPatterns,
      ...weeklyPatterns,
      ...monthlyPatterns,
    ]);

    return {
      dailyPatterns,
      weeklyPatterns,
      monthlyPatterns,
      totalTransactions: transactions.length,
      analysisDate: new Date(),
    };
  }

  /**
   * Analyze user behavior from events
   */
  private async analyzeUserBehavior(
    householdId: string,
    userId?: string,
    dateFilter?: any,
  ) {
    const where: any = { householdId };
    if (userId) where.userId = userId;
    if (dateFilter) where.timestamp = dateFilter;

    const events = await this.prisma.userEvent.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    // Analyze session patterns
    const sessionPatterns = this.analyzeSessionPatterns(events);
    
    // Analyze feature usage
    const featureUsage = this.analyzeFeatureUsage(events);
    
    // Analyze navigation patterns
    const navigationPatterns = this.analyzeNavigationPatterns(events);

    return {
      sessionPatterns,
      featureUsage,
      navigationPatterns,
      totalEvents: events.length,
      analysisDate: new Date(),
    };
  }

  /**
   * Analyze transaction trends over time
   */
  private async analyzeTransactionTrends(
    householdId: string,
    userId?: string,
    dateFilter?: any,
  ) {
    const where: any = { householdId };
    if (userId) where.createdBy = userId;
    if (dateFilter) where.date = dateFilter;

    // Monthly spending trends
    const monthlyTrends = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        COUNT(*) as transaction_count,
        SUM(amount_cents) as total_amount,
        AVG(amount_cents) as avg_amount,
        COUNT(DISTINCT category_id) as categories_used
      FROM transactions 
      WHERE household_id = ${householdId}
        ${userId ? `AND created_by = ${userId}` : ''}
        ${dateFilter ? `AND date >= ${dateFilter.gte} AND date <= ${dateFilter.lte}` : ''}
        AND amount_cents > 0
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
    `;

    // Category trends
    const categoryTrends = await this.prisma.$queryRaw`
      SELECT 
        c.name as category_name,
        c.id as category_id,
        DATE_TRUNC('month', t.date) as month,
        SUM(t.amount_cents) as total_spent,
        COUNT(*) as transaction_count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.household_id = ${householdId}
        ${userId ? `AND t.created_by = ${userId}` : ''}
        ${dateFilter ? `AND t.date >= ${dateFilter.gte} AND t.date <= ${dateFilter.lte}` : ''}
        AND t.amount_cents > 0
      GROUP BY c.id, c.name, DATE_TRUNC('month', t.date)
      ORDER BY month DESC, total_spent DESC
    `;

    return {
      monthlyTrends,
      categoryTrends,
      analysisDate: new Date(),
    };
  }

  /**
   * Analyze category preferences
   */
  private async analyzeCategoryPreferences(
    householdId: string,
    userId?: string,
    dateFilter?: any,
  ) {
    const where: any = { householdId };
    if (userId) where.createdBy = userId;
    if (dateFilter) where.date = dateFilter;

    const categoryStats = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        ...where,
        amountCents: { gt: 0 },
        categoryId: { not: null },
      },
      _sum: { amountCents: true },
      _count: { categoryId: true },
      _avg: { amountCents: true },
      orderBy: { _sum: { amountCents: 'desc' } },
    });

    // Get category details
    const categoryIds = categoryStats.map(stat => stat.categoryId).filter(Boolean);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    }, {} as Record<string, any>);

    const preferences = categoryStats.map(stat => ({
      category: categoryMap[stat.categoryId!],
      totalSpent: stat._sum.amountCents,
      transactionCount: stat._count.categoryId,
      averageAmount: stat._avg.amountCents,
    }));

    return {
      preferences,
      totalCategories: preferences.length,
      analysisDate: new Date(),
    };
  }

  /**
   * Analyze time-based spending patterns
   */
  private async analyzeTimeBasedPatterns(
    householdId: string,
    userId?: string,
    dateFilter?: any,
  ) {
    const where: any = { householdId };
    if (userId) where.createdBy = userId;
    if (dateFilter) where.date = dateFilter;

    // Hour of day patterns
    const hourlyPatterns = await this.prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as transaction_count,
        SUM(amount_cents) as total_amount,
        AVG(amount_cents) as avg_amount
      FROM transactions 
      WHERE household_id = ${householdId}
        ${userId ? `AND created_by = ${userId}` : ''}
        ${dateFilter ? `AND date >= ${dateFilter.gte} AND date <= ${dateFilter.lte}` : ''}
        AND amount_cents > 0
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;

    // Day of week patterns
    const weeklyPatterns = await this.prisma.$queryRaw`
      SELECT 
        EXTRACT(DOW FROM date) as day_of_week,
        COUNT(*) as transaction_count,
        SUM(amount_cents) as total_amount,
        AVG(amount_cents) as avg_amount
      FROM transactions 
      WHERE household_id = ${householdId}
        ${userId ? `AND created_by = ${userId}` : ''}
        ${dateFilter ? `AND date >= ${dateFilter.gte} AND date <= ${dateFilter.lte}` : ''}
        AND amount_cents > 0
      GROUP BY EXTRACT(DOW FROM date)
      ORDER BY day_of_week
    `;

    return {
      hourlyPatterns,
      weeklyPatterns,
      analysisDate: new Date(),
    };
  }

  /**
   * Analyze merchant frequency and preferences
   */
  private async analyzeMerchantFrequency(
    householdId: string,
    userId?: string,
    dateFilter?: any,
  ) {
    const where: any = { householdId };
    if (userId) where.createdBy = userId;
    if (dateFilter) where.date = dateFilter;

    const merchantStats = await this.prisma.transaction.groupBy({
      by: ['merchant'],
      where: {
        ...where,
        merchant: { not: null },
        amountCents: { gt: 0 },
      },
      _sum: { amountCents: true },
      _count: { merchant: true },
      _avg: { amountCents: true },
      orderBy: { _count: { merchant: 'desc' } },
      take: 50,
    });

    const merchantFrequency = merchantStats.map(stat => ({
      merchant: stat.merchant,
      visitCount: stat._count.merchant,
      totalSpent: stat._sum.amountCents,
      averageSpent: stat._avg.amountCents,
    }));

    return {
      merchantFrequency,
      totalMerchants: merchantFrequency.length,
      analysisDate: new Date(),
    };
  }

  /**
   * Get stored spending patterns
   */
  async getSpendingPatterns(householdId: string, userId?: string) {
    const where: any = { householdId };
    if (userId) where.userId = userId;

    return this.prisma.spendingPattern.findMany({
      where,
      orderBy: [
        { confidenceScore: 'desc' },
        { frequency: 'desc' },
      ],
    });
  }

  /**
   * Get financial insights
   */
  async getFinancialInsights(householdId: string) {
    return this.prisma.financialInsight.findMany({
      where: {
        householdId,
        isDismissed: false,
        OR: [
          { validUntil: null },
          { validUntil: { gt: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Helper methods for pattern detection
  private detectDailyPatterns(transactions: any[]): SpendingPatternData[] {
    const patterns: SpendingPatternData[] = [];
    
    // Group by hour of day
    const hourlyGroups = transactions.reduce((acc, tx) => {
      const hour = new Date(tx.createdAt).getHours();
      if (!acc[hour]) acc[hour] = [];
      acc[hour].push(tx);
      return acc;
    }, {} as Record<number, any[]>);

    Object.entries(hourlyGroups).forEach(([hour, txs]) => {
      if (txs.length >= 3) { // Minimum frequency for pattern
        const avgAmount = txs.reduce((sum, tx) => sum + Number(tx.amountCents), 0) / txs.length;
        const confidence = Math.min(txs.length / 10, 1); // Max confidence at 10+ transactions

        patterns.push({
          householdId: txs[0].householdId,
          patternType: 'DAILY',
          hourOfDay: parseInt(hour),
          averageAmountCents: Math.round(avgAmount),
          frequency: txs.length,
          confidenceScore: confidence,
        });
      }
    });

    return patterns;
  }

  private detectWeeklyPatterns(transactions: any[]): SpendingPatternData[] {
    const patterns: SpendingPatternData[] = [];
    
    // Group by day of week
    const weeklyGroups = transactions.reduce((acc, tx) => {
      const dayOfWeek = new Date(tx.date).getDay();
      if (!acc[dayOfWeek]) acc[dayOfWeek] = [];
      acc[dayOfWeek].push(tx);
      return acc;
    }, {} as Record<number, any[]>);

    Object.entries(weeklyGroups).forEach(([day, txs]) => {
      if (txs.length >= 4) { // Minimum frequency for pattern
        const avgAmount = txs.reduce((sum, tx) => sum + Number(tx.amountCents), 0) / txs.length;
        const confidence = Math.min(txs.length / 20, 1); // Max confidence at 20+ transactions

        patterns.push({
          householdId: txs[0].householdId,
          patternType: 'WEEKLY',
          dayOfWeek: parseInt(day),
          averageAmountCents: Math.round(avgAmount),
          frequency: txs.length,
          confidenceScore: confidence,
        });
      }
    });

    return patterns;
  }

  private detectMonthlyPatterns(transactions: any[]): SpendingPatternData[] {
    const patterns: SpendingPatternData[] = [];
    
    // Group by month
    const monthlyGroups = transactions.reduce((acc, tx) => {
      const month = new Date(tx.date).getMonth() + 1;
      if (!acc[month]) acc[month] = [];
      acc[month].push(tx);
      return acc;
    }, {} as Record<number, any[]>);

    Object.entries(monthlyGroups).forEach(([month, txs]) => {
      if (txs.length >= 2) { // Minimum frequency for pattern
        const avgAmount = txs.reduce((sum, tx) => sum + Number(tx.amountCents), 0) / txs.length;
        const confidence = Math.min(txs.length / 12, 1); // Max confidence at 12+ transactions

        patterns.push({
          householdId: txs[0].householdId,
          patternType: 'SEASONAL',
          month: parseInt(month),
          averageAmountCents: Math.round(avgAmount),
          frequency: txs.length,
          confidenceScore: confidence,
        });
      }
    });

    return patterns;
  }

  private async storeSpendingPatterns(
    householdId: string,
    userId: string | undefined,
    patterns: SpendingPatternData[],
  ) {
    // Delete existing patterns for this household/user
    await this.prisma.spendingPattern.deleteMany({
      where: { householdId, userId },
    });

    // Insert new patterns
    if (patterns.length > 0) {
      await this.prisma.spendingPattern.createMany({
        data: patterns.map(pattern => ({
          ...pattern,
          userId,
        })),
      });
    }
  }

  private analyzeSessionPatterns(events: any[]) {
    // Group events by session
    const sessions = events.reduce((acc, event) => {
      const sessionId = event.sessionId || 'unknown';
      if (!acc[sessionId]) acc[sessionId] = [];
      acc[sessionId].push(event);
      return acc;
    }, {} as Record<string, any[]>);

    const sessionStats = Object.values(sessions).map(sessionEvents => {
      const sortedEvents = sessionEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const duration = sortedEvents.length > 1 
        ? new Date(sortedEvents[sortedEvents.length - 1].timestamp).getTime() - 
          new Date(sortedEvents[0].timestamp).getTime()
        : 0;

      return {
        sessionId: sortedEvents[0].sessionId,
        eventCount: sessionEvents.length,
        duration: duration / 1000 / 60, // minutes
        startTime: sortedEvents[0].timestamp,
        endTime: sortedEvents[sortedEvents.length - 1].timestamp,
      };
    });

    return {
      totalSessions: sessionStats.length,
      averageSessionDuration: sessionStats.reduce((sum, s) => sum + s.duration, 0) / sessionStats.length,
      averageEventsPerSession: sessionStats.reduce((sum, s) => sum + s.eventCount, 0) / sessionStats.length,
      sessions: sessionStats,
    };
  }

  private analyzeFeatureUsage(events: any[]) {
    const featureEvents = events.filter(e => e.eventType === 'FEATURE_USED');
    
    const featureUsage = featureEvents.reduce((acc, event) => {
      const feature = event.eventData?.feature || 'unknown';
      if (!acc[feature]) {
        acc[feature] = { count: 0, users: new Set() };
      }
      acc[feature].count++;
      acc[feature].users.add(event.userId);
      return acc;
    }, {} as Record<string, { count: number; users: Set<string> }>);

    return Object.entries(featureUsage).map(([feature, data]) => ({
      feature,
      usageCount: data.count,
      uniqueUsers: data.users.size,
    })).sort((a, b) => b.usageCount - a.usageCount);
  }

  private analyzeNavigationPatterns(events: any[]) {
    const pageViews = events.filter(e => e.eventType === 'PAGE_VIEWED');
    
    const pageStats = pageViews.reduce((acc, event) => {
      const page = event.eventData?.page || 'unknown';
      if (!acc[page]) acc[page] = 0;
      acc[page]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(pageStats).map(([page, count]) => ({
      page,
      viewCount: count,
    })).sort((a, b) => b.viewCount - a.viewCount);
  }

  private buildDateFilter(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return undefined;
    
    const filter: any = {};
    if (startDate) filter.gte = new Date(startDate);
    if (endDate) filter.lte = new Date(endDate);
    
    return filter;
  }
}
