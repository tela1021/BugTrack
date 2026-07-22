'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuthenticatedUser, requireIssueAccess, requireTeamRole } from '@/lib/authorization';
import { bulkIssueUpdateSchema, createIssueSchema } from '@/lib/validation.mts';
import { deleteAttachmentFile, saveAttachmentFile, validateAttachmentFiles } from '@/lib/attachment-storage';
import type { Prisma } from '@prisma/client';
import type { IssueListItem } from '@/types/view-models';

export type IssueFilters = { status?: string; assignee?: string; sort?: string; team?: string; projectId?: string; search?: string };

const issueListInclude = {
    status: true,
    assignee: true,
    comments: true,
    attachments: true,
    team: true,
    project: true,
    labels: { include: { label: true } },
} satisfies Prisma.IssueInclude;

type IssueWithListData = Prisma.IssueGetPayload<{ include: typeof issueListInclude }>;

function toIssueListItem(issue: IssueWithListData): IssueListItem {
    return {
        id: issue.id.toString(),
        readableId: issue.readableId,
        title: issue.title,
        description: issue.description,
        assigneeId: issue.assigneeId,
        assigneeName: issue.assignee?.name || issue.assignee?.email || null,
        projectKey: issue.team.key,
        projectName: issue.project?.name || null,
        labels: issue.labels.map(({ label }) => ({ id: label.id, name: label.name, color: label.color })),
        number: Number.parseInt(issue.readableId.split('-')[1] || '0', 10),
        status: issue.status.name,
        priority: issue.priority,
        commentCount: issue.comments.length,
        attachmentCount: issue.attachments.length,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
    };
}

async function getIssueWhere(filters?: IssueFilters) {
    const userId = await requireAuthenticatedUser();
    const memberships = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
    });
    const accessibleTeamIds = memberships.map((membership) => membership.teamId);
    const where: Prisma.IssueWhereInput = { teamId: { in: accessibleTeamIds }, deletedAt: null };

    if (filters?.search) {
        where.OR = [
            { title: { contains: filters.search } },
            { readableId: { contains: filters.search } },
            { description: { contains: filters.search } },
        ];
    }

    if (filters?.assignee && filters.assignee !== 'All') {
        if (filters.assignee === 'Unassigned') {
            where.assigneeId = null;
        } else if (filters.assignee === 'Me') {
            where.assigneeId = userId;
        } else {
            // Assume it's a specific user ID
            where.assigneeId = filters.assignee;
        }
    }

    if (filters?.team && filters.team !== 'All') {
        const team = await prisma.team.findUnique({ where: { key: filters.team } });
        if (!team || !accessibleTeamIds.includes(team.id)) {
            where.id = -1;
            return { where };
        }
        where.teamId = team.id;
    }

    if (filters?.status && filters.status !== 'All') {
        // Status names are unique only inside a team. Relation filtering keeps
        // this query correct when several accessible teams use the same name.
        where.status = { is: { name: filters.status } };
    }

    if (filters?.projectId) {
        where.projectId = filters.projectId;
    }

    return { where };
}

function getIssueOrderBy(sort?: string): Prisma.IssueOrderByWithRelationInput[] {
    switch (sort) {
        case 'title_asc': return [{ title: 'asc' }, { id: 'asc' }];
        case 'title_desc': return [{ title: 'desc' }, { id: 'desc' }];
        case 'priority_asc': return [{ priority: 'asc' }, { id: 'asc' }];
        case 'priority_desc': return [{ priority: 'desc' }, { id: 'desc' }];
        case 'updated_asc': return [{ updatedAt: 'asc' }, { id: 'asc' }];
        case 'updated_desc': return [{ updatedAt: 'desc' }, { id: 'desc' }];
        case 'oldest': return [{ createdAt: 'asc' }, { id: 'asc' }];
        default: return [{ createdAt: 'desc' }, { id: 'desc' }];
    }
}

export async function getIssues(filters?: IssueFilters) {
    const { where } = await getIssueWhere(filters);
    const issues = await prisma.issue.findMany({
        where,
        orderBy: getIssueOrderBy(filters?.sort),
        include: issueListInclude,
    });

    return issues.map(toIssueListItem);
}

