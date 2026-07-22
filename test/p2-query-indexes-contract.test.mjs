import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P2 PostgreSQL schema indexes operational issue, notification and timeline queries', async () => {
  const [schema, migration] = await Promise.all([
    readFile('prisma/schema.prisma', 'utf8'),
    readFile('prisma/migrations/20260722040000_operational_indexes/migration.sql', 'utf8').catch(() => ''),
  ]);
  assert.match(schema, /@@index\(\[teamId, updatedAt\]\)/);
  assert.match(schema, /@@index\(\[assigneeId, statusId\]\)/);
  assert.match(schema, /@@index\(\[userId, read, createdAt\]\)/);
  assert.match(schema, /@@index\(\[issueId, createdAt\]\)/);
  assert.match(migration, /issues_teamId_updatedAt_idx/);
});
