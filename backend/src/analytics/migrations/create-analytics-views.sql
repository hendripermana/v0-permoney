-- Advanced Analytics & Reporting - Materialized Views
-- This file creates optimized materialized views for analytics performance

-- Enable TimescaleDB extension if not already enabled
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Daily spending summary materialized view
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
GROUP BY household_id, date_trunc('day', date), category_id, currency;

-- Create unique index for daily spending summary
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_spending_summary_unique 
ON daily_spending_summary (household_id, day, category_id, currency);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_daily_spending_summary_household_day 
ON daily_spending_summary (household_id, day DESC);

-- Monthly category breakdown materialized view
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
GROUP BY t.household_id, date_trunc('month', t.date), c.id, c.name, c.parent_id, pc.name, t.currency;

-- Create unique index for monthly category breakdown
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_category_breakdown_unique 
ON monthly_category_breakdown (household_id, month, category_id, currency);

-- Account balance history materialized view
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
FROM daily_balances;

-- Create unique index for account balance history
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_balance_history_unique 
ON account_balance_history (account_id, date);

-- Net worth tracking materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS net_worth_tracking AS
SELECT
  household_id,
  date,
  currency,
  SUM(CASE WHEN account_type = 'ASSET' THEN balance_cents ELSE 0 END) as total_assets_cents,
  SUM(CASE WHEN account_type = 'LIABILITY' THEN balance_cents ELSE 0 END) as total_liabilities_cents,
  SUM(CASE WHEN account_type = 'ASSET' THEN balance_cents ELSE -balance_cents END) as net_worth_cents
FROM account_balance_history
GROUP BY household_id, date, currency;

-- Create unique index for net worth tracking
CREATE UNIQUE INDEX IF NOT EXISTS idx_net_worth_tracking_unique 
ON net_worth_tracking (household_id, date, currency);

-- Merchant spending analysis materialized view
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
HAVING COUNT(*) >= 2; -- Only merchants with multiple transactions

-- Create index for merchant spending analysis
CREATE INDEX IF NOT EXISTS idx_merchant_spending_household 
ON merchant_spending_analysis (household_id, total_spent_cents DESC);

-- Category trend analysis materialized view
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
JOIN categories c ON ct.category_id = c.id;

-- Create index for category trend analysis
CREATE INDEX IF NOT EXISTS idx_category_trend_household_month 
ON category_trend_analysis (household_id, month DESC, category_id);

-- Cashflow analysis materialized view
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
GROUP BY household_id, date_trunc('month', date), currency;

-- Create unique index for cashflow analysis
CREATE UNIQUE INDEX IF NOT EXISTS idx_cashflow_analysis_unique 
ON cashflow_analysis (household_id, month, currency);

-- Create refresh policies for continuous aggregates (TimescaleDB feature)
-- These will automatically refresh the materialized views

-- Refresh daily spending summary every hour
SELECT add_continuous_aggregate_policy('daily_spending_summary',
  start_offset => INTERVAL '7 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE);

-- Refresh monthly category breakdown every 6 hours
SELECT add_continuous_aggregate_policy('monthly_category_breakdown',
  start_offset => INTERVAL '30 days',
  end_offset => INTERVAL '6 hours',
  schedule_interval => INTERVAL '6 hours',
  if_not_exists => TRUE);

-- Refresh net worth tracking every 2 hours
SELECT add_continuous_aggregate_policy('net_worth_tracking',
  start_offset => INTERVAL '30 days',
  end_offset => INTERVAL '2 hours',
  schedule_interval => INTERVAL '2 hours',
  if_not_exists => TRUE);

-- Refresh cashflow analysis every 4 hours
SELECT add_continuous_aggregate_policy('cashflow_analysis',
  start_offset => INTERVAL '90 days',
  end_offset => INTERVAL '4 hours',
  schedule_interval => INTERVAL '4 hours',
  if_not_exists => TRUE);

-- Create function to refresh all analytics views manually
CREATE OR REPLACE FUNCTION refresh_all_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_spending_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_category_breakdown;
  REFRESH MATERIALIZED VIEW CONCURRENTLY account_balance_history;
  REFRESH MATERIALIZED VIEW CONCURRENTLY net_worth_tracking;
  REFRESH MATERIALIZED VIEW CONCURRENTLY merchant_spending_analysis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY category_trend_analysis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY cashflow_analysis;
END;
$$ LANGUAGE plpgsql;

-- Create function to get analytics view refresh status
CREATE OR REPLACE FUNCTION get_analytics_view_status()
RETURNS TABLE(
  view_name text,
  last_refresh timestamp with time zone,
  size_bytes bigint,
  row_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || matviewname as view_name,
    COALESCE(
      (SELECT last_refresh FROM timescaledb_information.continuous_aggregates 
       WHERE view_name = schemaname || '.' || matviewname),
      (SELECT pg_stat_get_last_analyze_time(c.oid) 
       FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid 
       WHERE n.nspname = schemaname AND c.relname = matviewname)
    ) as last_refresh,
    pg_total_relation_size(schemaname || '.' || matviewname) as size_bytes,
    (SELECT reltuples::bigint FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid 
     WHERE n.nspname = schemaname AND c.relname = matviewname) as row_count
  FROM pg_matviews
  WHERE matviewname IN (
    'daily_spending_summary',
    'monthly_category_breakdown', 
    'account_balance_history',
    'net_worth_tracking',
    'merchant_spending_analysis',
    'category_trend_analysis',
    'cashflow_analysis'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_all_analytics_views() TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_analytics_view_status() TO PUBLIC;

-- Initial refresh of all views
SELECT refresh_all_analytics_views();
