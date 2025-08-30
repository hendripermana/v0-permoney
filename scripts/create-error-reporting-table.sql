-- Creating database table for error reporting
CREATE TABLE IF NOT EXISTS error_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint VARCHAR(32) UNIQUE NOT NULL,
    message TEXT NOT NULL,
    stack TEXT,
    name VARCHAR(255),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    component VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id),
    household_id UUID REFERENCES households(id),
    user_agent TEXT,
    ip INET,
    url TEXT,
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    occurrence_count INTEGER DEFAULT 1,
    first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_user_agent TEXT,
    last_ip INET,
    last_url TEXT,
    last_user_id UUID,
    last_household_id UUID,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_reports_fingerprint ON error_reports(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_reports_severity ON error_reports(severity);
CREATE INDEX IF NOT EXISTS idx_error_reports_component ON error_reports(component);
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON error_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_household_id ON error_reports(household_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_last_seen ON error_reports(last_seen);
CREATE INDEX IF NOT EXISTS idx_error_reports_occurrence_count ON error_reports(occurrence_count);
CREATE INDEX IF NOT EXISTS idx_error_reports_resolved ON error_reports(resolved);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_reports_severity_last_seen ON error_reports(severity, last_seen);
CREATE INDEX IF NOT EXISTS idx_error_reports_component_last_seen ON error_reports(component, last_seen);
CREATE INDEX IF NOT EXISTS idx_error_reports_user_last_seen ON error_reports(user_id, last_seen);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_error_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_error_reports_updated_at
    BEFORE UPDATE ON error_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_error_reports_updated_at();
