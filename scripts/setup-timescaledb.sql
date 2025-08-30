-- TimescaleDB Setup Script
-- Run this after the basic schema is created

-- Convert transactions table to hypertable for time-series optimization
SELECT create_hypertable('transactions', 'date', if_not_exists => TRUE);

-- Create continuous aggregates for analytics performance
-- Daily spending summary for quick dashboard queries
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_spending_summary
WITH (timescaledb.continuous) AS
SELECT
    household_id,
    time_bucket('1 day', date) AS day,
    category_id,
    currency,
    SUM(amount_cents) as total_amount_cents,
    COUNT(*) as transaction_count,
    AVG(amount_cents) as avg_amount_cents
FROM transactions
WHERE amount_cents > 0 -- Only expenses
GROUP BY household_id, day, category_id, currency;

-- Monthly category breakdown for reporting
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_category_breakdown
WITH (timescaledb.continuous) AS
SELECT
    household_id,
    time_bucket('1 month', date) AS month,
    category_id,
    currency,
    SUM(amount_cents) as total_spent_cents,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT account_id) as accounts_used
FROM transactions
WHERE amount_cents > 0
GROUP BY household_id, month, category_id, currency;

-- Net worth calculation view (using account balance snapshots)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_net_worth
WITH (timescaledb.continuous) AS
SELECT
    a.household_id,
    time_bucket('1 day', t.date) AS day,
    SUM(
        CASE 
            WHEN a.type = 'ASSET' THEN le.amount_cents 
            ELSE -le.amount_cents 
        END
    ) as net_worth_change_cents
FROM accounts a
JOIN ledger_entries le ON a.id = le.account_id
JOIN transactions t ON le.transaction_id = t.id
GROUP BY a.household_id, day;

-- Add refresh policies for continuous aggregates
SELECT add_continuous_aggregate_policy('daily_spending_summary',
    start_offset => INTERVAL '1 month',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

SELECT add_continuous_aggregate_policy('monthly_category_breakdown',
    start_offset => INTERVAL '3 months',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');

SELECT add_continuous_aggregate_policy('daily_net_worth',
    start_offset => INTERVAL '1 month',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
