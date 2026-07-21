import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("issues support team-admin soft deletion and restoration", async () => {
  const [schema, actions, details] = await Promise.all([
    readFile("prisma/schema.prisma", "utf8"),
    readFile("actions/issues.ts", "utf8"),
    readFile("actions/issue-details.ts", "utf8"),
  ]);

  assert.match(schema, /deletedAt\s+DateTime\?/);
  assert.match(schema, /deletedById\s+String\?/);
  assert.match(actions, /deletedAt: null/);
  assert.match(details, /export async function deleteIssue/);
  assert.match(details, /requireIssueAccess\(issueId, ['"]ADMIN['"]\)/);
  assert.match(details, /export async function restoreIssue/);
  assert.match(details, /deletedAt: null/);
});
