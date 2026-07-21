import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("user administration requires an admin and never uses a default password", async () => {
  const source = await readFile("actions/users.ts", "utf8");

  assert.equal((source.match(/await requireGlobalAdmin\(\)/g) ?? []).length, 4);
  assert.doesNotMatch(source, /123456/);
  assert.match(source, /password: string/);
});
