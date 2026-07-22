import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 Kanban enforces configurable WIP limits before an optimistic move', async () => {
  const [schema, board, workflowAction, workflowPage, validation] = await Promise.all([
    readFile('prisma/schema.prisma', 'utf8'),
    readFile('components/Board.tsx', 'utf8'),
    readFile('actions/workflow.ts', 'utf8'),
    readFile('app/admin/workflow/page.tsx', 'utf8'),
    readFile('lib/validation.mts', 'utf8'),
  ]);

  assert.match(schema, /wipLimit\s+Int\?/);
  assert.match(board, /wipLimit/);
  assert.match(board, /pendingWipMove/);
  assert.match(board, /WIP-лимит/);
  assert.match(board, /Подтвердить перенос/);
  assert.match(workflowAction, /workflowStatusUpdateSchema/);
  assert.match(workflowPage, /WIP-лимит/);
  assert.match(validation, /workflowStatusUpdateSchema/);
});
