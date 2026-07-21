'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuthenticatedUser, requireTeamRole } from '@/lib/authorization';
import { createIssueSchema } from '@/lib/validation.mts';
import { deleteAttachmentFile, saveAttachmentFile, validateAttachmentFiles } from '@/lib/attachment-storage';
import type { Prisma } from '@prisma/client';

export async function getIssues(filters?: { status?: string; assignee?: string; sort?: string; team?: string; projectId?: string; search?: string }) {
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
            return [];
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

    const orderBy: Prisma.IssueOrderByWithRelationInput = {
        createdAt: filters?.sort === 'oldest' ? 'asc' : 'desc',
    };

    const issues = await prisma.issue.findMany({
        where,
        orderBy,
        include: {
            status: true,
            assignee: true,
            comments: true,
            attachments: true,
        }
    });

    return issues.map(issue => ({
        id: issue.id.toString(),
        readableId: issue.readableId,
        title: issue.title,
        projectKey: issue.readableId.split('-')[0],
        number: parseInt(issue.readableId.split('-')[1]),
        status: issue.status.name,
        priority: issue.priority,
        commentCount: issue.comments.length,
        attachmentCount: issue.attachments.length,
        createdAt: issue.createdAt.toISOString()
    }));
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
