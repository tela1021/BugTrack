import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P2 team UI configures the repository, automation actor, and workflow mapping for GitHub', async () => {
  const [component, page] = await Promise.all([
    readFile('components/GitHubIntegrationSettings.tsx', 'utf8').catch(() => ''),
    readFile('app/teams/[readableId]/page.tsx', 'utf8').catch(() => readFile('app/teams/[id]/page.tsx', 'utf8')),
  ]);
  assert.match(component, /saveGitHubIntegration/);
  assert.match(component, /Репозиторий/);
  assert.match(component, /Automation actor/);
  assert.match(component, /Статус PR/);
  assert.match(page, /GitHubIntegrationSettings/);
});
