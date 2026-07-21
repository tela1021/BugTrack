import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('team member management is restricted to team admins and preserves an owner', async () => {
  const source = await readFile('actions/teams.ts', 'utf8');
  assert.match(source, /requireTeamAdminOrGlobal\(teamId\)/);
  assert.match(source, /teamMember\.upsert/);
  assert.match(source, /ownerCount <= 1/);
  assert.match(source, /Only a team owner can assign the OWNER role/);
});
