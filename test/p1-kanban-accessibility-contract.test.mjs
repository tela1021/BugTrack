import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 Kanban provides keyboard-accessible Move to controls and sticky column headers', async () => {
  const [board, css] = await Promise.all([
    readFile('components/Board.tsx', 'utf8'),
    readFile('components/Board.module.css', 'utf8'),
  ]);

  assert.match(board, /Переместить задачу/);
  assert.match(board, /requestMove/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /overflow-x:\s*auto/);
});
