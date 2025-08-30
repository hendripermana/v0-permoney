-- Adding database performance optimizations

-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_household_date 
ON transactions(household_id, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_account_date 
ON transactions(account_id, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_category_date 
ON transactions(category_id, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_household_active 
ON accounts(household_id, is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budgets_household_period 
ON budgets(household_id, period_start, period_end);

-- Create partial indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_pending 
ON transactions(household_id, date DESC) WHERE status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_large_amounts 
ON transactions(household_id, amount) WHERE ABS(amount) > 1000;

-- Create composite indexes for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_analytics 
ON transactions(household_id, category_id, date DESC, amount);

-- Create materialized view for dashboard analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_analytics AS
SELECT 
    household_id,
    DATE_TRUNC('month', date) as month,
    category_id,
    COUNT(*) as transaction_count,
    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses,
    AVG(ABS(amount)) as avg_transaction_amount
FROM transactions 
WHERE date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY household_id, DATE_TRUNC('month', date), category_id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_analytics_unique 
ON dashboard_analytics(household_id, month, category_id);

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_analytics;
END;
$$ LANGUAGE plpgsql;

-- Set up automatic refresh (run every hour)
-- This would typically be set up with pg_cron or similar
-- SELECT cron.schedule('refresh-dashboard-analytics', '0 * * * *', 'SELECT refresh_dashboard_analytics();');

-- Analyze tables for better query planning
ANALYZE transactions;
ANALYZE accounts;
ANALYZE budgets;
ANALYZE categories;
ANALYZE households;

-- Update table statistics
UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0;
