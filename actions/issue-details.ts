'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';
import { requireAuthenticatedUser, requireIssueAccess, requireTeamRole } from '@/lib/authorization';
import { createCommentSchema, updateIssueSchema } from '@/lib/validation.mts';
import { deleteAttachmentFile, saveAttachmentFile, validateAttachmentFiles } from '@/lib/attachment-storage';

function hasBugTemplate(description: string | null | undefined) {
    const value = description || '';
    return /(?:^|\n)#{1,3}\s*(?:шаги воспроизведения|steps to reproduce)/im.test(value)
        && /(?:^|\n)#{1,3}\s*(?:ожидаемый результат|expected result)/im.test(value)
        && /(?:^|\n)#{1,3}\s*(?:фактический результат|actual result)/im.test(value);
}

async function saveFiles(issueId: number, files: File[], commentId?: string) {
    validateAttachmentFiles(files);
    const savedAttachments = [];

    for (const file of files) {
        const attachment = await prisma.attachment.create({
            data: {
                issueId,
                commentId: commentId || null,
                name: file.name,
                url: '',
                mimeType: file.type,
                size: file.size,
            }
        });

        try {
            const stored = await saveAttachmentFile(attachment.id, file);
            const updatedAttachment = await prisma.attachment.update({
                where: { id: attachment.id },
                data: {
                    url: `/api/attachments/${attachment.id}`,
                    checksum: stored.checksum,
                    size: stored.size,
                },
            });
            savedAttachments.push(updatedAttachment);
        } catch (error) {
            await Promise.allSettled([
                deleteAttachmentFile(attachment.id),
                prisma.attachment.delete({ where: { id: attachment.id } }),
            ]);
            throw error;
        }
    }
    return savedAttachments;
}

export async function addComment(issueId: number, formData: FormData) {
    try {
        const content = typeof formData.get('content') === 'string' ? String(formData.get('content')) : '';
        const files = formData.getAll('files').filter((value): value is File => value instanceof File);
        if (content.trim()) createCommentSchema.parse({ content });
        else if (files.length === 0) createCommentSchema.parse({ content });
        if (files.length > 0) validateAttachmentFiles(files);

        const { userId } = await requireIssueAccess(issueId, "MEMBER");

        const comment = await prisma.comment.create({
            data: {
                content,
                issueId,
                authorId: userId
            }
        });

        const attachments = files.length > 0 ? await saveFiles(issueId, files, comment.id) : [];

        await prisma.issueHistory.create({
            data: { issueId, actorId: userId, field: 'comment', newValue: comment.id },
        });
        if (attachments.length > 0) {
            await prisma.issueHistory.createMany({
                data: attachments.map((attachment) => ({ issueId, actorId: userId, field: 'attachment', newValue: attachment.name })),
            });
        }

        // Notify issue assignee and reporter
        const issueData = await prisma.issue.findUnique({
            where: { id: issueId },
            select: { assigneeId: true, reporterId: true }
        });

        if (issueData) {
            const recipients = new Set([issueData.assigneeId, issueData.reporterId].filter(id => id && id !== userId)) as Set<string>;
            for (const recipientId of recipients) {
                await createNotification({
                    userId: recipientId,
                    actorId: userId,
                    issueId,
                    commentId: comment.id,
                    type: 'COMMENT'
                });
            }
        }

        revalidatePath(`/issues/${issueId}`);
        // Also fetch the readableId for revalidation
        const issue = await prisma.issue.findUnique({ where: { id: issueId } });
        if (issue) revalidatePath(`/issues/${issue.readableId}`);

        return { success: true, data: comment };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to add comment' };
    }
}

export async function getUsers(teamKey: string) {
    const team = await prisma.team.findUnique({ where: { key: teamKey } });
    if (!team) return [];

    await requireTeamRole(team.id, "MEMBER");
    const members = await prisma.teamMember.findMany({
        where: { teamId: team.id },
        include: { user: true },
        orderBy: { user: { name: 'asc' } },
    });

    return members.map(({ user }) => user);
}

export async function getStatuses(teamKey?: string) {
    const userId = await requireAuthenticatedUser();
    const memberships = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
    });
    const accessibleTeamIds = memberships.map((membership) => membership.teamId);
    let where = { teamId: { in: accessibleTeamIds } };

    if (teamKey && teamKey !== 'All') {
        const team = await prisma.team.findUnique({ where: { key: teamKey } });
        if (!team) return [];
        await requireTeamRole(team.id, "MEMBER");
        where = { teamId: { in: [team.id] } };
    }

    return prisma.workflowStatus.findMany({
        where,
        orderBy: { position: 'asc' }
    });
}

