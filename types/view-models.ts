export type IssueListItem = {
  id: string;
  readableId: string;
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  projectKey: string;
  number: number;
  status: string;
  priority: string;
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
};

export type WorkflowStatusOption = { id: string; name: string; position: number; type?: string };
export type TeamOption = { id: string; key: string; name: string };
export type UserOption = { id: string; name: string | null; email: string; role?: string };
export type ProjectSummary = {
  id: string; name: string; description: string | null; teamId: string;
  teamName: string; teamKey: string; issues: number; created: string;
};
