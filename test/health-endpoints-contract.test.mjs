import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('health endpoints expose liveness without DB and readiness with SELECT 1', async () => {
  const [live, ready] = await Promise.all([
    readFile('app/api/health/live/route.ts', 'utf8'),
    readFile('app/api/health/ready/route.ts', 'utf8'),
  ]);
  assert.doesNotMatch(live, /prisma/);
  assert.match(ready, /\$queryRaw/);
  assert.match(ready, /503/);
});
