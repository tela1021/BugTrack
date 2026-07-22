import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 issue detail exposes team-scoped project and cycle controls', async () => {
  const page = await readFile('app/issues/[readableId]/page.tsx', 'utf8');

  assert.match(page, /getIssueFormData/);
  assert.match(page, /label>Проект<\/label/);
  assert.match(page, /label>Цикл<\/label/);
  assert.match(page, /projectId:/);
  assert.match(page, /cycleId:/);
});
