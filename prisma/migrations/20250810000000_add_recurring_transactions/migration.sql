-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RecurringTransactionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "recurring_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "account_id" UUID NOT NULL,
    "transfer_account_id" UUID,
    "category_id" UUID,
    "merchant" VARCHAR(255),
    "frequency" "RecurrenceFrequency" NOT NULL,
    "interval_value" INTEGER NOT NULL DEFAULT 1,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "next_execution_date" DATE NOT NULL,
    "last_execution_date" DATE,
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "max_executions" INTEGER,
    "status" "RecurringTransactionStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB DEFAULT '{}',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_transaction_executions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recurring_transaction_id" UUID NOT NULL,
    "transaction_id" UUID,
    "scheduled_date" DATE NOT NULL,
    "executed_date" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_transaction_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_transactions_household_id_idx" ON "recurring_transactions"("household_id");

-- CreateIndex
CREATE INDEX "recurring_transactions_account_id_idx" ON "recurring_transactions"("account_id");

-- CreateIndex
CREATE INDEX "recurring_transactions_next_execution_date_idx" ON "recurring_transactions"("next_execution_date");

-- CreateIndex
CREATE INDEX "recurring_transactions_status_idx" ON "recurring_transactions"("status");

-- CreateIndex
CREATE INDEX "recurring_transaction_executions_recurring_transaction_id_idx" ON "recurring_transaction_executions"("recurring_transaction_id");

-- CreateIndex
CREATE INDEX "recurring_transaction_executions_scheduled_date_idx" ON "recurring_transaction_executions"("scheduled_date");

-- CreateIndex
CREATE INDEX "recurring_transaction_executions_status_idx" ON "recurring_transaction_executions"("status");

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_transfer_account_id_fkey" FOREIGN KEY ("transfer_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transaction_executions" ADD CONSTRAINT "recurring_transaction_executions_recurring_transaction_id_fkey" FOREIGN KEY ("recurring_transaction_id") REFERENCES "recurring_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transaction_executions" ADD CONSTRAINT "recurring_transaction_executions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
