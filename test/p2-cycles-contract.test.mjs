import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P2 cycles persist goal and lifecycle with one active cycle per team', async () => {
  const [schema, migration, actions, teamPage] = await Promise.all([
    readFile('prisma/schema.prisma', 'utf8'),
    readFile('prisma/migrations/20260722030000_cycle_lifecycle/migration.sql', 'utf8').catch(() => ''),
    readFile('actions/cycles.ts', 'utf8').catch(() => ''),
    readFile('app/teams/[id]/page.tsx', 'utf8'),
  ]);

  assert.match(schema, /goal\s+String\?/);
  assert.match(schema, /status\s+String\s+@default\("DRAFT"\)/);
  assert.match(migration, /UNIQUE INDEX.*active/i);
  assert.match(actions, /createCycle/);
  assert.match(actions, /Only one active cycle/);
  assert.match(teamPage, /CycleManager/);
});
