import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("issue project and cycle updates are limited to the issue team", async () => {
  const [validation, actions] = await Promise.all([
    readFile("lib/validation.mts", "utf8"),
    readFile("actions/issue-details.ts", "utf8"),
  ]);

  assert.match(validation, /projectId:/);
  assert.match(validation, /cycleId:/);
  assert.match(actions, /prisma\.project\.findFirst/);
  assert.match(actions, /where: \{ id: input\.projectId, teamId: oldIssue\.teamId \}/);
  assert.match(actions, /prisma\.cycle\.findFirst/);
  assert.match(actions, /where: \{ id: input\.cycleId, teamId: oldIssue\.teamId \}/);
});
