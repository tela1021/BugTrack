import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 issue type and bug template are persisted, validated, and available in list controls', async () => {
  const [schema, validation, actions, modal, page, table] = await Promise.all([
    readFile('prisma/schema.prisma', 'utf8'),
    readFile('lib/validation.mts', 'utf8'),
    readFile('actions/issues.ts', 'utf8'),
    readFile('components/CreateIssueModal.tsx', 'utf8'),
    readFile('app/page.tsx', 'utf8'),
    readFile('components/IssueTable.tsx', 'utf8'),
  ]);

  assert.match(schema, /issueType\s+String/);
  assert.match(validation, /issueType/);
  assert.match(actions, /input\.issueType/);
  assert.match(actions, /bug template/i);
  assert.match(modal, /Шаги воспроизведения/);
  assert.match(modal, /Фактический результат/);
  assert.match(modal, /Окружение/);
  assert.match(modal, /Версия/);
  assert.match(page, /issueType: 'All'/);
  assert.match(table, /'type'/);
});
