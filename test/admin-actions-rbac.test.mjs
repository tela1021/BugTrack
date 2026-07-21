import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("workflow and project administration permit team admins or workspace admins", async () => {
  const [workflow, projects] = await Promise.all([
    readFile("actions/workflow.ts", "utf8"),
    readFile("actions/projects.ts", "utf8"),
  ]);

  assert.equal((workflow.match(/await requireTeamAdminOrGlobal\(/g) ?? []).length, 4);
  assert.equal((projects.match(/await requireTeamAdminOrGlobal\(/g) ?? []).length, 2);
  assert.match(projects, /await requireGlobalAdmin\(\)/);
});
