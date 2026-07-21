import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 issue list uses a data table backed by cursor pagination', async () => {
  const [table, issuesAction, home, viewModels] = await Promise.all([
    readFile('components/IssueTable.tsx', 'utf8'),
    readFile('actions/issues.ts', 'utf8'),
    readFile('app/page.tsx', 'utf8'),
    readFile('types/view-models.ts', 'utf8'),
  ]);

  assert.match(table, /<table/);
  for (const column of ['ID', 'Название', 'Приоритет', 'Статус', 'Исполнитель', 'Метки', 'Проект', 'Обновлено']) {
    assert.match(table, new RegExp(column));
  }
  assert.match(table, /aria-label="Следующая страница"/);
  assert.match(table, /aria-label="Предыдущая страница"/);
  assert.match(table, /useRouter/);
  assert.match(table, /onClick=\{\(\) => openIssue\(issue\.readableId\)\}/);
  assert.match(table, /onKeyDown=\{\(event\) => handleRowKeyDown\(event, issue\.readableId\)\}/);
  assert.match(issuesAction, /export async function getIssuesPage/);
  assert.match(issuesAction, /take:\s*limit\s*\+\s*1/);
  assert.match(issuesAction, /cursor:/);
  assert.match(home, /getIssuesPage/);
  assert.match(home, /IssueTable/);
  assert.match(viewModels, /updatedAt/);
  assert.match(viewModels, /labels:/);
});
