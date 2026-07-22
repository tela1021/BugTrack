import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 project and cycle filters are scoped on the server and retained in URL state', async () => {
  const [formData, action, home, filters] = await Promise.all([
    readFile('actions/form-data.ts', 'utf8'),
    readFile('actions/issues.ts', 'utf8'),
    readFile('app/page.tsx', 'utf8'),
    readFile('components/FiltersBar.tsx', 'utf8'),
  ]);

  assert.match(formData, /projects:/);
  assert.match(formData, /cycles:/);
  assert.match(action, /filters\?\.projectId/);
  assert.match(action, /filters\?\.cycleId/);
  assert.match(home, /projectId: ''/);
  assert.match(home, /cycleId: ''/);
  assert.match(filters, /Проект/);
  assert.match(filters, /Цикл/);
});
