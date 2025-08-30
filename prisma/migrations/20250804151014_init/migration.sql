-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "budget_categories" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "budgets" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "debt_payments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "debts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "exchange_rates" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "financial_insights" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gratitude_entries" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "household_members" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "households" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "institutions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ledger_entries" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "merchants" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "passkeys" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "price_history" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "spending_patterns" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transaction_splits" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_events" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "wishlist_items" ALTER COLUMN "id" DROP DEFAULT;
