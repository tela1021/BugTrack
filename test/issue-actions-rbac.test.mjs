import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("issue mutations require team membership before writing", async () => {
  const issueActions = await readFile("actions/issues.ts", "utf8");
  const detailActions = await readFile("actions/issue-details.ts", "utf8");

  assert.match(issueActions, /await requireTeamRole\(team\.id, "MEMBER"\)/);
  assert.equal(
    (detailActions.match(/await requireIssueAccess\((?:issueId|id), "MEMBER"\)/g) ?? []).length,
    3
  );
  assert.match(
    detailActions,
    /export async function updateIssue\(id: number,[\s\S]*?await requireIssueAccess\(id, "MEMBER"\)/
  );
  assert.doesNotMatch(detailActions, /session\.user/);
  assert.doesNotMatch(detailActions, /for \(const userId of recipients\)/);
});

test("issue reads are restricted to the authenticated user's teams", async () => {
  const issueActions = await readFile("actions/issues.ts", "utf8");
  const detailActions = await readFile("actions/issue-details.ts", "utf8");

  assert.match(issueActions, /const userId = await requireAuthenticatedUser\(\)/);
  assert.match(issueActions, /const where: Prisma\.IssueWhereInput = \{ teamId: \{ in: accessibleTeamIds \}, deletedAt: null \}/);
  assert.match(
    detailActions,
    /getIssueByReadableId[\s\S]*?await requireIssueAccess\(issue\.id, "MEMBER"\)/
  );
});
