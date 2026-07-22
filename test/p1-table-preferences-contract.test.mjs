import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 issue table saves visible columns in the authenticated user profile', async () => {
  const [schema, settings, home, table] = await Promise.all([
    readFile('prisma/schema.prisma', 'utf8'),
    readFile('actions/settings.ts', 'utf8'),
    readFile('app/page.tsx', 'utf8'),
    readFile('components/IssueTable.tsx', 'utf8'),
  ]);
  assert.match(schema, /preferences\s+Json\?/);
  assert.match(settings, /getIssueListPreferences/);
  assert.match(settings, /saveIssueListPreferences/);
  assert.match(home, /Настроить колонки/);
  assert.match(table, /visibleColumns/);
});
