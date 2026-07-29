# Workflow status reordering

## Goal

Allow a team administrator to change the order of workflow statuses by dragging a status by its handle. The saved order must drive every existing consumer of `WorkflowStatus.position`, including the workflow settings page and Kanban columns.

## Interaction

- A status can be dragged only from its visible grip handle.
- The list updates optimistically when the status is dropped.
- While the new order is being saved, another reorder is disabled and an `aria-live` message reports progress.
- Success is confirmed with the existing toast system.
- If persistence fails, the previous list is restored and the error is shown.
- Pointer and keyboard sensors use the installed `dnd-kit` packages; no dependency is added.

## Server contract

The client submits the selected team ID and the complete ordered list of status IDs. The server:

1. validates a non-empty, duplicate-free bounded list;
2. verifies team-administrator or global-administrator access;
3. confirms that the submitted IDs exactly match the team's current statuses;
4. assigns temporary positions and then final sequential positions in one database transaction, avoiding the existing `(teamId, position)` unique constraint during swaps;
5. revalidates the workflow administration page and dashboard.

The action rejects partial lists, duplicate IDs, foreign-team IDs, and stale lists without changing the saved order.

## Verification

Contract tests cover validation, authorization/team scoping, transactional two-phase persistence, `dnd-kit` integration, optimistic update, rollback, saving feedback, and the drag handle's accessible name. After focused tests pass, run the complete test suite, typecheck, lint, build, and inspect the rendered workflow page when a live database/session is available.
