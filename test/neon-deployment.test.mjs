import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("deployment configuration targets Neon PostgreSQL with tracked migrations", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8");
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const envExample = await readFile(".env.example", "utf8");
  const deployScript = await readFile("deploy.sh", "utf8");

  assert.match(schema, /provider\s*=\s*"postgresql"/);
  assert.match(packageJson.scripts.build, /prisma generate && next build/);
  assert.match(envExample, /^DATABASE_URL="postgresql:\/\//m);
  assert.match(envExample, /^NEXTAUTH_URL="https:\/\//m);
  assert.match(deployScript, /npx prisma migrate deploy/);
  assert.doesNotMatch(deployScript, /npx prisma db push/);
  await access("prisma/migrations/migration_lock.toml");
  await access("prisma/migrations/20260717000000_init/migration.sql");
});
