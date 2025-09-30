-- Add clerkId column to users table for Clerk authentication
-- This migration adds the clerkId field to support Clerk authentication

-- Add clerkId column (nullable, unique)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerkId" TEXT;

-- Add unique constraint on clerkId
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_clerkId_key'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_clerkId_key" UNIQUE ("clerkId");
    END IF;
END$$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "users_clerkId_idx" ON "users"("clerkId");

-- Add missing columns if they don't exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- Add missing unique constraint on budget_categories if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'budget_categories_budgetId_categoryId_key'
    ) THEN
        ALTER TABLE "budget_categories" 
        ADD CONSTRAINT "budget_categories_budgetId_categoryId_key" 
        UNIQUE ("budgetId", "categoryId");
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        NULL; -- Table doesn't exist yet, skip
END$$;

-- Add missing unique constraint on sessions if not exists  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'sessions_refreshToken_key'
    ) THEN
        ALTER TABLE "sessions" 
        ADD CONSTRAINT "sessions_refreshToken_key" 
        UNIQUE ("refreshToken");
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        NULL; -- Table doesn't exist yet, skip
END$$;
