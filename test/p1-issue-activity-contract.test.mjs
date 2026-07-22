import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 issue detail renders a safe Markdown preview and shows newest activity at the bottom', async () => {
  const [action, page, markdown] = await Promise.all([
    readFile('actions/issue-details.ts', 'utf8'),
    readFile('app/issues/[readableId]/page.tsx', 'utf8'),
    readFile('components/MarkdownPreview.tsx', 'utf8').catch(() => ''),
  ]);

  assert.match(action, /comments:[\s\S]*orderBy: \{ createdAt: 'asc' \}/);
  assert.match(action, /history:[\s\S]*orderBy: \{ createdAt: 'asc' \}/);
  assert.match(page, /MarkdownPreview/);
  assert.match(page, /fieldLabels/);
  assert.ok(markdown.includes('https?:\\/\\/'));
  assert.doesNotMatch(markdown, /dangerouslySetInnerHTML/);
});