export async function getIssueByReadableId(readableId: string) {
    const issue = await prisma.issue.findFirst({
        where: { readableId, deletedAt: null },
        include: {
            team: true,
            status: true,
            assignee: true,
            reporter: true,
            parent: { select: { id: true, readableId: true, title: true } },
            children: {
                where: { deletedAt: null },
                select: { id: true, readableId: true, title: true, status: { select: { name: true, type: true } } },
                orderBy: { createdAt: 'asc' },
            },
            comments: {
                include: {
                    author: true,
                    attachments: true
                },
                orderBy: { createdAt: 'asc' }
            },
            attachments: true,
            history: {
                include: { actor: true },
                orderBy: { createdAt: 'asc' }
            },
            labels: {
                include: { label: true }
            },
            outgoingLinks: { include: { target: { select: { readableId: true, title: true } } } },
            incomingLinks: { include: { source: { select: { readableId: true, title: true } } } },
        }
    });

    if (issue) {
        await requireIssueAccess(issue.id, "MEMBER");
    }

    return issue;
}

export async function updateIssue(id: number, data: unknown) {
    try {
        const { userId } = await requireIssueAccess(id, "MEMBER");
        const input = updateIssueSchema.parse(data);

        const oldIssue = await prisma.issue.findUnique({ where: { id } });
        if (!oldIssue) throw new Error('Issue not found');

        if (input.statusId) {
            const status = await prisma.workflowStatus.findFirst({
                where: { id: input.statusId, teamId: oldIssue.teamId }
            });
            if (!status) throw new Error('Status must belong to the issue team');
        }

        if (input.assigneeId) {
            const membership = await prisma.teamMember.findUnique({
                where: { userId_teamId: { userId: input.assigneeId, teamId: oldIssue.teamId } },
                select: { userId: true },
            });
            if (!membership) throw new Error('Assignee must be a member of the issue team');
        }

        if (input.projectId) {
            const project = await prisma.project.findFirst({
                where: { id: input.projectId, teamId: oldIssue.teamId },
            });
            if (!project) throw new Error('Project must belong to the issue team');
        }

        if (input.cycleId) {
            const cycle = await prisma.cycle.findFirst({
                where: { id: input.cycleId, teamId: oldIssue.teamId },
            });
            if (!cycle) throw new Error('Cycle must belong to the issue team');
        }

        if (input.parentId !== undefined) {
            if (input.parentId === id) throw new Error('An issue cannot be its own parent');
            if (input.parentId) {
                const parent = await prisma.issue.findFirst({
                    where: { id: input.parentId, teamId: oldIssue.teamId, deletedAt: null },
                    select: { id: true },
                });
                if (!parent) throw new Error('Parent issue must belong to the issue team');
            }
        }

        const nextStatus = await prisma.workflowStatus.findUnique({ where: { id: input.statusId || oldIssue.statusId } });
        const nextIssueType = input.issueType || oldIssue.issueType;
        const nextDescription = input.description !== undefined ? input.description : oldIssue.description;
        if (nextIssueType === 'BUG' && nextStatus?.type.toUpperCase() === 'TODO' && !hasBugTemplate(nextDescription)) {
            throw new Error('Bug template must include steps, expected result and actual result before Todo.');
        }

        const updatedIssue = await prisma.issue.update({
            where: { id },
            data: input
        });

        // Track every changed user-visible field. The records are immutable and
        // deliberately use display values, so they remain understandable after a
        // status, project or user is renamed.
        const historyEntries = [];
        if (input.title !== undefined && input.title !== oldIssue.title) {
            historyEntries.push({ issueId: id, actorId: userId, field: 'title', oldValue: oldIssue.title, newValue: input.title });
        }
        if (input.description !== undefined && input.description !== oldIssue.description) {
            historyEntries.push({ issueId: id, actorId: userId, field: 'description', oldValue: oldIssue.description, newValue: input.description });
        }
        if (input.priority !== undefined && input.priority !== oldIssue.priority) {
            historyEntries.push({ issueId: id, actorId: userId, field: 'priority', oldValue: oldIssue.priority, newValue: input.priority });
        }
        if (input.issueType !== undefined && input.issueType !== oldIssue.issueType) {
            historyEntries.push({ issueId: id, actorId: userId, field: 'type', oldValue: oldIssue.issueType, newValue: input.issueType });
        }
        if (input.statusId !== undefined && input.statusId !== oldIssue.statusId) {
            // Fetch status names for history
            const oldStatus = await prisma.workflowStatus.findUnique({ where: { id: oldIssue.statusId } });
            const newStatus = await prisma.workflowStatus.findUnique({ where: { id: input.statusId } });

            historyEntries.push({
                issueId: id,
                actorId: userId,
                field: 'status',
                oldValue: oldStatus?.name || 'Unknown',
                newValue: newStatus?.name || 'Unknown'
            });
        }

        if (input.assigneeId !== undefined && input.assigneeId !== oldIssue.assigneeId) {
            // Fetch user names for history
            const oldUser = oldIssue.assigneeId ? await prisma.user.findUnique({ where: { id: oldIssue.assigneeId } }) : null;
            const newUser = input.assigneeId ? await prisma.user.findUnique({ where: { id: input.assigneeId } }) : null;

            historyEntries.push({
                issueId: id,
                actorId: userId,
                field: 'assignee',
                oldValue: oldUser?.name || 'Unassigned',
                newValue: newUser?.name || 'Unassigned'
            });

            if (input.assigneeId) {
                await createNotification({
                    userId: input.assigneeId,
                    actorId: userId,
                    issueId: id,
                    type: 'ASSIGNED'
                });
            }
        }

        if (input.projectId !== undefined && input.projectId !== oldIssue.projectId) {
            const [oldProject, newProject] = await Promise.all([
                oldIssue.projectId ? prisma.project.findUnique({ where: { id: oldIssue.projectId }, select: { name: true } }) : null,
                input.projectId ? prisma.project.findUnique({ where: { id: input.projectId }, select: { name: true } }) : null,
            ]);
            historyEntries.push({ issueId: id, actorId: userId, field: 'project', oldValue: oldProject?.name || 'None', newValue: newProject?.name || 'None' });
        }

        if (input.cycleId !== undefined && input.cycleId !== oldIssue.cycleId) {
            const [oldCycle, newCycle] = await Promise.all([
                oldIssue.cycleId ? prisma.cycle.findUnique({ where: { id: oldIssue.cycleId }, select: { name: true } }) : null,
                input.cycleId ? prisma.cycle.findUnique({ where: { id: input.cycleId }, select: { name: true } }) : null,
            ]);
            historyEntries.push({ issueId: id, actorId: userId, field: 'cycle', oldValue: oldCycle?.name || 'None', newValue: newCycle?.name || 'None' });
        }

        if (input.parentId !== undefined && input.parentId !== oldIssue.parentId) {
            const [oldParent, newParent] = await Promise.all([
                oldIssue.parentId ? prisma.issue.findUnique({ where: { id: oldIssue.parentId }, select: { readableId: true } }) : null,
                input.parentId ? prisma.issue.findUnique({ where: { id: input.parentId }, select: { readableId: true } }) : null,
            ]);
            historyEntries.push({ issueId: id, actorId: userId, field: 'parent', oldValue: oldParent?.readableId || 'None', newValue: newParent?.readableId || 'None' });
        }

        // Notify status change
        if (input.statusId !== undefined && input.statusId !== oldIssue.statusId) {
            const recipients = new Set([oldIssue.assigneeId, oldIssue.reporterId].filter(uid => uid && uid !== userId)) as Set<string>;
            for (const recipientId of recipients) {
                await createNotification({
                    userId: recipientId,
                    actorId: userId,
                    issueId: id,
                    type: 'STATUS_CHANGE'
                });
            }
        }

        if (historyEntries.length > 0) {
            await prisma.issueHistory.createMany({
                data: historyEntries
            });
        }

        revalidatePath('/');
        revalidatePath(`/issues/${updatedIssue.readableId}`);
        return { success: true, data: updatedIssue };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to update issue' };
    }
}

