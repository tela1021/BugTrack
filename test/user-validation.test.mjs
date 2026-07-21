import assert from "node:assert/strict";
import test from "node:test";
import { createUserSchema } from "../lib/validation.mts";

test("user validation requires a valid email and a 12-character password", () => {
  assert.equal(createUserSchema.safeParse({ name: "Ada", email: "bad", role: "ADMIN", password: "short" }).success, false);
  assert.equal(createUserSchema.safeParse({ name: "Ada", email: "ada@example.com", role: "ADMIN", password: "correct-horse-battery" }).success, true);
});
