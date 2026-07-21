import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("issue form data is limited to the authenticated user's teams", async () => {
  const source = await readFile("actions/form-data.ts", "utf8");

  assert.match(source, /requireAuthenticatedUser/);
  assert.match(source, /prisma\.teamMember\.findMany/);
  assert.match(source, /where: \{ userId \}/);
  assert.match(source, /statuses:/);
  assert.match(source, /members:/);
  assert.doesNotMatch(source, /prisma\.user\.findMany/);
  assert.doesNotMatch(source, /prisma\.team\.findMany/);
});

test("create issue form renders statuses and assignees from the selected team", async () => {
  const source = await readFile("components/CreateIssueModal.tsx", "utf8");

  assert.match(source, /selectedTeamData/);
  assert.match(source, /selectedTeamData\?\.statuses/);
  assert.match(source, /selectedTeamData\?\.members/);
  assert.doesNotMatch(source, /<option>Todo<\/option>/);
  assert.doesNotMatch(source, /<option>In Progress<\/option>/);
});
