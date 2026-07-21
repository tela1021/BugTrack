import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('P1 uses accessible non-blocking toasts instead of browser alerts', async () => {
  const [provider, layout, issueModal, issuePage, projectsPage, usersPage, workflowPage] = await Promise.all([
    readFile('components/ToastProvider.tsx', 'utf8'),
    readFile('app/layout.tsx', 'utf8'),
    readFile('components/CreateIssueModal.tsx', 'utf8'),
    readFile('app/issues/[readableId]/page.tsx', 'utf8'),
    readFile('app/admin/projects/page.tsx', 'utf8'),
    readFile('app/admin/users/page.tsx', 'utf8'),
    readFile('app/admin/workflow/page.tsx', 'utf8'),
  ]);

  assert.match(provider, /aria-live="polite"/);
  assert.match(provider, /export function useToast/);
  assert.match(layout, /ToastProvider/);
  assert.doesNotMatch(issueModal, /alert\(/);
  assert.doesNotMatch(issuePage, /alert\(/);
  assert.doesNotMatch(projectsPage, /alert\(/);
  assert.doesNotMatch(usersPage, /alert\(/);
  assert.doesNotMatch(workflowPage, /alert\(/);
});
