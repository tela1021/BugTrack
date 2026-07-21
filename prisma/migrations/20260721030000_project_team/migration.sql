ALTER TABLE "projects"
ADD COLUMN "teamId" TEXT;

ALTER TABLE "projects"
ALTER COLUMN "teamId" SET NOT NULL;

ALTER TABLE "projects"
ADD CONSTRAINT "projects_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "projects_teamId_idx" ON "projects"("teamId");
