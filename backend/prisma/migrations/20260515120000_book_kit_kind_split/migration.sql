-- Split academic vs notebook inventory: multiple BookKit rows per class (composite unique on classId + kind).

CREATE TYPE "BookKitKind" AS ENUM ('ACADEMIC', 'NOTEBOOKS');

ALTER TABLE "BookKit" ADD COLUMN "kind" "BookKitKind" NOT NULL DEFAULT 'ACADEMIC';

ALTER TABLE "BookKit" DROP CONSTRAINT IF EXISTS "BookKit_classId_key";

CREATE UNIQUE INDEX "BookKit_classId_kind_key" ON "BookKit"("classId", "kind");

CREATE INDEX "BookKit_classId_idx" ON "BookKit"("classId");
