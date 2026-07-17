import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("development server and authentication URL use port 3008", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const env = await readFile(".env", "utf8");

  assert.match(packageJson.scripts.dev, /--port 3008/);
  assert.match(env, /^NEXTAUTH_URL="http:\/\/localhost:3008"$/m);
});
