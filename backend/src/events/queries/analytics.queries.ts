import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsQueries {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(householdId: string, startDate: Date, endDate: Date) {
    const metrics = await this.prisma.$queryRaw`
      SELECT 
        user_id,
        COUNT(*) as total_events,
        COUNT(DISTINCT DATE(timestamp)) as active_days,
        COUNT(DISTINCT session_id) as sessions,
        MIN(timestamp) as first_activity,
        MAX(timestamp) as last_activity,
        COUNT(DISTINCT event_type) as unique_event_types
      FROM user_events 
      WHERE household_id = ${householdId}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
      GROUP BY user_id
      ORDER BY total_events DESC
    `;

    return metrics;
  }

  /**
   * Get feature adoption rates
   */
  async getFeatureAdoptionRates(householdId: string, startDate: Date, endDate: Date) {
    const adoption = await this.prisma.$queryRaw`
      SELECT 
        event_data->>'feature' as feature_name,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) as total_usage,
        MIN(timestamp) as first_used,
        MAX(timestamp) as last_used
      FROM user_events 
      WHERE household_id = ${householdId}
        AND event_type = 'FEATURE_USED'
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
        AND event_data->>'feature' IS NOT NULL
      GROUP BY event_data->>'feature'
      ORDER BY unique_users DESC, total_usage DESC
    `;

    return adoption;
  }

  /**
   * Get spending behavior patterns
   */
  async getSpendingBehaviorPatterns(householdId: string, startDate: Date, endDate: Date) {
    const patterns = await this.prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM t.created_at) as hour_of_day,
        EXTRACT(DOW FROM t.date) as day_of_week,
        c.name as category_name,
        COUNT(*) as transaction_count,
        SUM(t.amount_cents) as total_amount,
        AVG(t.amount_cents) as avg_amount,
        STDDEV(t.amount_cents) as amount_stddev
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.household_id = ${householdId}
        AND t.date >= ${startDate}
        AND t.date <= ${endDate}
        AND t.amount_cents > 0
      GROUP BY 
        EXTRACT(HOUR FROM t.created_at),
        EXTRACT(DOW FROM t.date),
        c.id, c.name
      HAVING COUNT(*) >= 3
      ORDER BY transaction_count DESC
    `;

    return patterns;
  }

  /**
   * Get user journey analysis
   */
  async getUserJourneyAnalysis(householdId: string, userId: string, startDate: Date, endDate: Date) {
    const journey = await this.prisma.$queryRaw`
      WITH event_sequences AS (
        SELECT 
          event_type,
          timestamp,
          session_id,
          LAG(event_type) OVER (PARTITION BY session_id ORDER BY timestamp) as prev_event,
          LEAD(event_type) OVER (PARTITION BY session_id ORDER BY timestamp) as next_event,
          ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp) as event_order
        FROM user_events
        WHERE household_id = ${householdId}
          AND user_id = ${userId}
          AND timestamp >= ${startDate}
          AND timestamp <= ${endDate}
      )
      SELECT 
        prev_event,
        event_type as current_event,
        next_event,
        COUNT(*) as frequency,
        AVG(event_order) as avg_position_in_session
      FROM event_sequences
      WHERE prev_event IS NOT NULL
      GROUP BY prev_event, event_type, next_event
      ORDER BY frequency DESC
    `;

    return journey;
  }

  /**
   * Get transaction categorization accuracy
   */
  async getCategorizationAccuracy(householdId: string, startDate: Date, endDate: Date) {
    const accuracy = await this.prisma.$queryRaw`
      WITH categorization_events AS (
        SELECT 
          resource_id as transaction_id,
          event_data->>'old_category' as old_category,
          event_data->>'new_category' as new_category,
          event_data->>'source' as categorization_source,
          timestamp
        FROM user_events
        WHERE household_id = ${householdId}
          AND event_type = 'TRANSACTION_CATEGORIZED'
          AND timestamp >= ${startDate}
          AND timestamp <= ${endDate}
      )
      SELECT 
        categorization_source,
        COUNT(*) as total_categorizations,
        COUNT(CASE WHEN old_category IS NULL THEN 1 END) as initial_categorizations,
        COUNT(CASE WHEN old_category IS NOT NULL THEN 1 END) as recategorizations,
        COUNT(DISTINCT transaction_id) as unique_transactions
      FROM categorization_events
      GROUP BY categorization_source
      ORDER BY total_categorizations DESC
    `;

    return accuracy;
  }

  /**
   * Get session analysis
   */
  async getSessionAnalysis(householdId: string, startDate: Date, endDate: Date) {
    const sessions = await this.prisma.$queryRaw`
      WITH session_stats AS (
        SELECT 
          session_id,
          user_id,
          MIN(timestamp) as session_start,
          MAX(timestamp) as session_end,
          COUNT(*) as event_count,
          COUNT(DISTINCT event_type) as unique_events,
          EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 60 as duration_minutes
        FROM user_events
        WHERE household_id = ${householdId}
          AND timestamp >= ${startDate}
          AND timestamp <= ${endDate}
          AND session_id IS NOT NULL
        GROUP BY session_id, user_id
      )
      SELECT 
        user_id,
        COUNT(*) as total_sessions,
        AVG(duration_minutes) as avg_session_duration,
        AVG(event_count) as avg_events_per_session,
        AVG(unique_events) as avg_unique_events_per_session,
        MAX(duration_minutes) as max_session_duration,
        MIN(duration_minutes) as min_session_duration
      FROM session_stats
      WHERE duration_minutes > 0
      GROUP BY user_id
      ORDER BY total_sessions DESC
    `;

    return sessions;
  }

  /**
   * Get error analysis
   */
  async getErrorAnalysis(householdId: string, startDate: Date, endDate: Date) {
    const errors = await this.prisma.$queryRaw`
      SELECT 
        event_data->>'error'->>'name' as error_type,
        event_data->>'error'->>'message' as error_message,
        event_data->>'method' as http_method,
        event_data->>'url' as endpoint,
        COUNT(*) as error_count,
        COUNT(DISTINCT user_id) as affected_users,
        MIN(timestamp) as first_occurrence,
        MAX(timestamp) as last_occurrence
      FROM user_events
      WHERE household_id = ${householdId}
        AND event_type = 'ERROR_OCCURRED'
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
      GROUP BY 
        event_data->>'error'->>'name',
        event_data->>'error'->>'message',
        event_data->>'method',
        event_data->>'url'
      ORDER BY error_count DESC
    `;

    return errors;
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(householdId: string, startDate: Date, endDate: Date) {
    const performance = await this.prisma.$queryRaw`
      SELECT 
        event_data->>'method' as http_method,
        event_data->>'url' as endpoint,
        COUNT(*) as request_count,
        AVG((event_data->>'duration')::numeric) as avg_duration_ms,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (event_data->>'duration')::numeric) as median_duration_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (event_data->>'duration')::numeric) as p95_duration_ms,
        MAX((event_data->>'duration')::numeric) as max_duration_ms,
        MIN((event_data->>'duration')::numeric) as min_duration_ms
      FROM user_events
      WHERE household_id = ${householdId}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
        AND event_data->>'duration' IS NOT NULL
        AND (event_data->>'duration')::numeric > 0
      GROUP BY 
        event_data->>'method',
        event_data->>'url'
      HAVING COUNT(*) >= 10
      ORDER BY request_count DESC
    `;

    return performance;
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(householdId: string, cohortStartDate: Date, analysisEndDate: Date) {
    const cohorts = await this.prisma.$queryRaw`
      WITH user_cohorts AS (
        SELECT 
          user_id,
          DATE_TRUNC('month', MIN(timestamp)) as cohort_month
        FROM user_events
        WHERE household_id = ${householdId}
          AND timestamp >= ${cohortStartDate}
        GROUP BY user_id
      ),
      user_activity AS (
        SELECT 
          ue.user_id,
          uc.cohort_month,
          DATE_TRUNC('month', ue.timestamp) as activity_month,
          EXTRACT(MONTH FROM AGE(DATE_TRUNC('month', ue.timestamp), uc.cohort_month)) as month_number
        FROM user_events ue
        JOIN user_cohorts uc ON ue.user_id = uc.user_id
        WHERE ue.household_id = ${householdId}
          AND ue.timestamp <= ${analysisEndDate}
        GROUP BY ue.user_id, uc.cohort_month, DATE_TRUNC('month', ue.timestamp)
      )
      SELECT 
        cohort_month,
        month_number,
        COUNT(DISTINCT user_id) as active_users,
        (SELECT COUNT(DISTINCT user_id) FROM user_cohorts WHERE cohort_month = ua.cohort_month) as cohort_size
      FROM user_activity ua
      GROUP BY cohort_month, month_number
      ORDER BY cohort_month, month_number
    `;

    return cohorts;
  }

  /**
   * Get real-time dashboard metrics
   */
  async getRealTimeDashboardMetrics(householdId: string) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [dailyMetrics, weeklyMetrics, activeUsers] = await Promise.all([
      this.prisma.userEvent.groupBy({
        by: ['eventType'],
        where: {
          householdId,
          timestamp: { gte: oneDayAgo },
        },
        _count: { eventType: true },
        orderBy: { _count: { eventType: 'desc' } },
      }),

      this.prisma.userEvent.groupBy({
        by: ['eventType'],
        where: {
          householdId,
          timestamp: { gte: oneWeekAgo },
        },
        _count: { eventType: true },
        orderBy: { _count: { eventType: 'desc' } },
      }),

      this.prisma.userEvent.findMany({
        where: {
          householdId,
          timestamp: { gte: oneDayAgo },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    return {
      dailyEvents: dailyMetrics.map(m => ({
        eventType: m.eventType,
        count: m._count.eventType,
      })),
      weeklyEvents: weeklyMetrics.map(m => ({
        eventType: m.eventType,
        count: m._count.eventType,
      })),
      activeUsersToday: activeUsers.length,
      lastUpdated: now,
    };
  }
}
