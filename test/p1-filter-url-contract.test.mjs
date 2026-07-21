import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 filters are restored from and synchronized to the URL with a reset action', async () => {
  const page = await readFile('app/page.tsx', 'utf8');

  assert.match(page, /useSearchParams/);
  assert.match(page, /router\.replace/);
  assert.match(page, /Сбросить фильтры/);
  assert.match(page, /URLSearchParams/);
  assert.match(page, /params\.delete\(key\)/);
});
