-- CreateEnum
CREATE TYPE "ZakatAssetType" AS ENUM ('CASH', 'GOLD', 'SILVER', 'BUSINESS_ASSETS', 'INVESTMENT', 'SAVINGS', 'CRYPTOCURRENCY');

-- CreateEnum
CREATE TYPE "ZakatReminderType" AS ENUM ('ANNUAL_CALCULATION', 'PAYMENT_DUE', 'HAUL_COMPLETION', 'NISAB_THRESHOLD_MET');

-- CreateEnum
CREATE TYPE "ShariaComplianceStatus" AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'UNDER_REVIEW', 'QUESTIONABLE');

-- CreateEnum
CREATE TYPE "IslamicReportType" AS ENUM ('ZAKAT_CALCULATION', 'SHARIA_COMPLIANCE', 'ISLAMIC_DEBT_SUMMARY', 'HALAAL_INCOME_ANALYSIS', 'COMPREHENSIVE');

-- CreateTable
CREATE TABLE "zakat_calculations" (
    "id" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "calculationDate" DATE NOT NULL,
    "hijriYear" INTEGER NOT NULL,
    "nisabThresholdCents" BIGINT NOT NULL,
    "totalZakatableAssetsCents" BIGINT NOT NULL,
    "zakatAmountCents" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "isZakatDue" BOOLEAN NOT NULL DEFAULT false,
    "nextCalculationDate" DATE NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zakat_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zakat_asset_breakdown" (
    "id" UUID NOT NULL,
    "zakatCalculationId" UUID NOT NULL,
    "assetType" "ZakatAssetType" NOT NULL,
    "accountId" UUID,
    "accountName" TEXT,
    "amountCents" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "zakatRate" DECIMAL(5,4) NOT NULL,
    "zakatAmountCents" BIGINT NOT NULL,
    "haulCompleted" BOOLEAN NOT NULL DEFAULT false,
    "haulStartDate" DATE,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zakat_asset_breakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zakat_reminders" (
    "id" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "reminderType" "ZakatReminderType" NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "hijriDate" TEXT NOT NULL,
    "zakatAmountCents" BIGINT,
    "currency" VARCHAR(3) DEFAULT 'IDR',
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zakat_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zakat_payments" (
    "id" UUID NOT NULL,
    "zakatCalculationId" UUID,
    "householdId" UUID NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "paymentDate" DATE NOT NULL,
    "hijriDate" TEXT NOT NULL,
    "transactionId" UUID,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zakat_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sharia_compliant_accounts" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "complianceStatus" "ShariaComplianceStatus" NOT NULL,
    "complianceNotes" TEXT,
    "lastReviewDate" DATE NOT NULL,
    "nextReviewDate" DATE NOT NULL,
    "reviewedBy" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sharia_compliant_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "islamic_finance_reports" (
    "id" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "reportType" "IslamicReportType" NOT NULL,
    "periodStartDate" DATE NOT NULL,
    "periodEndDate" DATE NOT NULL,
    "periodType" TEXT NOT NULL DEFAULT 'MONTHLY',
    "reportData" JSONB NOT NULL DEFAULT '{}',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "islamic_finance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "zakat_calculations_householdId_idx" ON "zakat_calculations"("householdId");

-- CreateIndex
CREATE INDEX "zakat_calculations_calculationDate_idx" ON "zakat_calculations"("calculationDate");

-- CreateIndex
CREATE INDEX "zakat_calculations_hijriYear_idx" ON "zakat_calculations"("hijriYear");

-- CreateIndex
CREATE INDEX "zakat_asset_breakdown_zakatCalculationId_idx" ON "zakat_asset_breakdown"("zakatCalculationId");

-- CreateIndex
CREATE INDEX "zakat_asset_breakdown_assetType_idx" ON "zakat_asset_breakdown"("assetType");

-- CreateIndex
CREATE INDEX "zakat_asset_breakdown_accountId_idx" ON "zakat_asset_breakdown"("accountId");

-- CreateIndex
CREATE INDEX "zakat_reminders_householdId_idx" ON "zakat_reminders"("householdId");

-- CreateIndex
CREATE INDEX "zakat_reminders_scheduledDate_idx" ON "zakat_reminders"("scheduledDate");

-- CreateIndex
CREATE INDEX "zakat_reminders_reminderType_idx" ON "zakat_reminders"("reminderType");

-- CreateIndex
CREATE INDEX "zakat_reminders_isActive_isSent_idx" ON "zakat_reminders"("isActive", "isSent");

-- CreateIndex
CREATE INDEX "zakat_payments_householdId_idx" ON "zakat_payments"("householdId");

-- CreateIndex
CREATE INDEX "zakat_payments_paymentDate_idx" ON "zakat_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "zakat_payments_zakatCalculationId_idx" ON "zakat_payments"("zakatCalculationId");

-- CreateIndex
CREATE INDEX "zakat_payments_transactionId_idx" ON "zakat_payments"("transactionId");

-- CreateIndex
CREATE INDEX "sharia_compliant_accounts_complianceStatus_idx" ON "sharia_compliant_accounts"("complianceStatus");

-- CreateIndex
CREATE INDEX "sharia_compliant_accounts_nextReviewDate_idx" ON "sharia_compliant_accounts"("nextReviewDate");

-- CreateIndex
CREATE UNIQUE INDEX "sharia_compliant_accounts_accountId_key" ON "sharia_compliant_accounts"("accountId");

-- CreateIndex
CREATE INDEX "islamic_finance_reports_householdId_idx" ON "islamic_finance_reports"("householdId");

-- CreateIndex
CREATE INDEX "islamic_finance_reports_reportType_idx" ON "islamic_finance_reports"("reportType");

-- CreateIndex
CREATE INDEX "islamic_finance_reports_periodStartDate_periodEndDate_idx" ON "islamic_finance_reports"("periodStartDate", "periodEndDate");

-- CreateIndex
CREATE INDEX "islamic_finance_reports_generatedAt_idx" ON "islamic_finance_reports"("generatedAt");

-- AddForeignKey
ALTER TABLE "zakat_calculations" ADD CONSTRAINT "zakat_calculations_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakat_asset_breakdown" ADD CONSTRAINT "zakat_asset_breakdown_zakatCalculationId_fkey" FOREIGN KEY ("zakatCalculationId") REFERENCES "zakat_calculations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakat_asset_breakdown" ADD CONSTRAINT "zakat_asset_breakdown_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakat_reminders" ADD CONSTRAINT "zakat_reminders_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakat_payments" ADD CONSTRAINT "zakat_payments_zakatCalculationId_fkey" FOREIGN KEY ("zakatCalculationId") REFERENCES "zakat_calculations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakat_payments" ADD CONSTRAINT "zakat_payments_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakat_payments" ADD CONSTRAINT "zakat_payments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sharia_compliant_accounts" ADD CONSTRAINT "sharia_compliant_accounts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sharia_compliant_accounts" ADD CONSTRAINT "sharia_compliant_accounts_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "islamic_finance_reports" ADD CONSTRAINT "islamic_finance_reports_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "islamic_finance_reports" ADD CONSTRAINT "islamic_finance_reports_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
