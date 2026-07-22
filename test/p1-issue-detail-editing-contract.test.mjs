import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 issue detail supports direct editing and keyboard comment submission', async () => {
  const page = await readFile('app/issues/[readableId]/page.tsx', 'utf8');
  assert.match(page, /Редактировать описание/);
  assert.match(page, /handleIssueUpdate/);
  assert.match(page, /priority:/);
  assert.match(page, /Ctrl\+Enter/);
  assert.match(page, /event\.metaKey/);
});
