import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("deployment script safely updates and starts the production app", async () => {
  await access("deploy.sh");
  const script = await readFile("deploy.sh", "utf8");

  assert.match(script, /set -euo pipefail/);
  assert.match(script, /APP_PORT=\"\$\{APP_PORT:-3008\}\"/);
  assert.match(script, /git pull --ff-only origin/);
  assert.match(script, /npm ci/);
  assert.match(script, /npx prisma generate/);
  assert.match(script, /npx prisma db push/);
  assert.match(script, /npm run build/);
  assert.match(script, /pm2 (?:describe|reload|start)/);
  assert.match(script, /PM2_APP_NAME/);
});
