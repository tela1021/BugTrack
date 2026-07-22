import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P2 team dashboard exposes period-scoped flow metrics with source links and definitions', async () => {
  const [actions, component, page] = await Promise.all([
    readFile('actions/analytics.ts', 'utf8').catch(() => ''),
    readFile('components/TeamAnalytics.tsx', 'utf8').catch(() => ''),
    readFile('app/teams/[id]/page.tsx', 'utf8'),
  ]);

  assert.match(actions, /getTeamAnalytics/);
  assert.match(actions, /throughput/);
  assert.match(actions, /leadTime/);
  assert.match(component, /Период/);
  assert.match(component, /Методика/);
  assert.match(component, /Исходная выборка/);
  assert.match(page, /TeamAnalytics/);
});
