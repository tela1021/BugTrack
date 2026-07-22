CREATE TABLE "issue_links" (
    "id" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "relation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "issue_links_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "issue_links_sourceId_targetId_relation_key" ON "issue_links"("sourceId", "targetId", "relation");
CREATE INDEX "issue_links_targetId_idx" ON "issue_links"("targetId");
ALTER TABLE "issue_links" ADD CONSTRAINT "issue_links_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_links" ADD CONSTRAINT "issue_links_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
