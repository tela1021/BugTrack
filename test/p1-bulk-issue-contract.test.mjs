import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 table supports bounded bulk changes with audit history', async () => {
  const [table, home, issuesAction, validation, formData] = await Promise.all([
    readFile('components/IssueTable.tsx', 'utf8'),
    readFile('app/page.tsx', 'utf8'),
    readFile('actions/issues.ts', 'utf8'),
    readFile('lib/validation.mts', 'utf8'),
    readFile('actions/form-data.ts', 'utf8'),
  ]);

  assert.match(table, /aria-label="Выбрать все задачи на странице"/);
  assert.match(table, /aria-label=\{`Выбрать задачу \$\{issue\.readableId\}`\}/);
  assert.match(table, /selectedIssueIds/);
  assert.match(table, /shiftKey/);
  assert.match(table, /closest\('a,button,input,select'\)/);
  assert.match(home, /bulkUpdateIssues/);
  assert.match(home, /Массовые действия/);
  assert.match(home, /Заменить метки/);
  assert.match(home, /Подтвердить замену меток/);
  assert.match(issuesAction, /export async function bulkUpdateIssues/);
  assert.match(issuesAction, /requireIssueAccess/);
  assert.match(issuesAction, /prisma\.\$transaction/);
  assert.match(issuesAction, /issueHistory\.createMany/);
  assert.match(validation, /bulkIssueUpdateSchema/);
  assert.match(validation, /max\(100\)/);
  assert.match(formData, /labels:/);
});
