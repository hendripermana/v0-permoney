import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GratitudeEntry, GratitudeType, Prisma } from '@prisma/client';
import {
  CreateGratitudeEntryDto,
  UpdateGratitudeEntryDto,
  GratitudeFiltersDto,
  GratitudeSummaryDto,
  GratitudeTypeBreakdown,
  GiverBreakdown,
  MonthlyGratitudeTrend,
  RelationshipInsightsDto,
  RelationshipInsight,
  GiverRelationshipAnalysis,
  ReciprocityAnalysis,
} from './dto';

@Injectable()
export class GratitudeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    householdId: string,
    userId: string,
    createGratitudeEntryDto: CreateGratitudeEntryDto,
  ): Promise<GratitudeEntry> {
    // Verify user has access to the household
    await this.verifyHouseholdAccess(householdId, userId);

    // Validate category belongs to household if provided
    if (createGratitudeEntryDto.categoryId) {
      await this.validateCategoryAccess(householdId, createGratitudeEntryDto.categoryId);
    }

    // Validate transaction belongs to household if provided
    if (createGratitudeEntryDto.transactionId) {
      await this.validateTransactionAccess(householdId, createGratitudeEntryDto.transactionId);
    }

    return this.prisma.gratitudeEntry.create({
      data: {
        ...createGratitudeEntryDto,
        householdId,
        createdBy: userId,
        date: new Date(createGratitudeEntryDto.date),
      },
      include: {
        category: true,
        transaction: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(
    householdId: string,
    userId: string,
    filters: GratitudeFiltersDto,
    page = 1,
    limit = 20,
  ): Promise<{ entries: GratitudeEntry[]; total: number; totalPages: number }> {
    await this.verifyHouseholdAccess(householdId, userId);

    const where: Prisma.GratitudeEntryWhereInput = {
      householdId,
      ...(filters.type && { type: filters.type }),
      ...(filters.giver && { giver: { contains: filters.giver, mode: 'insensitive' } }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.search && {
        description: { contains: filters.search, mode: 'insensitive' },
      }),
      ...(filters.fromDate && { date: { gte: new Date(filters.fromDate) } }),
      ...(filters.toDate && { date: { lte: new Date(filters.toDate) } }),
    };

    const [entries, total] = await Promise.all([
      this.prisma.gratitudeEntry.findMany({
        where,
        include: {
          category: true,
          transaction: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.gratitudeEntry.count({ where }),
    ]);

    return {
      entries,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(householdId: string, userId: string, id: string): Promise<GratitudeEntry> {
    await this.verifyHouseholdAccess(householdId, userId);

    const entry = await this.prisma.gratitudeEntry.findFirst({
      where: { id, householdId },
      include: {
        category: true,
        transaction: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Gratitude entry not found');
    }

    return entry;
  }

  async update(
    householdId: string,
    userId: string,
    id: string,
    updateGratitudeEntryDto: UpdateGratitudeEntryDto,
  ): Promise<GratitudeEntry> {
    await this.verifyHouseholdAccess(householdId, userId);

    const existingEntry = await this.prisma.gratitudeEntry.findFirst({
      where: { id, householdId },
    });

    if (!existingEntry) {
      throw new NotFoundException('Gratitude entry not found');
    }

    // Validate category belongs to household if provided
    if (updateGratitudeEntryDto.categoryId) {
      await this.validateCategoryAccess(householdId, updateGratitudeEntryDto.categoryId);
    }

    // Validate transaction belongs to household if provided
    if (updateGratitudeEntryDto.transactionId) {
      await this.validateTransactionAccess(householdId, updateGratitudeEntryDto.transactionId);
    }

    return this.prisma.gratitudeEntry.update({
      where: { id },
      data: {
        ...updateGratitudeEntryDto,
        ...(updateGratitudeEntryDto.date && { date: new Date(updateGratitudeEntryDto.date) }),
      },
      include: {
        category: true,
        transaction: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(householdId: string, userId: string, id: string): Promise<void> {
    await this.verifyHouseholdAccess(householdId, userId);

    const existingEntry = await this.prisma.gratitudeEntry.findFirst({
      where: { id, householdId },
    });

    if (!existingEntry) {
      throw new NotFoundException('Gratitude entry not found');
    }

    await this.prisma.gratitudeEntry.delete({
      where: { id },
    });
  }

  async getSummary(
    householdId: string,
    userId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<GratitudeSummaryDto> {
    await this.verifyHouseholdAccess(householdId, userId);

    const where: Prisma.GratitudeEntryWhereInput = {
      householdId,
      ...(fromDate && { date: { gte: new Date(fromDate) } }),
      ...(toDate && { date: { lte: new Date(toDate) } }),
    };

    // Get basic summary
    const [totalEntries, totalValue] = await Promise.all([
      this.prisma.gratitudeEntry.count({ where }),
      this.prisma.gratitudeEntry.aggregate({
        where: {
          ...where,
          estimatedValueCents: { not: null },
        },
        _sum: { estimatedValueCents: true },
      }),
    ]);

    // Get breakdown by type
    const typeBreakdown = await this.prisma.gratitudeEntry.groupBy({
      by: ['type'],
      where,
      _count: { type: true },
      _sum: { estimatedValueCents: true },
      _avg: { estimatedValueCents: true },
    });

    const byType: GratitudeTypeBreakdown[] = typeBreakdown.map((item) => ({
      type: item.type,
      count: item._count.type,
      totalValueCents: Number(item._sum.estimatedValueCents || 0),
      averageValueCents: Number(item._avg.estimatedValueCents || 0),
    }));

    // Get top givers
    const giverBreakdown = await this.prisma.gratitudeEntry.groupBy({
      by: ['giver'],
      where,
      _count: { giver: true },
      _sum: { estimatedValueCents: true },
      _max: { date: true },
      orderBy: { _count: { giver: 'desc' } },
      take: 10,
    });

    const topGivers: GiverBreakdown[] = giverBreakdown.map((item) => ({
      giver: item.giver,
      count: item._count.giver,
      totalValueCents: Number(item._sum.estimatedValueCents || 0),
      lastGratitudeDate: item._max.date,
    }));

    // Get monthly trend (last 12 months)
    const monthlyTrend = await this.getMonthlyTrend(householdId, 12);

    return {
      totalEntries,
      totalValueCents: Number(totalValue._sum.estimatedValueCents || 0),
      currency: 'IDR', // Default currency, could be made configurable
      byType,
      topGivers,
      monthlyTrend,
    };
  }

  async getRelationshipInsights(
    householdId: string,
    userId: string,
  ): Promise<RelationshipInsightsDto> {
    await this.verifyHouseholdAccess(householdId, userId);

    const [insights, giverAnalysis, reciprocityAnalysis] = await Promise.all([
      this.generateRelationshipInsights(householdId),
      this.analyzeGiverRelationships(householdId),
      this.analyzeReciprocity(householdId),
    ]);

    return {
      insights,
      giverAnalysis,
      reciprocityAnalysis,
    };
  }

  private async verifyHouseholdAccess(householdId: string, userId: string): Promise<void> {
    const member = await this.prisma.householdMember.findFirst({
      where: { householdId, userId },
    });

    if (!member) {
      throw new ForbiddenException('Access denied to this household');
    }
  }

  private async validateCategoryAccess(householdId: string, categoryId: string): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ householdId }, { householdId: null }], // Allow global categories
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found or not accessible');
    }
  }

  private async validateTransactionAccess(
    householdId: string,
    transactionId: string,
  ): Promise<void> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, householdId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found or not accessible');
    }
  }

  private async getMonthlyTrend(
    householdId: string,
    months: number,
  ): Promise<MonthlyGratitudeTrend[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

    const monthlyData = await this.prisma.$queryRaw<
      Array<{ month: string; count: bigint; total_value_cents: bigint }>
    >`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COUNT(*)::bigint as count,
        COALESCE(SUM(estimated_value_cents), 0)::bigint as total_value_cents
      FROM gratitude_entries 
      WHERE household_id = ${householdId}::uuid 
        AND date >= ${startDate}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month
    `;

    return monthlyData.map((item) => ({
      month: item.month,
      count: Number(item.count),
      totalValueCents: Number(item.total_value_cents),
    }));
  }

  private async generateRelationshipInsights(householdId: string): Promise<RelationshipInsight[]> {
    const insights: RelationshipInsight[] = [];

    // Get household members for context
    const members = await this.prisma.householdMember.findMany({
      where: { householdId },
      include: { user: true },
    });

    // Insight 1: Most generous giver
    const topGiver = await this.prisma.gratitudeEntry.groupBy({
      by: ['giver'],
      where: { householdId },
      _count: { giver: true },
      _sum: { estimatedValueCents: true },
      orderBy: { _count: { giver: 'desc' } },
      take: 1,
    });

    if (topGiver.length > 0) {
      insights.push({
        type: 'TOP_GIVER',
        title: 'Most Generous Person',
        description: `${topGiver[0].giver} has shown the most gratitude with ${topGiver[0]._count.giver} entries`,
        data: {
          giver: topGiver[0].giver,
          count: topGiver[0]._count.giver,
          totalValue: Number(topGiver[0]._sum.estimatedValueCents || 0),
        },
        confidence: 0.9,
      });
    }

    // Insight 2: Most common gratitude type
    const topType = await this.prisma.gratitudeEntry.groupBy({
      by: ['type'],
      where: { householdId },
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } },
      take: 1,
    });

    if (topType.length > 0) {
      insights.push({
        type: 'COMMON_TYPE',
        title: 'Most Common Gratitude Type',
        description: `${topType[0].type.toLowerCase()} is the most common way gratitude is expressed in your household`,
        data: {
          type: topType[0].type,
          count: topType[0]._count.type,
        },
        confidence: 0.8,
      });
    }

    // Insight 3: Recent gratitude trend
    const recentEntries = await this.prisma.gratitudeEntry.count({
      where: {
        householdId,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    const previousEntries = await this.prisma.gratitudeEntry.count({
      where: {
        householdId,
        date: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 30-60 days ago
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentEntries > 0 || previousEntries > 0) {
      const trend = recentEntries > previousEntries ? 'increasing' : 
                   recentEntries < previousEntries ? 'decreasing' : 'stable';
      
      insights.push({
        type: 'TREND',
        title: 'Gratitude Trend',
        description: `Gratitude expressions are ${trend} compared to last month`,
        data: {
          recentCount: recentEntries,
          previousCount: previousEntries,
          trend,
        },
        confidence: 0.7,
      });
    }

    return insights;
  }

  private async analyzeGiverRelationships(
    householdId: string,
  ): Promise<GiverRelationshipAnalysis[]> {
    const giverStats = await this.prisma.gratitudeEntry.groupBy({
      by: ['giver', 'type'],
      where: { householdId },
      _count: { giver: true },
      _sum: { estimatedValueCents: true },
      _max: { date: true },
      _min: { date: true },
    });

    // Group by giver
    const giverMap = new Map<string, any>();
    
    giverStats.forEach((stat) => {
      if (!giverMap.has(stat.giver)) {
        giverMap.set(stat.giver, {
          giver: stat.giver,
          totalCount: 0,
          totalValue: 0,
          types: new Map(),
          firstDate: stat._min.date,
          lastDate: stat._max.date,
        });
      }

      const giver = giverMap.get(stat.giver);
      giver.totalCount += stat._count.giver;
      giver.totalValue += Number(stat._sum.estimatedValueCents || 0);
      giver.types.set(stat.type, stat._count.giver);
      
      if (stat._min.date < giver.firstDate) giver.firstDate = stat._min.date;
      if (stat._max.date > giver.lastDate) giver.lastDate = stat._max.date;
    });

    return Array.from(giverMap.values()).map((giver) => {
      // Find primary gratitude type
      let primaryType = GratitudeType.TREAT;
      let maxCount = 0;
      
      for (const [type, count] of giver.types) {
        if (count > maxCount) {
          maxCount = count;
          primaryType = type;
        }
      }

      // Calculate frequency (entries per month)
      const monthsDiff = Math.max(1, 
        (giver.lastDate.getTime() - giver.firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      const averageFrequency = giver.totalCount / monthsDiff;

      // Calculate relationship strength (0-100)
      const relationshipStrength = Math.min(100, 
        (giver.totalCount * 10) + (averageFrequency * 20) + (giver.totalValue / 10000)
      );

      // Calculate generosity score
      const generosityScore = Math.min(100,
        (giver.totalValue / 1000) + (giver.totalCount * 5)
      );

      return {
        giver: giver.giver,
        relationshipStrength: Math.round(relationshipStrength),
        primaryGratitudeType: primaryType,
        averageFrequency: Math.round(averageFrequency * 100) / 100,
        generosityScore: Math.round(generosityScore),
        trend: 'stable', // Simplified for now
      };
    });
  }

  private async analyzeReciprocity(householdId: string): Promise<ReciprocityAnalysis[]> {
    // Get all household members
    const members = await this.prisma.householdMember.findMany({
      where: { householdId },
      include: { user: true },
    });

    const memberNames = members.map(m => m.user.name);
    const reciprocityAnalysis: ReciprocityAnalysis[] = [];

    // Analyze reciprocity between each pair of members
    for (let i = 0; i < memberNames.length; i++) {
      for (let j = i + 1; j < memberNames.length; j++) {
        const person1 = memberNames[i];
        const person2 = memberNames[j];

        // Count gratitude from person1 about person2
        const person1ToPerson2 = await this.prisma.gratitudeEntry.count({
          where: {
            householdId,
            createdBy: members[i].userId,
            giver: person2,
          },
        });

        // Count gratitude from person2 about person1
        const person2ToPerson1 = await this.prisma.gratitudeEntry.count({
          where: {
            householdId,
            createdBy: members[j].userId,
            giver: person1,
          },
        });

        if (person1ToPerson2 > 0 || person2ToPerson1 > 0) {
          const total = person1ToPerson2 + person2ToPerson1;
          const reciprocityScore = total > 0 ? 
            (Math.min(person1ToPerson2, person2ToPerson1) * 2) / total - 1 : 0;

          let relationshipType = 'balanced';
          if (reciprocityScore < -0.3) {
            relationshipType = person1ToPerson2 > person2ToPerson1 ? 
              'receiver-focused' : 'giver-focused';
          }

          reciprocityAnalysis.push({
            person1,
            person2,
            person1ToPerson2,
            person2ToPerson1,
            reciprocityScore: Math.round(reciprocityScore * 100) / 100,
            relationshipType,
          });
        }
      }
    }

    return reciprocityAnalysis;
  }
}
