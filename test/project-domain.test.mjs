import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("projects belong to teams and use project persistence instead of the team table", async () => {
  const [schema, projects, workflow] = await Promise.all([
    readFile("prisma/schema.prisma", "utf8"),
    readFile("actions/projects.ts", "utf8"),
    readFile("app/admin/workflow/page.tsx", "utf8"),
  ]);

  assert.match(schema, /projects\s+Project\[\]/);
  assert.match(schema, /model Project[\s\S]*?teamId\s+String/);
  assert.match(schema, /team\s+Team\s+@relation\(fields: \[teamId\]/);
  assert.match(projects, /prisma\.project\.findMany/);
  assert.match(projects, /prisma\.project\.create/);
  assert.doesNotMatch(projects, /prisma\.team\.create/);
  assert.match(workflow, /getAdminTeams/);
});
