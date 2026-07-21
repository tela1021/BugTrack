import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("notifications are read and marked only by their owner", async () => {
  const source = await readFile("actions/notifications.ts", "utf8");

  assert.equal((source.match(/await requireAuthenticatedUser\(\)/g) ?? []).length, 3);
  assert.match(
    source,
    /notification\.updateMany\([\s\S]*?where: \{ id, userId \}[\s\S]*?data: \{ read: true \}/
  );
  assert.doesNotMatch(source, /notification\.update\(/);
});
