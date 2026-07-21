import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("BugTrack has an isolated development port when 3008 belongs to another service", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const env = await readFile(".env", "utf8");

  assert.match(packageJson.scripts.dev, /--port 3008/);
  assert.match(packageJson.scripts["dev:bugtrack"], /--port 3009/);
  assert.match(env, /^NEXTAUTH_URL="http:\/\/localhost:3009"$/m);
});
