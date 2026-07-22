import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 list includes a configurable cycle column', async () => {
  const [actions, types, page, table] = await Promise.all([
    readFile('actions/issues.ts', 'utf8'),
    readFile('types/view-models.ts', 'utf8'),
    readFile('app/page.tsx', 'utf8'),
    readFile('components/IssueTable.tsx', 'utf8'),
  ]);

  assert.match(actions, /cycle: true/);
  assert.match(types, /cycleName/);
  assert.match(page, /id: 'cycle'/);
  assert.match(table, /'cycle'/);
});
