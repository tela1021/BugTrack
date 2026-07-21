import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("workflow statuses are mandatory and unique within a team", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8");
  assert.match(schema, /teamId\s+String\n/);
  assert.match(schema, /@@unique\(\[teamId, name\]\)/);
  assert.match(schema, /@@unique\(\[teamId, position\]\)/);
});
