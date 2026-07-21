import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("workflow actions scope reads, positions and replacements to a team", async () => {
  const source = await readFile("actions/workflow.ts", "utf8");

  assert.match(source, /getWorkflowStatuses\(teamId: string\)/);
  assert.match(source, /where: \{ teamId \}/);
  assert.match(source, /where: \{ teamId: data\.teamId \}/);
  assert.match(source, /teamId: data\.teamId/);
  assert.match(source, /teamId: statusToDelete\.teamId/);
  assert.doesNotMatch(source, /teamId:\s*undefined/);
});

test("workflow administration lets an admin select the team being configured", async () => {
  const source = await readFile("app/admin/workflow/page.tsx", "utf8");

  assert.match(source, /getAdminTeams/);
  assert.match(source, /selectedTeamId/);
  assert.match(source, /getWorkflowStatuses\(selectedTeamId\)/);
  assert.match(source, /teamId: selectedTeamId/);
  assert.match(source, /<select/);
});
