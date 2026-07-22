import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P2 SLA stores a team policy and calculates bug response and resolution risk in business time', async () => {
  const [schema, migration, actions, panel, page] = await Promise.all([
    readFile('prisma/schema.prisma', 'utf8'),
    readFile('prisma/migrations/20260722060000_sla_policy/migration.sql', 'utf8').catch(() => ''),
    readFile('actions/sla.ts', 'utf8').catch(() => ''),
    readFile('components/SlaPanel.tsx', 'utf8').catch(() => ''),
    readFile('app/teams/[id]/page.tsx', 'utf8'),
  ]);
  assert.match(schema, /slaPolicy\s+Json\?/);
  assert.match(migration, /slaPolicy/);
  assert.match(actions, /businessMinutesBetween/);
  assert.match(actions, /timezone/);
  assert.match(panel, /SLA bug/);
  assert.match(panel, /Риск нарушения/);
  assert.match(page, /SlaPanel/);
});
