import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 layout provides a labelled mobile navigation drawer and responsive detail layout', async () => {
  const [layout, shellCss, detailCss, filtersCss] = await Promise.all([
    readFile('components/LayoutContent.tsx', 'utf8'),
    readFile('components/LayoutContent.module.css', 'utf8').catch(() => ''),
    readFile('app/issues/[readableId]/IssueDetails.module.css', 'utf8'),
    readFile('components/FiltersBar.module.css', 'utf8'),
  ]);

  assert.match(layout, /Открыть навигацию/);
  assert.match(layout, /drawerOpen/);
  assert.match(shellCss, /@media \(max-width: 767px\)/);
  assert.match(detailCss, /grid-template-columns:\s*1fr/);
  assert.match(filtersCss, /flex-wrap:\s*wrap/);
});
