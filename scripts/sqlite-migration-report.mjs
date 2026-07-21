import { DatabaseSync } from "node:sqlite";

const sourceTables = [
  "users",
  "teams",
  "team_members",
  "workflow_statuses",
  "projects",
  "cycles",
  "issues",
  "labels",
  "_LabelToIssue",
  "comments",
  "issue_history",
  "attachments",
  "notifications",
];

function tableExists(database, table) {
  return database
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table) !== undefined;
}

function getTableCount(database, table) {
  if (!tableExists(database, table)) {
    return 0;
  }

  return database.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get().count;
}

export function analyzeSqliteDatabase(database) {
  const tableCounts = Object.fromEntries(
    sourceTables.map((table) => [table, getTableCount(database, table)])
  );
  const blockers = [];

  if (tableCounts.teams > 0 && tableCounts.team_members === 0) {
    blockers.push({
      code: "MISSING_TEAM_MEMBERSHIPS",
      message: "Teams exist but no TeamMember records are available for a safe RBAC migration.",
      teamCount: tableCounts.teams,
    });
  }

  return {
    source: "sqlite",
    tableCounts,
    blockers,
    canWrite: blockers.length === 0,
  };
}

function run() {
  const sourcePath = process.argv[2] ?? "prisma/dev.db";
  const source = new DatabaseSync(sourcePath, { readOnly: true });

  try {
    const report = analyzeSqliteDatabase(source);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.canWrite ? 0 : 2;
  } finally {
    source.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
