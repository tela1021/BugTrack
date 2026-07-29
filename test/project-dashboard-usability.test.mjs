import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('dashboard exposes distinct team and project filters', async () => {
  const filters = await readFile('components/FiltersBar.tsx', 'utf8');

  assert.match(filters, /aria-label="Команда"/);
  assert.match(filters, /<option value="All">Все команды<\/option>/);
  assert.match(filters, /aria-label="Проект"/);
  assert.match(filters, /<option value="">Все проекты<\/option>/);
});

test('issue project control shows save progress and prevents duplicate updates', async () => {
  const page = await readFile('app/issues/[readableId]/page.tsx', 'utf8');

  assert.match(page, /projectSaving/);
  assert.match(page, /handleProjectChange/);
  assert.match(page, /disabled=\{projectSaving/);
  assert.match(page, /Сохраняем проект/);
});

test('kanban uses one explicit two-axis scroll region within the dashboard viewport', async () => {
  const [home, board, boardStyles] = await Promise.all([
    readFile('app/page.tsx', 'utf8'),
    readFile('components/Board.tsx', 'utf8'),
    readFile('components/Board.module.css', 'utf8'),
  ]);

  assert.match(home, /dashboardPage/);
  assert.match(home, /dashboardContent/);
  assert.match(board, /aria-label="Доска задач, прокрутка по горизонтали и вертикали"/);
  assert.match(boardStyles, /\.boardArea\s*\{[^}]*min-height:\s*0/s);
  assert.match(boardStyles, /\.board\s*\{[^}]*overflow-x:\s*auto[^}]*overflow-y:\s*auto/s);
  assert.doesNotMatch(boardStyles, /height:\s*calc\(100vh\s*-\s*160px\)/);
  assert.doesNotMatch(boardStyles, /\.column\s*\{[^}]*overflow-y:\s*auto/s);
});
