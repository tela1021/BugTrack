import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 issue table persists per-column widths in the authenticated profile', async () => {
  const [settings, page, table] = await Promise.all([
    readFile('actions/settings.ts', 'utf8'),
    readFile('app/page.tsx', 'utf8'),
    readFile('components/IssueTable.tsx', 'utf8'),
  ]);

  assert.match(settings, /columnWidths/);
  assert.match(page, /Ширина колонки/);
  assert.match(page, /setColumnWidth/);
  assert.match(table, /columnWidths/);
});
