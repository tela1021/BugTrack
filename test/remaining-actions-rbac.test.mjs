import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("search, sidebar and label reads are scoped to authenticated team membership", async () => {
  const [search, sidebar, labels] = await Promise.all([
    readFile("actions/search.ts", "utf8"),
    readFile("actions/sidebar.ts", "utf8"),
    readFile("actions/labels.ts", "utf8"),
  ]);

  assert.match(search, /requireAuthenticatedUser/);
  assert.match(search, /teamId: \{ in: accessibleTeamIds \}/);
  assert.match(search, /deletedAt: null/);
  assert.match(sidebar, /requireAuthenticatedUser/);
  assert.match(sidebar, /teamMember\.findMany/);
  assert.match(sidebar, /teamId: \{ in: accessibleTeamIds \}/);
  assert.match(labels, /getAllLabels\(teamId: string\)/);
  assert.match(labels, /requireTeamRole\(teamId, "MEMBER"\)/);
  assert.match(labels, /where: \{ teamId \}/);
});
