import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("admin dashboard renders database statistics only at request time", async () => {
  const page = await readFile("app/admin/page.tsx", "utf8");

  assert.match(page, /export const dynamic\s*=\s*["']force-dynamic["']/);
});
