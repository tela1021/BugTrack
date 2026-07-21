import assert from "node:assert/strict";
import test from "node:test";

import { hasRequiredTeamRole, isTeamRole } from "../lib/team-access.mts";

test("team role hierarchy permits only equal or higher privileges", () => {
  assert.equal(hasRequiredTeamRole("OWNER", "ADMIN"), true);
  assert.equal(hasRequiredTeamRole("ADMIN", "MEMBER"), true);
  assert.equal(hasRequiredTeamRole("MEMBER", "ADMIN"), false);
  assert.equal(hasRequiredTeamRole(null, "MEMBER"), false);
});

test("team role parser rejects global and unknown roles", () => {
  assert.equal(isTeamRole("OWNER"), true);
  assert.equal(isTeamRole("MEMBER"), true);
  assert.equal(isTeamRole("ADMIN"), true);
  assert.equal(isTeamRole("SUPERADMIN"), false);
  assert.equal(isTeamRole(undefined), false);
});
