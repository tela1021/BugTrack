import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 supports persisted light, dark, and system theme preferences', async () => {
  const [settings, component, css, page] = await Promise.all([
    readFile('actions/settings.ts', 'utf8'),
    readFile('components/ThemePreference.tsx', 'utf8').catch(() => ''),
    readFile('app/globals.css', 'utf8'),
    readFile('app/settings/page.tsx', 'utf8'),
  ]);

  assert.match(settings, /saveThemePreference/);
  assert.match(component, /prefers-color-scheme/);
  assert.match(component, /dataset\.theme/);
  assert.match(css, /data-theme="dark"/);
  assert.match(page, /ThemePreference/);
});
