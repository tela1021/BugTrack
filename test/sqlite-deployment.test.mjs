import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("application configuration stays self-contained on SQLite", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8");
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const deployScript = await readFile("deploy.sh", "utf8");

  assert.match(schema, /provider\s*=\s*"sqlite"/);
  assert.equal(packageJson.scripts.build, "next build");
  assert.match(deployScript, /npx prisma db push/);
  assert.doesNotMatch(deployScript, /npx prisma migrate deploy/);
  await assert.rejects(access(".env.example"));
  await assert.rejects(access("prisma/migrations/migration_lock.toml"));
});
