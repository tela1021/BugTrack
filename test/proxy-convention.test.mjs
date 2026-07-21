import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("authentication interception uses the current Next.js proxy convention", async () => {
  const source = await readFile("proxy.ts", "utf8");
  assert.match(source, /export default NextAuth\(authConfig\)\.auth/);
  assert.match(source, /matcher:/);
});

test("deprecated middleware entry point is absent", async () => {
  await assert.rejects(access("middleware.ts"));
});
