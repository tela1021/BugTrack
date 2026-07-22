import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 Kanban supports accessible grouping by assignee and priority', async () => {
  const board = await readFile('components/Board.tsx', 'utf8');

  assert.match(board, /groupMode/);
  assert.match(board, /Группировка Kanban/);
  assert.match(board, /По исполнителю/);
  assert.match(board, /По приоритету/);
  assert.match(board, /assigneeName/);
  assert.match(board, /priority/);
});
