-- AlterTable
ALTER TABLE "Branch" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Branch_deletedAt_idx" ON "Branch"("deletedAt");

-- CreateTable
CREATE TABLE "ReferenceOption" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferenceOption_category_code_key" ON "ReferenceOption"("category", "code");

CREATE INDEX "ReferenceOption_category_isActive_idx" ON "ReferenceOption"("category", "isActive");

-- Archive legacy hub branch (no longer an operational campus in the app)
UPDATE "Branch" SET "type" = 'BRANCH', "deletedAt" = CURRENT_TIMESTAMP, "isActive" = false WHERE "code" = 'MAIN' AND "deletedAt" IS NULL;

-- Procurement: optional JSON map of branchId -> quantity for stock distribution
ALTER TABLE "ProcurementEntry" ADD COLUMN "branchDistribution" JSONB;
