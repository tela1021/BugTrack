import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  role: z.enum(["ADMIN", "MEMBER"]),
  password: z.string().min(12).max(128),
});

export const createIssueSchema = z.object({
  title: z.string().trim().min(1).max(250),
  description: z.string().trim().max(20_000).optional(),
  priority: z.preprocess(
    (value) => typeof value === "string" ? value.trim().toUpperCase() : value,
    z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"])
  ),
  issueType: z.preprocess(
    (value) => typeof value === "string" ? value.trim().toUpperCase() : value,
    z.enum(["TASK", "BUG", "FEATURE", "IMPROVEMENT"])
  ),
  status: z.string().trim().min(1).max(100),
  teamKey: z.string().trim().min(2).max(20),
  assigneeId: z.string().trim().min(1).max(100).optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().trim().min(1).max(250).optional(),
  description: z.string().trim().max(20_000).nullable().optional(),
  priority: z.preprocess(
    (value) => typeof value === "string" ? value.trim().toUpperCase() : value,
    z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional()
  ),
  issueType: z.preprocess(
    (value) => typeof value === "string" ? value.trim().toUpperCase() : value,
    z.enum(["TASK", "BUG", "FEATURE", "IMPROVEMENT"]).optional()
  ),
  statusId: z.string().trim().min(1).max(100).optional(),
  assigneeId: z.string().trim().min(1).max(100).nullable().optional(),
  projectId: z.string().trim().min(1).max(100).nullable().optional(),
  cycleId: z.string().trim().min(1).max(100).nullable().optional(),
  parentId: z.coerce.number().int().positive().nullable().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be updated.",
});

export const bulkIssueUpdateSchema = z.object({
  issueIds: z.array(z.coerce.number().int().positive()).min(1).max(100),
  statusId: z.string().trim().min(1).max(100).optional(),
  assigneeId: z.string().trim().min(1).max(100).nullable().optional(),
  priority: z.preprocess(
    (value) => typeof value === "string" ? value.trim().toUpperCase() : value,
    z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional()
  ),
  labelIds: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
}).strict().superRefine((data, context) => {
  const actionCount = [
    data.statusId !== undefined,
    data.assigneeId !== undefined,
    data.priority !== undefined,
    data.labelIds !== undefined,
  ].filter(Boolean).length;

  if (actionCount !== 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose exactly one bulk update.' });
  }
});

export const workflowStatusUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  type: z.string().trim().min(1).max(50).optional(),
  wipLimit: z.coerce.number().int().min(1).max(999).nullable().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one workflow field must be updated.',
});

export const createCommentSchema = z.object({
  content: z.string().trim().max(10_000),
}).refine((data) => data.content.length > 0, {
  message: 'Comment content is required when no attachment is provided.',
});

export const projectSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(5_000).optional(),
  teamId: z.string().trim().min(1).max(100),
});

export const teamSchema = z.object({
  name: z.string().trim().min(1).max(100),
  key: z.preprocess(
    (value) => typeof value === 'string' ? value.trim().toUpperCase() : value,
    z.string().regex(/^[A-Z][A-Z0-9]{1,9}$/)
  ),
  description: z.string().trim().max(5_000).optional(),
});

export const teamMemberSchema = z.object({
  userId: z.string().trim().min(1).max(100),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

const cycleStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED']);
export const createCycleSchema = z.object({
  name: z.string().trim().min(1).max(150),
  goal: z.string().trim().max(5_000).nullable().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  status: cycleStatusSchema.default('DRAFT'),
}).refine((data) => data.endsAt > data.startsAt, { message: 'Cycle end must be after its start date.' });

export const updateCycleSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  goal: z.string().trim().max(5_000).nullable().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  status: cycleStatusSchema.optional(),
}).strict().refine((data) => Object.keys(data).length > 0, { message: 'At least one cycle field must be updated.' });
