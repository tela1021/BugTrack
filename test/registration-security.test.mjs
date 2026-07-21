import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public registration is disabled until invitations are implemented", async () => {
  const source = await readFile("app/api/auth/register/route.ts", "utf8");

  assert.match(source, /status:\s*403/);
  assert.doesNotMatch(source, /prisma\.user\.create/);
});