export async function deleteIssue(issueId: number) {
    try {
        const { userId } = await requireIssueAccess(issueId, 'ADMIN');
        const issue = await prisma.issue.update({
            where: { id: issueId },
            data: { deletedAt: new Date(), deletedById: userId },
        });
        await prisma.issueHistory.create({ data: { issueId, actorId: userId, field: 'deleted', oldValue: 'active', newValue: 'deleted' } });
        revalidatePath('/');
        return { success: true, data: issue };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to delete issue' };
    }
}

export async function restoreIssue(issueId: number) {
    try {
        const { userId } = await requireIssueAccess(issueId, 'ADMIN');
        const issue = await prisma.issue.findUnique({ where: { id: issueId } });
        if (!issue?.deletedAt) throw new Error('Issue is not deleted');
        const restoreDeadline = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (issue.deletedAt < restoreDeadline) throw new Error('Issue can only be restored within 30 days');

        const restored = await prisma.issue.update({
            where: { id: issueId },
            data: { deletedAt: null, deletedById: null },
        });
        await prisma.issueHistory.create({ data: { issueId, actorId: userId, field: 'deleted', oldValue: 'deleted', newValue: 'active' } });
        revalidatePath('/');
        return { success: true, data: restored };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to restore issue' };
    }
}

export async function addIssueAttachment(issueId: number, formData: FormData) {
    try {
        const files = formData.getAll('files').filter((value): value is File => value instanceof File);
        if (!files || files.length === 0) throw new Error('No files provided');

        const { userId } = await requireIssueAccess(issueId, "MEMBER");
        const savedAttachments = await saveFiles(issueId, files);
        await prisma.issueHistory.createMany({
            data: savedAttachments.map((attachment) => ({ issueId, actorId: userId, field: 'attachment', newValue: attachment.name })),
        });

        revalidatePath('/');
        // We need to fetch the issue to get the readableId for revalidation
        const issue = await prisma.issue.findUnique({ where: { id: issueId } });
        if (issue) revalidatePath(`/issues/${issue.readableId}`);

        return { success: true, data: savedAttachments };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to upload attachment' };
    }
}
