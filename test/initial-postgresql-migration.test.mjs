import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("initial PostgreSQL migration creates the BugTrack schema from an empty database", async () => {
  const sql = await readFile(
    "prisma/migrations/20260721000000_initial_postgresql/migration.sql",
    "utf8"
  );
  assert.match(sql, /CREATE TABLE "users"/);
  assert.match(sql, /CREATE TABLE "issues"/);
  assert.match(sql, /CREATE UNIQUE INDEX "issues_readableId_key"/);
});
