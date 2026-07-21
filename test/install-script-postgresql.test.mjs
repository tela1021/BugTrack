import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("installation applies tracked Prisma migrations instead of synchronizing schema directly", async () => {
  const script = await readFile("install.sh", "utf8");

  assert.match(script, /npx prisma migrate deploy/);
  assert.doesNotMatch(script, /npx prisma db push/);
  assert.doesNotMatch(script, /file:\.\/dev\.db/);
  assert.doesNotMatch(script, /npm run seed/);
});
