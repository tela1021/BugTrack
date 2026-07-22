ALTER TABLE "issues" ADD COLUMN "issueType" TEXT NOT NULL DEFAULT 'TASK';

ALTER TABLE "issues"
ADD CONSTRAINT "issues_issueType_check"
CHECK ("issueType" IN ('TASK', 'BUG', 'FEATURE', 'IMPROVEMENT'));

CREATE INDEX "issues_issueType_idx" ON "issues"("issueType");
