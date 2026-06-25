-- Finance module overhaul: ExpenseEntry approval/vendor fields, Branch paymentMethods, OnlineSettlement

ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'VENDOR_PAYMENT';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'OTHER';

ALTER TABLE "ExpenseEntry" ADD COLUMN IF NOT EXISTS "publisherId" TEXT;
ALTER TABLE "ExpenseEntry" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "ExpenseEntry" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;
ALTER TABLE "ExpenseEntry" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "paymentMethods" "PaymentMethod"[] DEFAULT ARRAY[]::"PaymentMethod"[];

CREATE TABLE IF NOT EXISTS "OnlineSettlement" (
    "id"             TEXT NOT NULL,
    "branchId"       TEXT NOT NULL,
    "paymentMethod"  "PaymentMethod" NOT NULL,
    "amountSettled"  DECIMAL(10,2) NOT NULL,
    "settlementDate" TIMESTAMP(3) NOT NULL,
    "utrNumber"      TEXT,
    "notes"          TEXT,
    "settledById"    TEXT NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OnlineSettlement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExpenseEntry_status_idx" ON "ExpenseEntry"("status");
CREATE INDEX IF NOT EXISTS "ExpenseEntry_publisherId_idx" ON "ExpenseEntry"("publisherId");

CREATE INDEX IF NOT EXISTS "OnlineSettlement_branchId_idx" ON "OnlineSettlement"("branchId");
CREATE INDEX IF NOT EXISTS "OnlineSettlement_paymentMethod_idx" ON "OnlineSettlement"("paymentMethod");
CREATE INDEX IF NOT EXISTS "OnlineSettlement_settlementDate_idx" ON "OnlineSettlement"("settlementDate");
CREATE INDEX IF NOT EXISTS "OnlineSettlement_branchId_paymentMethod_idx" ON "OnlineSettlement"("branchId", "paymentMethod");

DO $$ BEGIN
  ALTER TABLE "ExpenseEntry" ADD CONSTRAINT "ExpenseEntry_publisherId_fkey"
    FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ExpenseEntry" ADD CONSTRAINT "ExpenseEntry_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OnlineSettlement" ADD CONSTRAINT "OnlineSettlement_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OnlineSettlement" ADD CONSTRAINT "OnlineSettlement_settledById_fkey"
    FOREIGN KEY ("settledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
