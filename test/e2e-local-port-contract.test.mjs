import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Playwright smoke test uses the isolated BugTrack development port', async () => {
  const config = await readFile('playwright.config.ts', 'utf8');

  assert.match(config, /http:\/\/\[::1\]:3009/);
  assert.match(config, /npm run dev:bugtrack/);
  assert.match(config, /reuseExistingServer/);
});
