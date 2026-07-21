import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("issue detail status and assignee options are scoped to accessible team data", async () => {
  const [actions, page] = await Promise.all([
    readFile("actions/issue-details.ts", "utf8"),
    readFile("app/issues/[readableId]/page.tsx", "utf8"),
  ]);

  assert.match(actions, /export async function getUsers\(teamKey: string\)/);
  assert.match(actions, /await requireTeamRole\(team\.id, "MEMBER"\)/);
  assert.match(actions, /export async function getStatuses\(teamKey\?: string\)/);
  assert.match(actions, /const userId = await requireAuthenticatedUser\(\)/);
  assert.match(actions, /let where = \{ teamId: \{ in: accessibleTeamIds \} \}/);
  assert.match(actions, /team: true/);
  assert.match(page, /getUsers\(issueData\.team\.key\)/);
  assert.match(page, /getStatuses\(issueData\.team\.key\)/);
});
