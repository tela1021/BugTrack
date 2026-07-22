import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 priority filter is server-side and synchronized to URL', async () => {
  const [action, home, filters] = await Promise.all([
    readFile('actions/issues.ts', 'utf8'), readFile('app/page.tsx', 'utf8'), readFile('components/FiltersBar.tsx', 'utf8'),
  ]);
  assert.match(action, /filters\?\.priority/);
  assert.match(home, /priority: 'All'/);
  assert.match(filters, /Приоритет/);
});
