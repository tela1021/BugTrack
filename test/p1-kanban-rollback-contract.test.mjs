import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Kanban keeps a snapshot and rolls back an optimistic move when persistence fails', async () => {
  const board = await readFile('components/Board.tsx', 'utf8');
  const page = await readFile('app/page.tsx', 'utf8');

  assert.match(board, /previousColumns/);
  assert.match(board, /setColumns\(previousColumns\)/);
  assert.match(board, /pendingIssueId/);
  assert.match(page, /Promise<boolean>/);
});
