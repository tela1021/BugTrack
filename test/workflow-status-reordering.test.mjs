import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("workflow status ordering is validated, team-scoped, and saved atomically", async () => {
  const validation = await readFile("lib/validation.mts", "utf8");
  const actions = await readFile("actions/workflow.ts", "utf8");

  assert.match(validation, /workflowStatusOrderSchema/);
  assert.match(validation, /new Set\(statusIds\)\.size === statusIds\.length/);
  assert.match(actions, /export async function reorderWorkflowStatuses\(teamId: string, orderedStatusIds: unknown\)/);
  assert.match(actions, /requireTeamAdminOrGlobal\(teamId\)/);
  assert.match(actions, /workflowStatusOrderSchema\.parse\(orderedStatusIds\)/);
  assert.match(actions, /where: \{ teamId \}/);
  assert.match(actions, /submitted status order does not match the team's workflow/i);
  assert.match(actions, /prisma\.\$transaction/);
  assert.match(actions, /position: -\(index \+ 1\)/);
  assert.match(actions, /position: index/);
  assert.match(actions, /revalidatePath\('\/'\)/);
});

test("workflow administration reorders by an accessible drag handle and rolls back failed saves", async () => {
  const page = await readFile("app/admin/workflow/page.tsx", "utf8");

  assert.match(page, /DndContext/);
  assert.match(page, /SortableContext/);
  assert.match(page, /PointerSensor/);
  assert.match(page, /KeyboardSensor/);
  assert.match(page, /sortableKeyboardCoordinates/);
  assert.match(page, /useSortable/);
  assert.match(page, /arrayMove/);
  assert.match(page, /reorderWorkflowStatuses\(selectedTeamId, reorderedStatuses\.map\(\(status\) => status\.id\)\)/);
  assert.match(page, /setStatuses\(previousStatuses\)/);
  assert.match(page, /aria-label=\{`Изменить порядок статуса \$\{status\.name\}`\}/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /Сохраняем порядок/);
});
