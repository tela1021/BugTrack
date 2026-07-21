import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("package scripts expose the SQLite migration dry run", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(
    packageJson.scripts["db:migration-report"],
    "node scripts/sqlite-migration-report.mjs"
  );
});

test("package scripts run the complete test suite with TypeScript stripping", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(
    packageJson.scripts.test,
    "node --experimental-strip-types --test test/*.mjs"
  );
});
