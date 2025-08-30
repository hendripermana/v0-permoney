-- Security-related database schema additions
-- These should be added to the main Prisma schema

-- Audit logging table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    household_id UUID REFERENCES households(id) ON DELETE SET NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security incidents table
CREATE TABLE security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('DETECTED', 'INVESTIGATING', 'CONTAINED', 'ERADICATED', 'RECOVERED', 'CLOSED')),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reported_by VARCHAR(255),
    assigned_to VARCHAR(255),
    affected_systems TEXT[] DEFAULT '{}',
    affected_users TEXT[] DEFAULT '{}',
    evidence JSONB NOT NULL DEFAULT '{}',
    timeline JSONB NOT NULL DEFAULT '[]',
    containment_actions TEXT[] DEFAULT '{}',
    eradication_actions TEXT[] DEFAULT '{}',
    recovery_actions TEXT[] DEFAULT '{}',
    lessons_learned TEXT,
    root_cause TEXT,
    estimated_impact JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Security scans table
CREATE TABLE security_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id VARCHAR(255) UNIQUE NOT NULL,
    scan_type VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    findings JSONB NOT NULL DEFAULT '[]',
    summary JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session management table (if not already exists)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Encrypted data storage table (for field-level encryption)
CREATE TABLE encrypted_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    encrypted_value TEXT NOT NULL,
    encryption_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, field_name)
);

-- Security configuration table
CREATE TABLE security_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting tracking (Redis is preferred, but this provides backup)
CREATE TABLE rate_limit_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- IP, user ID, etc.
    limit_type VARCHAR(100) NOT NULL,
    violation_count INTEGER DEFAULT 1,
    first_violation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_violation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, limit_type)
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_household_id ON audit_logs(household_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_success ON audit_logs(success);

CREATE INDEX idx_security_incidents_type ON security_incidents(type);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);
CREATE INDEX idx_security_incidents_detected_at ON security_incidents(detected_at DESC);
CREATE INDEX idx_security_incidents_assigned_to ON security_incidents(assigned_to);

CREATE INDEX idx_security_scans_scan_id ON security_scans(scan_id);
CREATE INDEX idx_security_scans_start_time ON security_scans(start_time DESC);
CREATE INDEX idx_security_scans_scan_type ON security_scans(scan_type);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX idx_encrypted_data_entity ON encrypted_data(entity_type, entity_id);
CREATE INDEX idx_encrypted_data_field ON encrypted_data(field_name);

CREATE INDEX idx_security_config_key ON security_config(config_key);

CREATE INDEX idx_rate_limit_violations_identifier ON rate_limit_violations(identifier);
CREATE INDEX idx_rate_limit_violations_type ON rate_limit_violations(limit_type);
CREATE INDEX idx_rate_limit_violations_blocked_until ON rate_limit_violations(blocked_until);

-- Partitioning for audit logs (optional, for high-volume systems)
-- This would be implemented based on specific requirements
-- CREATE TABLE audit_logs_y2024m01 PARTITION OF audit_logs
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Security policies (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for audit logs (restrict access based on user role)
-- CREATE POLICY audit_logs_access_policy ON audit_logs
-- FOR SELECT
-- TO authenticated_users
-- USING (
--   -- Users can only see their own audit logs unless they have admin role
--   user_id = current_user_id() OR 
--   current_user_has_role('ADMIN') OR 
--   current_user_has_role('SECURITY_OFFICER')
-- );

-- Triggers for automatic timestamping
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_security_incidents_updated_at 
    BEFORE UPDATE ON security_incidents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encrypted_data_updated_at 
    BEFORE UPDATE ON encrypted_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_config_updated_at 
    BEFORE UPDATE ON security_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_violations_updated_at 
    BEFORE UPDATE ON rate_limit_violations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default security configuration
INSERT INTO security_config (config_key, config_value, description) VALUES
('rate_limit_global_window', '900000', 'Global rate limit window in milliseconds (15 minutes)'),
('rate_limit_global_max', '1000', 'Global rate limit maximum requests per window'),
('rate_limit_per_ip_window', '900000', 'Per-IP rate limit window in milliseconds'),
('rate_limit_per_ip_max', '100', 'Per-IP rate limit maximum requests per window'),
('security_scan_interval', '86400000', 'Security scan interval in milliseconds (24 hours)'),
('audit_retention_days', '365', 'Audit log retention period in days'),
('incident_auto_close_days', '30', 'Automatically close resolved incidents after days'),
('encryption_key_rotation_days', '90', 'Encryption key rotation interval in days')
ON CONFLICT (config_key) DO NOTHING;
