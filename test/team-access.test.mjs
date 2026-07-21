import assert from "node:assert/strict";
import test from "node:test";

import { TeamAccessError, requireTeamAccess } from "../lib/team-access.mts";

test("team access rejects an authenticated user without membership", () => {
  assert.throws(
    () => requireTeamAccess(null, "MEMBER"),
    (error) => error instanceof TeamAccessError && error.code === "FORBIDDEN"
  );
});

test("team access returns the membership role when it meets the requirement", () => {
  assert.equal(requireTeamAccess("ADMIN", "MEMBER"), "ADMIN");
});
