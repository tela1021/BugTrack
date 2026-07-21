import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("runtime configuration uses PostgreSQL migrations instead of SQLite db push", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8");
  const deployScript = await readFile("deploy.sh", "utf8");
  const envExample = await readFile(".env.example", "utf8");
  const runtimeConfig = await readFile("lib/runtime-config.ts", "utf8");

  assert.match(schema, /provider\s*=\s*"postgresql"/);
  assert.match(schema, /directUrl\s*=\s*env\("DIRECT_URL"\)/);
  assert.match(envExample, /^DATABASE_URL="postgresql:\/\//m);
  assert.match(envExample, /^DIRECT_URL="postgresql:\/\//m);
  assert.match(deployScript, /npx prisma migrate deploy/);
  assert.doesNotMatch(deployScript, /npx prisma db push/);
  assert.match(runtimeConfig, /Missing required environment variable/);
  assert.match(runtimeConfig, /DATABASE_URL must use the PostgreSQL protocol/);
  await access("prisma/migrations/migration_lock.toml");
});
