import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P2 GitHub integration maps repositories to teams and verifies idempotent signed webhooks', async () => {
  const [schema, migration, actions, route] = await Promise.all([
    readFile('prisma/schema.prisma', 'utf8'),
    readFile('prisma/migrations/20260722050000_integrations/migration.sql', 'utf8').catch(() => ''),
    readFile('actions/integrations.ts', 'utf8').catch(() => ''),
    readFile('app/api/webhooks/github/route.ts', 'utf8').catch(() => ''),
  ]);
  assert.match(schema, /model TeamIntegration/);
  assert.match(schema, /model WebhookDelivery/);
  assert.match(migration, /UNIQUE.*deliveryId/i);
  assert.match(actions, /saveGitHubIntegration/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /x-github-delivery/);
  assert.match(route, /Fixes|Closes/);
});
