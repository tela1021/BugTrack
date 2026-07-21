import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { analyzeSqliteDatabase } from "../scripts/sqlite-migration-report.mjs";

test("migration dry run blocks cutover when teams have no membership records", () => {
  const source = new DatabaseSync(":memory:");
  source.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY);
    CREATE TABLE teams (id TEXT PRIMARY KEY);
    CREATE TABLE team_members (id TEXT PRIMARY KEY, userId TEXT, teamId TEXT);
    INSERT INTO users (id) VALUES ('user-1');
    INSERT INTO teams (id) VALUES ('team-1');
  `);

  const report = analyzeSqliteDatabase(source);
  source.close();

  assert.equal(report.canWrite, false);
  assert.equal(report.tableCounts.users, 1);
  assert.equal(report.tableCounts.teams, 1);
  assert.equal(report.tableCounts.team_members, 0);
  assert.deepEqual(report.blockers, [
    {
      code: "MISSING_TEAM_MEMBERSHIPS",
      message: "Teams exist but no TeamMember records are available for a safe RBAC migration.",
      teamCount: 1,
    },
  ]);
});
