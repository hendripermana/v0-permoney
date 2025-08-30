import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { MaterializedViewRefreshStatus } from '../types/analytics.types';

@Injectable()
export class MaterializedViewService {
  private readonly logger = new Logger(MaterializedViewService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly REFRESH_LOCK_TTL = 1800; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create materialized views for performance optimization
   */
  async createMaterializedViews(): Promise<void> {
    this.logger.log('Creating materialized views for analytics performance');

    try {
      // Daily spending summary view
      await this.createDailySpendingSummaryView();
      
      // Monthly category breakdown view
      await this.createMonthlyCategoryBreakdownView();
      
      // Account balance history view
      await this.createAccountBalanceHistoryView();
      
      // Net worth tracking view
      await this.createNetWorthTrackingView();
      
      // Merchant spending analysis view
      await this.createMerchantSpendingView();
      
      // Category trend analysis view
      await this.createCategoryTrendView();
      
      // Cashflow analysis view
      await this.createCashflowAnalysisView();

      this.logger.log('Successfully created all materialized views');
    } catch (error) {
      this.logger.error('Failed to create materialized views:', error);
      throw error;
    }
  }

  /**
   * Refresh a specific materialized view
   */
  async refreshMaterializedView(viewName: string, force = false): Promise<MaterializedViewRefreshStatus> {
    const lockKey = `refresh_lock:${viewName}`;
    const statusKey = `refresh_status:${viewName}`;

    try {
      // Check if refresh is already in progress
      if (!force) {
        const isLocked = await this.cacheService.get(lockKey);
        if (isLocked) {
          const status = await this.cacheService.get(statusKey);
          return status || {
            viewName,
            lastRefreshed: new Date(),
            nextRefresh: new Date(),
            status: 'REFRESHING',
          };
        }
      }

      // Set refresh lock
      await this.cacheService.set(lockKey, 'true', this.REFRESH_LOCK_TTL);

      const startTime = Date.now();
      const status: MaterializedViewRefreshStatus = {
        viewName,
        lastRefreshed: new Date(),
        nextRefresh: new Date(Date.now() + 3600000), // 1 hour from now
        status: 'REFRESHING',
      };

      await this.cacheService.set(statusKey, status, this.CACHE_TTL);

      // Perform the actual refresh
      await this.performViewRefresh(viewName);

      const duration = Date.now() - startTime;
      status.status = 'COMPLETED';
      status.duration = duration;

      await this.cacheService.set(statusKey, status, this.CACHE_TTL);
      await this.cacheService.delete(lockKey);

      this.logger.log(`Successfully refreshed materialized view ${viewName} in ${duration}ms`);
      return status;

    } catch (error) {
      const status: MaterializedViewRefreshStatus = {
        viewName,
        lastRefreshed: new Date(),
        nextRefresh: new Date(Date.now() + 3600000),
        status: 'FAILED',
        error: error.message,
      };

      await this.cacheService.set(statusKey, status, this.CACHE_TTL);
      await this.cacheService.delete(lockKey);

      this.logger.error(`Failed to refresh materialized view ${viewName}:`, error);
      throw error;
    }
  }

  /**
   * Refresh all materialized views
   */
  async refreshAllViews(force = false): Promise<MaterializedViewRefreshStatus[]> {
    const viewNames = [
      'daily_spending_summary',
      'monthly_category_breakdown',
      'account_balance_history',
      'net_worth_tracking',
      'merchant_spending_analysis',
      'category_trend_analysis',
      'cashflow_analysis',
    ];

    const results = await Promise.allSettled(
      viewNames.map(viewName => this.refreshMaterializedView(viewName, force))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          viewName: viewNames[index],
          lastRefreshed: new Date(),
          nextRefresh: new Date(),
          status: 'FAILED' as const,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Get refresh status for all views
   */
  async getRefreshStatus(): Promise<MaterializedViewRefreshStatus[]> {
    const viewNames = [
      'daily_spending_summary',
      'monthly_category_breakdown',
      'account_balance_history',
      'net_worth_tracking',
      'merchant_spending_analysis',
      'category_trend_analysis',
      'cashflow_analysis',
    ];

    const statuses = await Promise.all(
      viewNames.map(async (viewName) => {
        const cached = await this.cacheService.get(`refresh_status:${viewName}`);
        return cached || {
          viewName,
          lastRefreshed: new Date(0),
          nextRefresh: new Date(),
          status: 'COMPLETED' as const,
        };
      })
    );

    return statuses;
  }

  /**
   * Create daily spending summary materialized view
   */
  private async createDailySpendingSummaryView(): Promise<void> {
    await this.prisma.$executeRaw`
      CREATE MATERIALIZED VIEW IF NOT EXISTS daily_spending_summary AS
      SELECT
        household_id,
        date_trunc('day', date) AS day,
        category_id,
        currency,
        SUM(CASE WHEN amount_cents > 0 THEN amount_cents ELSE 0 END) as total_income_cents,
        SUM(CASE WHEN amount_cents < 0 THEN ABS(amount_cents) ELSE 0 END) as total_expense_cents,
        COUNT(*) as transaction_count,
        AVG(ABS(amount_cents)) as avg_amount_cents,
        COUNT(DISTINCT account_id) as accounts_used,
        COUNT(DISTINCT COALESCE(merchant_id, merchant)) as merchants_used
      FROM transactions
      WHERE transfer_account_id IS NULL -- Exclude transfers
      GROUP BY household_id, date_trunc('day', date), category_id, currency
    `;

    await this.prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_spending_summary_unique 
      ON daily_spending_summary (household_id, day, category_id, currency)
    `;

    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_daily_spending_summary_household_day 
      ON daily_spending_summary (household_id, day DESC)
    `;
  }

  /**
   * Create monthly category breakdown materialized view
   */
  private async createMonthlyCategoryBreakdownView(): Promise<void> {
    await this.prisma.$executeRaw`
      CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_category_breakdown AS
      SELECT
        t.household_id,
        date_trunc('month', t.date) AS month,
        c.id as category_id,
        c.name as category_name,
        c.parent_id as parent_category_id,
        pc.name as parent_category_name,
        t.currency,
        SUM(CASE WHEN t.amount_cents > 0 THEN t.amount_cents ELSE 0 END) as total_income_cents,
        SUM(CASE WHEN t.amount_cents < 0 THEN ABS(t.amount_cents) ELSE 0 END) as total_expense_cents,
        COUNT(*) as transaction_count,
        AVG(ABS(t.amount_cents)) as avg_amount_cents,
        COUNT(DISTINCT t.account_id) as accounts_used,
        COUNT(DISTINCT COALESCE(t.merchant_id, t.merchant)) as merchants_used
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN categories pc ON c.parent_id = pc.id
      WHERE t.transfer_account_id IS NULL
      GROUP BY t.household_id, date_trunc('month', t.date), c.id, c.name, c.parent_id, pc.name, t.currency
    `;

    await this.prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_category_breakdown_unique 
      ON monthly_category_breakdown (household_id, month, category_id, currency)
    `;
  }

  /**
   * Create account balance history materialized view
   */
  private async createAccountBalanceHistoryView(): Promise<void> {
    await this.prisma.$executeRaw`
      CREATE MATERIALIZED VIEW IF NOT EXISTS account_balance_history AS
      WITH daily_balances AS (
        SELECT
          a.id as account_id,
          a.household_id,
          a.name as account_name,
          a.type as account_type,
          a.subtype as account_subtype,
          a.currency,
          date_trunc('day', t.date) as date,
          SUM(
            CASE
              WHEN le.type = 'DEBIT' AND a.type = 'ASSET' THEN le.amount_cents
              WHEN le.type = 'CREDIT' AND a.type = 'ASSET' THEN -le.amount_cents
              WHEN le.type = 'DEBIT' AND a.type = 'LIABILITY' THEN -le.amount_cents
              WHEN le.type = 'CREDIT' AND a.type = 'LIABILITY' THEN le.amount_cents
              ELSE 0
            END
          ) OVER (
            PARTITION BY a.id 
            ORDER BY date_trunc('day', t.date) 
            ROWS UNBOUNDED PRECEDING
          ) as running_balance_cents
        FROM accounts a
        JOIN ledger_entries le ON a.id = le.account_id
        JOIN transactions t ON le.transaction_id = t.id
        WHERE a.is_active = true
      )
      SELECT DISTINCT
        account_id,
        household_id,
        account_name,
        account_type,
        account_subtype,
        currency,
        date,
        LAST_VALUE(running_balance_cents) OVER (
          PARTITION BY account_id, date 
          ORDER BY date 
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as balance_cents
      FROM daily_balances
    `;

    await this.prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_account_balance_history_unique 
      ON account_balance_history (account_id, date)
    `;
  }

  /**
   * Create net worth tracking materialized view
   */
  private async createNetWorthTrackingView(): Promise<void> {
    await this.prisma.$executeRaw`
      CREATE MATERIALIZED VIEW IF NOT EXISTS net_worth_tracking AS
      SELECT
        household_id,
        date,
        currency,
        SUM(CASE WHEN account_type = 'ASSET' THEN balance_cents ELSE 0 END) as total_assets_cents,
        SUM(CASE WHEN account_type = 'LIABILITY' THEN balance_cents ELSE 0 END) as total_liabilities_cents,
        SUM(CASE WHEN account_type = 'ASSET' THEN balance_cents ELSE -balance_cents END) as net_worth_cents
      FROM account_balance_history
      GROUP BY household_id, date, currency
    `;

    await this.prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_net_worth_tracking_unique 
      ON net_worth_tracking (household_id, date, currency)
    `;
  }

  /**
   * Create merchant spending analysis materialized view
   */
  private async createMerchantSpendingView(): Promise<void> {
    await this.prisma.$executeRaw`
      CREATE MATERIALIZED VIEW IF NOT EXISTS merchant_spending_analysis AS
      SELECT
        household_id,
        COALESCE(merchant_name, merchant, 'Unknown') as merchant_name,
        merchant_id,
        currency,
        COUNT(*) as transaction_count,
        SUM(ABS(amount_cents)) as total_spent_cents,
        AVG(ABS(amount_cents)) as avg_spent_cents,
        MIN(date) as first_transaction,
        MAX(date) as last_transaction,
        COUNT(DISTINCT date_trunc('month', date)) as months_active,
        COUNT(DISTINCT category_id) as categories_used
      FROM transactions
      WHERE amount_cents < 0 -- Only expenses
        AND transfer_account_id IS NULL
        AND (merchant IS NOT NULL OR merchant_name IS NOT NULL OR merchant_id IS NOT NULL)
      GROUP BY household_id, COALESCE(merchant_name, merchant, 'Unknown'), merchant_id, currency
      HAVING COUNT(*) >= 2 -- Only merchants with multiple transactions
    `;

    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_merchant_spending_household 
      ON merchant_spending_analysis (household_id, total_spent_cents DESC)
    `;
  }

  /**
   * Create category trend analysis materialized view
   */
  private async createCategoryTrendView(): Promise<void> {
    await this.prisma.$executeRaw`
      CREATE MATERIALIZED VIEW IF NOT EXISTS category_trend_analysis AS
      WITH monthly_category_totals AS (
        SELECT
          household_id,
          category_id,
          currency,
          date_trunc('month', date) as month,
          SUM(ABS(amount_cents)) as monthly_total_cents,
          COUNT(*) as monthly_transaction_count
        FROM transactions
        WHERE transfer_account_id IS NULL
          AND category_id IS NOT NULL
        GROUP BY household_id, category_id, currency, date_trunc('month', date)
      ),
      category_trends AS (
        SELECT
          household_id,
          category_id,
          currency,
          month,
          monthly_total_cents,
          monthly_transaction_count,
          LAG(monthly_total_cents) OVER (
            PARTITION BY household_id, category_id, currency 
            ORDER BY month
          ) as prev_month_total_cents,
          AVG(monthly_total_cents) OVER (
            PARTITION BY household_id, category_id, currency 
            ORDER BY month 
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
          ) as three_month_avg_cents
        FROM monthly_category_totals
      )
      SELECT
        ct.*,
        c.name as category_name,
        CASE
          WHEN prev_month_total_cents IS NULL THEN 'NEW'
          WHEN monthly_total_cents > prev_month_total_cents * 1.1 THEN 'UP'
          WHEN monthly_total_cents < prev_month_total_cents * 0.9 THEN 'DOWN'
          ELSE 'STABLE'
        END as trend_direction,
        CASE
          WHEN prev_month_total_cents > 0 THEN
            ((monthly_total_cents - prev_month_total_cents) * 100.0 / prev_month_total_cents)
          ELSE 0
        END as trend_percentage
      FROM category_trends ct
      JOIN categories c ON ct.category_id = c.id
    `;

    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_category_trend_household_month 
      ON category_trend_analysis (household_id, month DESC, category_id)
    `;
  }

  /**
   * Create cashflow analysis materialized view
   */
  private async createCashflowAnalysisView(): Promise<void> {
    await this.prisma.$executeRaw`
      CREATE MATERIALIZED VIEW IF NOT EXISTS cashflow_analysis AS
      SELECT
        household_id,
        date_trunc('month', date) as month,
        currency,
        SUM(CASE WHEN amount_cents > 0 THEN amount_cents ELSE 0 END) as total_inflow_cents,
        SUM(CASE WHEN amount_cents < 0 THEN ABS(amount_cents) ELSE 0 END) as total_outflow_cents,
        SUM(amount_cents) as net_cashflow_cents,
        COUNT(CASE WHEN amount_cents > 0 THEN 1 END) as inflow_transaction_count,
        COUNT(CASE WHEN amount_cents < 0 THEN 1 END) as outflow_transaction_count,
        AVG(CASE WHEN amount_cents > 0 THEN amount_cents END) as avg_inflow_cents,
        AVG(CASE WHEN amount_cents < 0 THEN ABS(amount_cents) END) as avg_outflow_cents
      FROM transactions
      WHERE transfer_account_id IS NULL -- Exclude transfers
      GROUP BY household_id, date_trunc('month', date), currency
    `;

    await this.prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_cashflow_analysis_unique 
      ON cashflow_analysis (household_id, month, currency)
    `;
  }

  /**
   * Perform the actual view refresh
   */
  private async performViewRefresh(viewName: string): Promise<void> {
    await this.prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`;
  }

  /**
   * Drop all materialized views (for cleanup/reset)
   */
  async dropMaterializedViews(): Promise<void> {
    const viewNames = [
      'daily_spending_summary',
      'monthly_category_breakdown',
      'account_balance_history',
      'net_worth_tracking',
      'merchant_spending_analysis',
      'category_trend_analysis',
      'cashflow_analysis',
    ];

    for (const viewName of viewNames) {
      try {
        await this.prisma.$executeRaw`DROP MATERIALIZED VIEW IF EXISTS ${viewName} CASCADE`;
        this.logger.log(`Dropped materialized view: ${viewName}`);
      } catch (error) {
        this.logger.warn(`Failed to drop materialized view ${viewName}:`, error);
      }
    }
  }
}
