import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

for (const filename of [
  "cleanup_statuses.js",
  "debug_bug11.js",
  "debug_get_statuses.js",
  "debug_statuses.js",
  "migrate_to_global_statuses.js",
]) {
  test(`${filename} is not part of the runtime repository`, async () => {
    await assert.rejects(access(filename));
  });
}
