-- Enable TimescaleDB extension for time-series optimization
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Note: TimescaleDB hypertables and continuous aggregates will be set up
-- after the basic schema is created using a separate script
