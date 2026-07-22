CREATE TABLE "team_integrations" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "repository" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "actorUserId" TEXT NOT NULL,
    "reviewStatusId" TEXT,
    "doneStatusId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "team_integrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT,
    "provider" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "error" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_integrations_teamId_provider_repository_key" ON "team_integrations"("teamId", "provider", "repository");
CREATE INDEX "team_integrations_provider_repository_idx" ON "team_integrations"("provider", "repository");
CREATE UNIQUE INDEX "webhook_deliveries_provider_deliveryId_key" ON "webhook_deliveries"("provider", "deliveryId");
CREATE INDEX "webhook_deliveries_integrationId_createdAt_idx" ON "webhook_deliveries"("integrationId", "createdAt");

ALTER TABLE "team_integrations" ADD CONSTRAINT "team_integrations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_integrations" ADD CONSTRAINT "team_integrations_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "team_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
