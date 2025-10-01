-- Migration: Add User Profile and Household Location Fields
-- Purpose: Store onboarding data in database for better analytics and UX
-- Date: 2025-10-01

-- ============================================================================
-- USERS TABLE ENHANCEMENTS
-- ============================================================================

-- Add user profile fields from onboarding
ALTER TABLE users ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "countryCode" VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "preferredCurrency" VARCHAR(3);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "locale" VARCHAR(10) DEFAULT 'id-ID';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "timezone" VARCHAR(50) DEFAULT 'Asia/Jakarta';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE;

-- Add comments for documentation
COMMENT ON COLUMN users."firstName" IS 'User first name from onboarding';
COMMENT ON COLUMN users."lastName" IS 'User last name from onboarding';
COMMENT ON COLUMN users."countryCode" IS 'ISO 3166-1 alpha-2 country code (e.g., ID, US, SG)';
COMMENT ON COLUMN users."preferredCurrency" IS 'ISO 4217 currency code (e.g., IDR, USD, EUR)';
COMMENT ON COLUMN users."locale" IS 'User preferred locale (e.g., id-ID, en-US)';
COMMENT ON COLUMN users."timezone" IS 'User timezone (e.g., Asia/Jakarta, America/New_York)';
COMMENT ON COLUMN users."phoneNumber" IS 'User phone number (optional)';
COMMENT ON COLUMN users."dateOfBirth" IS 'User date of birth (optional, for age-based features)';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS "users_firstName_idx" ON users("firstName");
CREATE INDEX IF NOT EXISTS "users_lastName_idx" ON users("lastName");
CREATE INDEX IF NOT EXISTS "users_countryCode_idx" ON users("countryCode");
CREATE INDEX IF NOT EXISTS "users_preferredCurrency_idx" ON users("preferredCurrency");
CREATE INDEX IF NOT EXISTS "users_locale_idx" ON users("locale");

-- ============================================================================
-- HOUSEHOLDS TABLE ENHANCEMENTS
-- ============================================================================

-- Add household location and preferences
ALTER TABLE households ADD COLUMN IF NOT EXISTS "countryCode" VARCHAR(2);
ALTER TABLE households ADD COLUMN IF NOT EXISTS "timezone" VARCHAR(50) DEFAULT 'Asia/Jakarta';
ALTER TABLE households ADD COLUMN IF NOT EXISTS "locale" VARCHAR(10) DEFAULT 'id-ID';
ALTER TABLE households ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Add comments
COMMENT ON COLUMN households."countryCode" IS 'Primary country for the household';
COMMENT ON COLUMN households."timezone" IS 'Household timezone for date/time display';
COMMENT ON COLUMN households."locale" IS 'Household preferred locale for localization';
COMMENT ON COLUMN households."description" IS 'Optional household description';

-- Create indexes
CREATE INDEX IF NOT EXISTS "households_countryCode_idx" ON households("countryCode");
CREATE INDEX IF NOT EXISTS "households_baseCurrency_idx" ON households("baseCurrency");

-- ============================================================================
-- DATA QUALITY CONSTRAINTS (Optional, can be enabled later)
-- ============================================================================

-- Country code validation (ISO 3166-1 alpha-2)
-- ALTER TABLE users ADD CONSTRAINT "users_countryCode_check" 
--   CHECK ("countryCode" IS NULL OR LENGTH("countryCode") = 2);

-- ALTER TABLE households ADD CONSTRAINT "households_countryCode_check"
--   CHECK ("countryCode" IS NULL OR LENGTH("countryCode") = 2);

-- Currency code validation (ISO 4217)
-- ALTER TABLE users ADD CONSTRAINT "users_preferredCurrency_check"
--   CHECK ("preferredCurrency" IS NULL OR LENGTH("preferredCurrency") = 3);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify columns were added
DO $$
DECLARE
  users_column_count INTEGER;
  households_column_count INTEGER;
BEGIN
  -- Check users table
  SELECT COUNT(*) INTO users_column_count
  FROM information_schema.columns
  WHERE table_name = 'users'
    AND column_name IN ('firstName', 'lastName', 'countryCode', 'preferredCurrency', 'locale', 'timezone');
  
  -- Check households table
  SELECT COUNT(*) INTO households_column_count
  FROM information_schema.columns
  WHERE table_name = 'households'
    AND column_name IN ('countryCode', 'timezone', 'locale', 'description');
  
  -- Report results
  RAISE NOTICE 'Users table: % new columns added', users_column_count;
  RAISE NOTICE 'Households table: % new columns added', households_column_count;
  
  IF users_column_count >= 6 AND households_column_count >= 4 THEN
    RAISE NOTICE '✅ Migration completed successfully!';
  ELSE
    RAISE WARNING '⚠️  Some columns may not have been added. Please verify manually.';
  END IF;
END $$;
