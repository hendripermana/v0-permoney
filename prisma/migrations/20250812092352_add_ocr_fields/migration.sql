/*
  Warnings:

  - You are about to drop the column `created_at` on the `recurring_transaction_executions` table. All the data in the column will be lost.
  - You are about to drop the column `error_message` on the `recurring_transaction_executions` table. All the data in the column will be lost.
  - You are about to drop the column `executed_date` on the `recurring_transaction_executions` table. All the data in the column will be lost.
  - You are about to drop the column `recurring_transaction_id` on the `recurring_transaction_executions` table. All the data in the column will be lost.
  - You are about to drop the column `retry_count` on the `recurring_transaction_executions` table. All the data in the column will be lost.
  - You are about to drop the column `scheduled_date` on the `recurring_transaction_executions` table. All the data in the column will be lost.
  - You are about to drop the column `transaction_id` on the `recurring_transaction_executions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `recurring_transaction_executions` table. All the data in the column will be lost.
  - You are about to drop the column `account_id` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `amount_cents` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `execution_count` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `household_id` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `interval_value` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `last_execution_date` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `max_executions` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `next_execution_date` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `transfer_account_id` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `recurring_transactions` table. All the data in the column will be lost.
  - Added the required column `recurringTransactionId` to the `recurring_transaction_executions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledDate` to the `recurring_transaction_executions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `recurring_transaction_executions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `recurring_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amountCents` to the `recurring_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `recurring_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `householdId` to the `recurring_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nextExecutionDate` to the `recurring_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `recurring_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `recurring_transactions` table without a default value. This is not possible if the table is not empty.
  - Made the column `metadata` on table `recurring_transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RECEIPT', 'BANK_STATEMENT', 'INVOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REQUIRES_REVIEW');

-- DropForeignKey
ALTER TABLE "recurring_transaction_executions" DROP CONSTRAINT "recurring_transaction_executions_recurring_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_transaction_executions" DROP CONSTRAINT "recurring_transaction_executions_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_transactions" DROP CONSTRAINT "recurring_transactions_account_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_transactions" DROP CONSTRAINT "recurring_transactions_category_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_transactions" DROP CONSTRAINT "recurring_transactions_created_by_fkey";

-- DropForeignKey
ALTER TABLE "recurring_transactions" DROP CONSTRAINT "recurring_transactions_household_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_transactions" DROP CONSTRAINT "recurring_transactions_transfer_account_id_fkey";

-- DropIndex
DROP INDEX "recurring_transaction_executions_recurring_transaction_id_idx";

-- DropIndex
DROP INDEX "recurring_transaction_executions_scheduled_date_idx";

-- DropIndex
DROP INDEX "recurring_transactions_account_id_idx";

-- DropIndex
DROP INDEX "recurring_transactions_household_id_idx";

-- DropIndex
DROP INDEX "recurring_transactions_next_execution_date_idx";

-- AlterTable
ALTER TABLE "recurring_transaction_executions" DROP COLUMN "created_at",
DROP COLUMN "error_message",
DROP COLUMN "executed_date",
DROP COLUMN "recurring_transaction_id",
DROP COLUMN "retry_count",
DROP COLUMN "scheduled_date",
DROP COLUMN "transaction_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "executedDate" TIMESTAMP(3),
ADD COLUMN     "recurringTransactionId" UUID NOT NULL,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scheduledDate" DATE NOT NULL,
ADD COLUMN     "transactionId" UUID,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "status" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "recurring_transactions" DROP COLUMN "account_id",
DROP COLUMN "amount_cents",
DROP COLUMN "category_id",
DROP COLUMN "created_at",
DROP COLUMN "created_by",
DROP COLUMN "end_date",
DROP COLUMN "execution_count",
DROP COLUMN "household_id",
DROP COLUMN "interval_value",
DROP COLUMN "last_execution_date",
DROP COLUMN "max_executions",
DROP COLUMN "next_execution_date",
DROP COLUMN "start_date",
DROP COLUMN "transfer_account_id",
DROP COLUMN "updated_at",
ADD COLUMN     "accountId" UUID NOT NULL,
ADD COLUMN     "amountCents" BIGINT NOT NULL,
ADD COLUMN     "categoryId" UUID,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" UUID NOT NULL,
ADD COLUMN     "endDate" DATE,
ADD COLUMN     "executionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "householdId" UUID NOT NULL,
ADD COLUMN     "intervalValue" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "lastExecutionDate" DATE,
ADD COLUMN     "maxExecutions" INTEGER,
ADD COLUMN     "nextExecutionDate" DATE NOT NULL,
ADD COLUMN     "startDate" DATE NOT NULL,
ADD COLUMN     "transferAccountId" UUID,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "merchant" SET DATA TYPE TEXT,
ALTER COLUMN "metadata" SET NOT NULL;

-- CreateTable
CREATE TABLE "document_uploads" (
    "id" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedBy" UUID NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "storageUrl" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_results" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "extractedData" JSONB NOT NULL DEFAULT '{}',
    "rawText" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocr_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_suggestions" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "ocrResultId" UUID,
    "description" TEXT NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "date" DATE NOT NULL,
    "merchant" TEXT,
    "suggestedCategoryId" UUID,
    "suggestedCategoryName" TEXT,
    "confidence" DECIMAL(3,2) NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdTransactionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_uploads_householdId_idx" ON "document_uploads"("householdId");

-- CreateIndex
CREATE INDEX "document_uploads_uploadedBy_idx" ON "document_uploads"("uploadedBy");

-- CreateIndex
CREATE INDEX "document_uploads_status_idx" ON "document_uploads"("status");

-- CreateIndex
CREATE INDEX "document_uploads_documentType_idx" ON "document_uploads"("documentType");

-- CreateIndex
CREATE INDEX "ocr_results_documentId_idx" ON "ocr_results"("documentId");

-- CreateIndex
CREATE INDEX "ocr_results_documentType_idx" ON "ocr_results"("documentType");

-- CreateIndex
CREATE INDEX "ocr_results_confidence_idx" ON "ocr_results"("confidence");

-- CreateIndex
CREATE INDEX "transaction_suggestions_documentId_idx" ON "transaction_suggestions"("documentId");

-- CreateIndex
CREATE INDEX "transaction_suggestions_ocrResultId_idx" ON "transaction_suggestions"("ocrResultId");

-- CreateIndex
CREATE INDEX "transaction_suggestions_status_idx" ON "transaction_suggestions"("status");

-- CreateIndex
CREATE INDEX "transaction_suggestions_source_idx" ON "transaction_suggestions"("source");

-- CreateIndex
CREATE INDEX "transaction_suggestions_suggestedCategoryId_idx" ON "transaction_suggestions"("suggestedCategoryId");

-- CreateIndex
CREATE INDEX "transaction_suggestions_isApproved_idx" ON "transaction_suggestions"("isApproved");

-- CreateIndex
CREATE INDEX "recurring_transaction_executions_recurringTransactionId_idx" ON "recurring_transaction_executions"("recurringTransactionId");

-- CreateIndex
CREATE INDEX "recurring_transaction_executions_scheduledDate_idx" ON "recurring_transaction_executions"("scheduledDate");

-- CreateIndex
CREATE INDEX "recurring_transactions_householdId_idx" ON "recurring_transactions"("householdId");

-- CreateIndex
CREATE INDEX "recurring_transactions_accountId_idx" ON "recurring_transactions"("accountId");

-- CreateIndex
CREATE INDEX "recurring_transactions_nextExecutionDate_idx" ON "recurring_transactions"("nextExecutionDate");

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_transferAccountId_fkey" FOREIGN KEY ("transferAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transaction_executions" ADD CONSTRAINT "recurring_transaction_executions_recurringTransactionId_fkey" FOREIGN KEY ("recurringTransactionId") REFERENCES "recurring_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transaction_executions" ADD CONSTRAINT "recurring_transaction_executions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_uploads" ADD CONSTRAINT "document_uploads_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_uploads" ADD CONSTRAINT "document_uploads_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_results" ADD CONSTRAINT "ocr_results_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_suggestions" ADD CONSTRAINT "transaction_suggestions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_suggestions" ADD CONSTRAINT "transaction_suggestions_ocrResultId_fkey" FOREIGN KEY ("ocrResultId") REFERENCES "ocr_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_suggestions" ADD CONSTRAINT "transaction_suggestions_suggestedCategoryId_fkey" FOREIGN KEY ("suggestedCategoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_suggestions" ADD CONSTRAINT "transaction_suggestions_createdTransactionId_fkey" FOREIGN KEY ("createdTransactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
