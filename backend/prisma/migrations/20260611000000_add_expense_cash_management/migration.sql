-- Add Expense & Cash Management enums and tables (idempotent for DBs that already have them)

DO $$ BEGIN
  CREATE TYPE "ExpenseEntryType" AS ENUM ('HANDOVER', 'EXPENSE', 'ONLINE_ALLOCATION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExpenseCategory" AS ENUM ('STATIONERY', 'MAINTENANCE', 'FOOD', 'TRANSPORT', 'MISCELLANEOUS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ExpenseEntry" (
    "id"            TEXT NOT NULL,
    "branchId"      TEXT NOT NULL,
    "entryType"     "ExpenseEntryType" NOT NULL,
    "amount"        DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "recipient"     TEXT,
    "category"      "ExpenseCategory",
    "description"   TEXT,
    "referenceId"   TEXT,
    "notes"         TEXT,
    "entryDate"     TIMESTAMP(3) NOT NULL,
    "createdById"   TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExpenseRecipient" (
    "id"        TEXT NOT NULL,
    "branchId"  TEXT,
    "name"      TEXT NOT NULL,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseRecipient_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExpenseEntry_branchId_idx" ON "ExpenseEntry"("branchId");
CREATE INDEX IF NOT EXISTS "ExpenseEntry_entryType_idx" ON "ExpenseEntry"("entryType");
CREATE INDEX IF NOT EXISTS "ExpenseEntry_entryDate_idx" ON "ExpenseEntry"("entryDate");
CREATE INDEX IF NOT EXISTS "ExpenseEntry_branchId_entryDate_idx" ON "ExpenseEntry"("branchId", "entryDate");
CREATE INDEX IF NOT EXISTS "ExpenseRecipient_branchId_idx" ON "ExpenseRecipient"("branchId");
CREATE INDEX IF NOT EXISTS "ExpenseRecipient_isActive_idx" ON "ExpenseRecipient"("isActive");

DO $$ BEGIN
  ALTER TABLE "ExpenseEntry" ADD CONSTRAINT "ExpenseEntry_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ExpenseEntry" ADD CONSTRAINT "ExpenseEntry_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ExpenseRecipient" ADD CONSTRAINT "ExpenseRecipient_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
