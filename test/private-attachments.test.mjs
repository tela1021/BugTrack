import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("attachments are stored outside public files and served through an authorized route", async () => {
  const [storage, issueActions, details, route, gitignore] = await Promise.all([
    readFile("lib/attachment-storage.ts", "utf8"),
    readFile("actions/issues.ts", "utf8"),
    readFile("actions/issue-details.ts", "utf8"),
    readFile("app/api/attachments/[id]/route.ts", "utf8"),
    readFile(".gitignore", "utf8"),
  ]);

  assert.match(storage, /storage["']?,\s*["']attachments/);
  assert.match(issueActions, /saveAttachmentFile/);
  assert.match(details, /saveAttachmentFile/);
  assert.doesNotMatch(issueActions, /public["']?,\s*["']uploads/);
  assert.doesNotMatch(details, /public["']?,\s*["']uploads/);
  assert.match(route, /requireIssueAccess\(attachment\.issueId, ['"]MEMBER['"]\)/);
  assert.match(route, /readAttachmentFile/);
  assert.match(gitignore, /^\/storage\/$/m);
});
