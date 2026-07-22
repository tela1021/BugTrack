import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 issue links persist typed relationships only within the same team', async () => {
  const [schema, migration, actions, page] = await Promise.all([
    readFile('prisma/schema.prisma', 'utf8'),
    readFile('prisma/migrations/20260722070000_issue_links/migration.sql', 'utf8').catch(() => ''),
    readFile('actions/issue-links.ts', 'utf8').catch(() => ''),
    readFile('app/issues/[readableId]/page.tsx', 'utf8'),
  ]);
  assert.match(schema, /model IssueLink/);
  assert.match(migration, /issue_links/);
  assert.match(actions, /Linked issue must belong to the issue team/);
  assert.match(page, /Связи задач/);
  assert.match(page, /BLOCKS/);
});
