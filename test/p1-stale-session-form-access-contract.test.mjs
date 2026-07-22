import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('create issue form explains missing team access and offers a fresh sign-in', async () => {
  const source = await readFile('components/CreateIssueModal.tsx', 'utf8');

  assert.match(source, /signOut/);
  assert.match(source, /teams\.length === 0/);
  assert.match(source, /Выйти и войти заново/);
  assert.match(source, /Нет доступа ни к одной команде/);
});
