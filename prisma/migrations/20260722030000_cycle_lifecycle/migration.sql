ALTER TABLE "cycles"
ADD COLUMN "goal" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "cycles"
ADD CONSTRAINT "cycles_status_check"
CHECK ("status" IN ('DRAFT', 'ACTIVE', 'COMPLETED'));

CREATE UNIQUE INDEX "cycles_one_active_per_team" ON "cycles"("teamId")
WHERE "status" = 'ACTIVE';
