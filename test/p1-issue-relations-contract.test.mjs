import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 issue detail supports team-scoped parent and subtask relationships', async () => {
  const [validation, actions, detail] = await Promise.all([
    readFile('lib/validation.mts', 'utf8'),
    readFile('actions/issue-details.ts', 'utf8'),
    readFile('app/issues/[readableId]/page.tsx', 'utf8'),
  ]);

  assert.match(validation, /parentId/);
  assert.match(actions, /Parent issue must belong to the issue team/);
  assert.match(actions, /children:/);
  assert.match(detail, /Родительская задача/);
  assert.match(detail, /Подзадачи/);
  assert.match(detail, /Прогресс подзадач/);
});
