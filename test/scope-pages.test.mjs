import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("team and project pages load authorized database data instead of mock arrays", async () => {
  const [teamPage, projectPage, teams, projects] = await Promise.all([
    readFile("app/teams/[id]/page.tsx", "utf8"),
    readFile("app/projects/[id]/page.tsx", "utf8"),
    readFile("actions/teams.ts", "utf8"),
    readFile("actions/projects.ts", "utf8"),
  ]);

  assert.match(teamPage, /getTeamById/);
  assert.match(teamPage, /getIssues/);
  assert.match(projectPage, /getProjectById/);
  assert.match(projectPage, /getIssues/);
  assert.doesNotMatch(teamPage, /No issues assigned specifically/);
  assert.doesNotMatch(projectPage, /mockup data|const issues = \[/);
  assert.doesNotMatch(projectPage, /console\.log/);
  assert.match(teams, /requireTeamRole/);
  assert.match(projects, /requireTeamRole/);
});