export async function getIssuesPage(filters?: IssueFilters, cursor?: string | null, pageSize = 25) {
    const { where } = await getIssueWhere(filters);
    const limit = Math.min(Math.max(pageSize, 1), 100);
    const cursorId = cursor ? Number.parseInt(cursor, 10) : null;
    if (cursor && (cursorId === null || !Number.isSafeInteger(cursorId) || cursorId < 1)) {
        return { issues: [], nextCursor: null };
    }

    const rows = await prisma.issue.findMany({
        where,
        orderBy: getIssueOrderBy(filters?.sort),
        include: issueListInclude,
        cursor: cursorId !== null ? { id: cursorId } : undefined,
        skip: cursorId !== null ? 1 : 0,
        take: limit + 1,
    });
    const hasNextPage = rows.length > limit;
    const pageRows = hasNextPage ? rows.slice(0, limit) : rows;

    return {
        issues: pageRows.map(toIssueListItem),
        nextCursor: hasNextPage ? pageRows[pageRows.length - 1]?.id.toString() || null : null,
    };
}

export async function bulkUpdateIssues(data: unknown) {
    try {
        const input = bulkIssueUpdateSchema.parse(data);
        const issueIds = [...new Set(input.issueIds)];
        const issues = await prisma.issue.findMany({
            where: { id: { in: issueIds }, deletedAt: null },
            include: {
                status: true,
                assignee: true,
                labels: { include: { label: true } },
            },
        });

        if (issues.length !== issueIds.length) throw new Error('Некоторые задачи не найдены или недоступны');
        const access = await Promise.all(issues.map((issue) => requireIssueAccess(issue.id, 'MEMBER')));
        if (new Set(issues.map((issue) => issue.teamId)).size !== 1) {
            throw new Error('Массовое изменение возможно только для задач одной команды');
        }

        const teamId = issues[0].teamId;
        const userId = access[0].userId;
        const nextStatus = input.statusId
            ? await prisma.workflowStatus.findFirst({ where: { id: input.statusId, teamId } })
            : null;
        if (input.statusId && !nextStatus) throw new Error('Статус должен принадлежать команде задач');

        const nextAssignee = input.assigneeId
            ? await prisma.user.findFirst({
                where: { id: input.assigneeId, teams: { some: { teamId } } },
                select: { id: true, name: true, email: true },
            })
            : null;
        if (input.assigneeId && !nextAssignee) throw new Error('Исполнитель должен быть участником команды задач');

        const nextLabelIds = input.labelIds ? [...new Set(input.labelIds)] : undefined;
        const nextLabels = nextLabelIds
            ? await prisma.label.findMany({ where: { id: { in: nextLabelIds }, teamId }, orderBy: { name: 'asc' } })
            : [];
        if (nextLabelIds && nextLabels.length !== nextLabelIds.length) throw new Error('Все метки должны принадлежать команде задач');

        let updatedCount = 0;
        await prisma.$transaction(async (transaction) => {
            for (const issue of issues) {
                const update: Prisma.IssueUncheckedUpdateInput = {};
                const historyEntries: Prisma.IssueHistoryCreateManyInput[] = [];
                const notifications: Prisma.NotificationCreateManyInput[] = [];

                if (input.statusId && input.statusId !== issue.statusId && nextStatus) {
                    update.statusId = input.statusId;
                    historyEntries.push({ issueId: issue.id, actorId: userId, field: 'status', oldValue: issue.status.name, newValue: nextStatus.name });
                    for (const recipientId of new Set([issue.assigneeId, issue.reporterId])) {
                        if (recipientId && recipientId !== userId) notifications.push({ userId: recipientId, actorId: userId, issueId: issue.id, type: 'STATUS_CHANGE' });
                    }
                }
                if (input.priority && input.priority !== issue.priority) {
                    update.priority = input.priority;
                    historyEntries.push({ issueId: issue.id, actorId: userId, field: 'priority', oldValue: issue.priority, newValue: input.priority });
                }
                if (input.assigneeId !== undefined && input.assigneeId !== issue.assigneeId) {
                    update.assigneeId = input.assigneeId;
                    historyEntries.push({
                        issueId: issue.id,
                        actorId: userId,
                        field: 'assignee',
                        oldValue: issue.assignee?.name || issue.assignee?.email || 'Не назначен',
                        newValue: nextAssignee?.name || nextAssignee?.email || 'Не назначен',
                    });
                    if (input.assigneeId && input.assigneeId !== userId) {
                        notifications.push({ userId: input.assigneeId, actorId: userId, issueId: issue.id, type: 'ASSIGNED' });
                    }
                }
                if (nextLabelIds) {
                    const oldLabelIds = issue.labels.map(({ labelId }) => labelId).sort();
                    const labelsChanged = oldLabelIds.length !== nextLabelIds.length || oldLabelIds.some((labelId, index) => labelId !== [...nextLabelIds].sort()[index]);
                    if (labelsChanged) {
                        await transaction.labelOnIssue.deleteMany({ where: { issueId: issue.id } });
                        if (nextLabelIds.length > 0) {
                            await transaction.labelOnIssue.createMany({ data: nextLabelIds.map((labelId) => ({ issueId: issue.id, labelId })) });
                        }
                        historyEntries.push({
                            issueId: issue.id,
                            actorId: userId,
                            field: 'labels',
                            oldValue: issue.labels.map(({ label }) => label.name).sort().join(', ') || '—',
                            newValue: nextLabels.map((label) => label.name).join(', ') || '—',
                        });
                    }
                }
                if (Object.keys(update).length > 0) await transaction.issue.update({ where: { id: issue.id }, data: update });
                if (historyEntries.length > 0) {
                    updatedCount += 1;
                    await transaction.issueHistory.createMany({ data: historyEntries });
                }
                if (notifications.length > 0) await transaction.notification.createMany({ data: notifications });
            }
        });

        revalidatePath('/');
        for (const issue of issues) revalidatePath(`/issues/${issue.readableId}`);
        return { success: true, updatedCount };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Не удалось массово изменить задачи' };
    }
}

