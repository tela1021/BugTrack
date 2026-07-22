import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('create issue form waits for a team status before allowing submission', async () => {
  const source = await readFile('components/CreateIssueModal.tsx', 'utf8');

  assert.match(source, /disabled=\{loading \|\| !selectedTeamData\?\.statuses\.length\}/);
  assert.match(source, /Загружаем команды/);
});

test('create issue action returns a readable message for validation failures', async () => {
  const source = await readFile('actions/issues.ts', 'utf8');

  assert.match(source, /ZodError/);
  assert.match(source, /Заполните обязательные поля задачи/);
});
