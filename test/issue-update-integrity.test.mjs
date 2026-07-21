import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("issue updates validate the payload and keep status and assignee inside the issue team", async () => {
  const [validation, details] = await Promise.all([
    readFile("lib/validation.mts", "utf8"),
    readFile("actions/issue-details.ts", "utf8"),
  ]);

  assert.match(validation, /updateIssueSchema/);
  assert.match(details, /updateIssueSchema\.parse/);
  assert.match(details, /where: \{ id: input\.statusId, teamId: oldIssue\.teamId \}/);
  assert.match(details, /where: \{ userId_teamId: \{ userId: input\.assigneeId, teamId: oldIssue\.teamId \} \}/);
  assert.match(details, /data: input/);
  assert.doesNotMatch(details, /const updatedIssue = await prisma\.issue\.update\(\{\s*where: \{ id \},\s*data\s*\}/s);
});