export async function createIssue(formData: FormData) {
    try {
        const input = createIssueSchema.parse({
            title: formData.get('title'),
            description: formData.get('description') || undefined,
            priority: formData.get('priority'),
            status: formData.get('status'),
            teamKey: formData.get('teamKey'),
            assigneeId: formData.get('assigneeId') || undefined,
        });
        const files = formData.getAll('files').filter((value): value is File => value instanceof File);

        const team = await prisma.team.findUnique({ where: { key: input.teamKey } });
        if (!team) throw new Error('Project not found');

        const { userId } = await requireTeamRole(team.id, "MEMBER");

        const status = await prisma.workflowStatus.findUnique({
            where: { teamId_name: { teamId: team.id, name: input.status } }
        });

        if (!status) throw new Error(`Invalid status '${input.status}'`);

        if (input.assigneeId) {
            const membership = await prisma.teamMember.findUnique({
                where: { userId_teamId: { userId: input.assigneeId, teamId: team.id } },
                select: { userId: true },
            });
            if (!membership) throw new Error('Assignee must be a member of the selected team');
        }

        const issue = await prisma.$transaction(async (transaction) => {
            const sequence = await transaction.team.update({
                where: { id: team.id },
                data: { issueSequence: { increment: 1 } },
                select: { issueSequence: true },
            });

            const readableId = `${team.key}-${sequence.issueSequence}`;
            return transaction.issue.create({
                data: {
                    title: input.title,
                    description: input.description,
                    priority: input.priority,
                    readableId,
                    statusId: status.id,
                    teamId: team.id,
                    reporterId: userId,
                    assigneeId: input.assigneeId || null
                }
            });
        });

        await prisma.issueHistory.create({
            data: { issueId: issue.id, actorId: userId, field: 'created', newValue: issue.readableId },
        });

        if (files && files.length > 0) {
            validateAttachmentFiles(files);
            for (const file of files) {
                const attachment = await prisma.attachment.create({
                    data: {
                        issueId: issue.id,
                        name: file.name,
                        url: '',
                        mimeType: file.type,
                        size: file.size,
                    }
                });
                try {
                    const stored = await saveAttachmentFile(attachment.id, file);
                    await prisma.attachment.update({
                        where: { id: attachment.id },
                        data: { url: `/api/attachments/${attachment.id}`, checksum: stored.checksum, size: stored.size },
                    });
                } catch (error) {
                    await Promise.allSettled([
                        deleteAttachmentFile(attachment.id),
                        prisma.attachment.delete({ where: { id: attachment.id } }),
                    ]);
                    throw error;
                }
            }
        }

        revalidatePath('/');
        return { success: true, data: issue };

    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to create issue' };
    }
}
