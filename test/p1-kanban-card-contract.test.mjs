import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 Kanban card exposes type, labels, assignee and issue age in text', async () => {
  const card = await readFile('components/IssueCard.tsx', 'utf8');
  assert.match(card, /assigneeName/);
  assert.match(card, /issueType/);
  assert.match(card, /labels/);
  assert.match(card, /createdAt/);
  assert.match(card, /дн\./);
});
