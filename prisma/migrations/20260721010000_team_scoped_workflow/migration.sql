-- All PostgreSQL environments are clean at this point; global statuses are not migrated.
ALTER TABLE "workflow_statuses" ALTER COLUMN "teamId" SET NOT NULL;

CREATE UNIQUE INDEX "workflow_statuses_teamId_name_key"
ON "workflow_statuses"("teamId", "name");

CREATE UNIQUE INDEX "workflow_statuses_teamId_position_key"
ON "workflow_statuses"("teamId", "position");
