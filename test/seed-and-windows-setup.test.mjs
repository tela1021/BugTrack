import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("Windows setup uses tracked Prisma migrations", async () => {
  const script = await readFile("final_setup.bat", "utf8");
  assert.match(script, /npx prisma migrate deploy/);
  assert.doesNotMatch(script, /npx prisma db push/);
});

test("seed is repeatable and requires an explicit strong password", async () => {
  const [pkg, seed] = await Promise.all([
    readFile("package.json", "utf8"),
    readFile("prisma/seed.mjs", "utf8"),
  ]);
  assert.match(pkg, /prisma\/seed\.mjs/);
  assert.match(seed, /SEED_ADMIN_PASSWORD/);
  assert.match(seed, /at least 12 characters/);
  assert.match(seed, /workflowStatus\.upsert/);
  assert.match(seed, /teamMember\.upsert/);
  assert.doesNotMatch(seed, /require\(/);
  await assert.rejects(access("prisma/seed.js"));
});
