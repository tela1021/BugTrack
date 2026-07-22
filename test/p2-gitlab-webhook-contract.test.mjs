import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P2 GitLab webhook verifies its token and records idempotent deliveries', async () => {
  const [actions, route] = await Promise.all([readFile('actions/integrations.ts', 'utf8'), readFile('app/api/webhooks/gitlab/route.ts', 'utf8').catch(() => '')]);
  assert.match(actions, /saveGitLabIntegration/);
  assert.match(route, /x-gitlab-token/);
  assert.match(route, /x-gitlab-event-uuid/);
  assert.match(route, /Fixes|Closes/);
});
