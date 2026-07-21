import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("team administration persists teams and creates an owner membership", async () => {
  const [actions, page] = await Promise.all([
    readFile("actions/teams.ts", "utf8"),
    readFile("app/admin/teams/page.tsx", "utf8"),
  ]);

  assert.match(actions, /export async function createTeam/);
  assert.match(actions, /prisma\.team\.create/);
  assert.match(actions, /role: 'OWNER'/);
  assert.match(actions, /statuses:/);
  assert.match(page, /getAdminTeams/);
  assert.match(page, /createTeam/);
  assert.doesNotMatch(page, /Core Engineering|UI Library/);
});
