export type IssueListItem = {
  id: string;
  readableId: string;
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  projectKey: string;
  projectName?: string | null;
  cycleName?: string | null;
  labels: { id: string; name: string; color: string }[];
  number: number;
  status: string;
  priority: string;
  issueType: string;
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
  ageDays?: number;
  updatedAt: string;
};

export type WorkflowStatusOption = { id: string; name: string; position: number; type?: string; wipLimit?: number | null };
export type TeamOption = { id: string; key: string; name: string };
export type UserOption = { id: string; name: string | null; email: string; role?: string };
export type ProjectSummary = {
  id: string; name: string; description: string | null; teamId: string;
  teamName: string; teamKey: string; issues: number; created: string;
};
