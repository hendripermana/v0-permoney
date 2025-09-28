-- Schema Enhancements for Better UX, Analytics, and Personalization
-- 1. Editable & Archivable Categories
-- 2. Merchant Enrichment in Transactions  
-- 3. Gratitude Entries with Transaction Link

-- Add new fields to categories table for better UX
ALTER TABLE "categories" ADD COLUMN "isEditable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "categories" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- Create merchants table for enriched merchant data
CREATE TABLE "merchants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- Add merchant enrichment fields to transactions table
ALTER TABLE "transactions" ADD COLUMN "merchantId" UUID;
ALTER TABLE "transactions" ADD COLUMN "merchantName" TEXT;
ALTER TABLE "transactions" ADD COLUMN "merchantLogoUrl" TEXT;
ALTER TABLE "transactions" ADD COLUMN "merchantColor" TEXT;

-- Add transaction link to gratitude entries
ALTER TABLE "gratitude_entries" ADD COLUMN "transactionId" UUID;

-- Create unique constraint for merchant slug
CREATE UNIQUE INDEX "merchants_slug_key" ON "merchants"("slug");

-- Create indexes for merchant-related fields in transactions
CREATE INDEX "transactions_merchantId_idx" ON "transactions"("merchantId");
CREATE INDEX "transactions_merchantName_idx" ON "transactions"("merchantName");

-- Create indexes for gratitude entries
CREATE INDEX "gratitude_entries_transactionId_idx" ON "gratitude_entries"("transactionId");
CREATE INDEX "gratitude_entries_giver_householdId_idx" ON "gratitude_entries"("giver", "householdId");

-- Add foreign key constraints
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gratitude_entries" ADD CONSTRAINT "gratitude_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
