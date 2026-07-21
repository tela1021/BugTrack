import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('CI provisions PostgreSQL, applies Prisma migrations and runs browser smoke tests', async () => {
  const [workflow, packageJson, playwrightConfig] = await Promise.all([
    readFile('.github/workflows/ci.yml', 'utf8'),
    readFile('package.json', 'utf8'),
    readFile('playwright.config.ts', 'utf8'),
  ]);

  assert.match(workflow, /postgres:/);
  assert.match(workflow, /prisma migrate deploy/);
  assert.match(workflow, /npm run test:e2e/);
  assert.match(packageJson, /"test:e2e"/);
  assert.match(playwrightConfig, /webServer/);
});
