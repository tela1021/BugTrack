import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 command palette executes global actions and keeps issue search bounded', async () => {
  const [palette, searchAction, layoutContent, events, home] = await Promise.all([
    readFile('components/CommandPalette.tsx', 'utf8'),
    readFile('actions/search.ts', 'utf8'),
    readFile('components/LayoutContent.tsx', 'utf8'),
    readFile('lib/client-events.ts', 'utf8'),
    readFile('app/page.tsx', 'utf8'),
  ]);

  assert.match(events, /CREATE_ISSUE_EVENT/);
  assert.match(palette, /SEARCH_DEBOUNCE_MS\s*=\s*200/);
  assert.match(palette, /window\.setTimeout/);
  assert.match(palette, /CREATE_ISSUE_EVENT/);
  assert.match(palette, /router\.push\('\/\?view=board'\)/);
  assert.match(palette, /router\.push\('\/admin\/projects'\)/);
  assert.match(palette, /navigate\('\/settings'\)/);
  assert.match(palette, /key\s*===\s*'c'/);
  assert.match(palette, /key\s*===\s*'g'/);
  assert.match(searchAction, /take:\s*20/);
  assert.match(searchAction, /team:\s*{\s*select:/);
  assert.match(searchAction, /project:\s*{\s*select:/);
  assert.match(palette, /issue\.team/);
  assert.match(palette, /issue\.project/);
  assert.match(layoutContent, /CreateIssueModal/);
  assert.match(layoutContent, /CREATE_ISSUE_EVENT/);
  assert.match(home, /searchParams\.get\('view'\)/);
});
