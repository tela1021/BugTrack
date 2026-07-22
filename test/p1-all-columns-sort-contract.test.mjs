import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 table exposes and serves sorting for every displayed data column', async () => {
  const [actions, table] = await Promise.all([readFile('actions/issues.ts', 'utf8'), readFile('components/IssueTable.tsx', 'utf8')]);
  for (const field of ['id_asc', 'type_asc', 'status_asc', 'assignee_asc', 'labels_asc', 'project_asc', 'cycle_asc']) {
    assert.match(actions, new RegExp(`case '${field}'`));
  }
  for (const label of ['ID', 'Тип', 'Статус', 'Исполнитель', 'Метки', 'Проект', 'Цикл']) assert.match(table, new RegExp(`SortButton label="${label}"`));
});
