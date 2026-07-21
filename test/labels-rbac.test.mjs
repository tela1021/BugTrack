import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("label mutations verify issue access and label team", async () => {
  const source = await readFile("actions/labels.ts", "utf8");

  assert.equal((source.match(/await requireIssueLabelAccess\(issueId, labelId\)/g) ?? []).length, 2);
  assert.match(source, /await requireIssueAccess\(issueId, "MEMBER"\)/);
  assert.match(source, /label\.findUnique\(\{ where: \{ id: labelId \} \}\)/);
  assert.match(source, /label\.teamId !== issue\.teamId/);
});
