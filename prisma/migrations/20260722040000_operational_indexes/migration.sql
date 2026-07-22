CREATE INDEX "issues_teamId_updatedAt_idx" ON "issues"("teamId", "updatedAt");
CREATE INDEX "issues_assigneeId_statusId_idx" ON "issues"("assigneeId", "statusId");
CREATE INDEX "issues_projectId_updatedAt_idx" ON "issues"("projectId", "updatedAt");
CREATE INDEX "projects_teamId_updatedAt_idx" ON "projects"("teamId", "updatedAt");
CREATE INDEX "comments_issueId_createdAt_idx" ON "comments"("issueId", "createdAt");
CREATE INDEX "issue_history_issueId_createdAt_idx" ON "issue_history"("issueId", "createdAt");
CREATE INDEX "notifications_userId_read_createdAt_idx" ON "notifications"("userId", "read", "createdAt");
