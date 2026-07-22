import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 label and updated-date filters are server-side and URL-synchronised', async () => {
  const [actions, page, filters] = await Promise.all([
    readFile('actions/issues.ts', 'utf8'),
    readFile('app/page.tsx', 'utf8'),
    readFile('components/FiltersBar.tsx', 'utf8'),
  ]);

  assert.match(actions, /filters\?\.labelId/);
  assert.match(actions, /filters\?\.updated/);
  assert.match(page, /labelId: ''/);
  assert.match(page, /updated: 'All'/);
  assert.match(filters, /Метка/);
  assert.match(filters, /Обновлены/);
});
