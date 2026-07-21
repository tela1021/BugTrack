import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("issue creation validates input and allocates its readable ID atomically", async () => {
  const [schema, actions] = await Promise.all([
    readFile("prisma/schema.prisma", "utf8"),
    readFile("actions/issues.ts", "utf8"),
  ]);

  assert.match(schema, /issueSequence\s+Int\s+@default\(0\)/);
  assert.match(actions, /createIssueSchema\.parse/);
  assert.match(actions, /prisma\.\$transaction/);
  assert.match(actions, /issueSequence:\s*\{\s*increment:\s*1\s*\}/);
  assert.match(actions, /\$\{team\.key\}-\$\{sequence\.issueSequence\}/);
  assert.match(actions, /prisma\.teamMember\.findUnique/);
  assert.doesNotMatch(actions, /workflowStatus\.createMany/);
  assert.doesNotMatch(actions, /issue\.count\(\{ where: \{ teamId: team\.id \} \}\)/);
});
