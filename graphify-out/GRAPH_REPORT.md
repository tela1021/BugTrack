# Graph Report - .  (2026-07-21)

## Corpus Check
- Large corpus: 140 files · ~1,681,012 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 328 nodes · 486 edges · 65 communities (52 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]

## God Nodes (most connected - your core abstractions)
1. `requireAuthenticatedUser()` - 20 edges
2. `compilerOptions` - 17 edges
3. `requireTeamRole()` - 15 edges
4. `useToast()` - 13 edges
5. `requireTeamAdminOrGlobal()` - 13 edges
6. `requireIssueAccess()` - 13 edges
7. `scripts` - 13 edges
8. `requireGlobalAdmin()` - 12 edges
9. `IssueListItem` - 8 edges
10. `saveFiles()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `getTeamMembers()` --calls--> `requireTeamRole()`  [EXTRACTED]
  actions/teams.ts → lib/authorization.ts
- `getIssueFormData()` --calls--> `requireAuthenticatedUser()`  [EXTRACTED]
  actions/form-data.ts → lib/authorization.ts
- `getStatuses()` --calls--> `requireAuthenticatedUser()`  [EXTRACTED]
  actions/issue-details.ts → lib/authorization.ts
- `deleteIssue()` --calls--> `requireIssueAccess()`  [EXTRACTED]
  actions/issue-details.ts → lib/authorization.ts
- `restoreIssue()` --calls--> `requireIssueAccess()`  [EXTRACTED]
  actions/issue-details.ts → lib/authorization.ts

## Import Cycles
- None detected.

## Communities (65 total, 13 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (22): getNotifications(), getUnreadCount(), markAsRead(), searchIssues(), PasswordActionState, passwordSchema, updatePassword(), getSidebarData() (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (30): createProject(), getProjectById(), getProjects(), updateProject(), createTeam(), getAdminTeams(), getTeamMembers(), removeTeamMember() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (22): getIssueFormData(), getIssues(), getTeamById(), CreateIssueModal, defaultFilters, Board(), BoardProps, Column (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (28): addComment(), addIssueAttachment(), deleteIssue(), getIssueByReadableId(), getStatuses(), getUsers(), restoreIssue(), saveFiles() (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (30): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, @prisma/client, @types/node, @types/react (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (17): dependencies, @auth/prisma-adapter, bcryptjs, cmdk, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, install (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (8): metadata, AuthProvider(), LayoutContentProps, Toast, ToastApi, ToastContext, ToastKind, ToastProvider()

### Community 8 - "Community 8"
Cohesion: 0.43
Nodes (5): analyzeSqliteDatabase(), getTableCount(), run(), sourceTables, tableExists()

### Community 13 - "Community 13"
Cohesion: 0.50
Nodes (3): JWT, Session, User

## Knowledge Gaps
- **109 isolated node(s):** `passwordSchema`, `TeamSummary`, `ManagedUser`, `TeamOption`, `WorkflowStatus` (+104 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireAuthenticatedUser()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Community 1` to `Community 2`, `Community 3`, `Community 7`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 6` to `Community 4`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `passwordSchema`, `TeamSummary`, `ManagedUser` to the rest of the system?**
  _109 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0696969696969697 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09743589743589744 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11586452762923351 - nodes in this community are weakly interconnected._