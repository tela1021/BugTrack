'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createNotification } from './notifications';
import { auth } from '@/lib/auth';

async function saveFiles(issueId: number, files: File[], commentId?: string) {
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const savedAttachments = [];

    for (const file of files) {
        if (file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${uniqueSuffix}-${cleanName}`;

            await writeFile(join(uploadDir, fileName), buffer);

            const attachment = await prisma.attachment.create({
                data: {
                    issueId,
                    commentId: commentId || null,
                    name: file.name,
                    url: `/uploads/${fileName}`,
                    mimeType: file.type,
                    size: file.size
                }
            });
            savedAttachments.push(attachment);
        }
    }
    return savedAttachments;
}

export async function addComment(issueId: number, formData: FormData) {
    try {
        const content = formData.get('content') as string;
        const files = formData.getAll('files') as File[];

        const session = await auth();
        if (!session?.user?.id) throw new Error('Not authenticated');

        const comment = await prisma.comment.create({
            data: {
                content,
                issueId,
                authorId: session.user.id
            }
        });

        if (files.length > 0) {
            await saveFiles(issueId, files, comment.id);
        }

        // Notify issue assignee and reporter
        const issueData = await prisma.issue.findUnique({
            where: { id: issueId },
            select: { assigneeId: true, reporterId: true }
        });

        if (issueData) {
            const recipients = new Set([issueData.assigneeId, issueData.reporterId].filter(id => id && id !== session.user?.id)) as Set<string>;
            for (const userId of recipients) {
                await createNotification({
                    userId,
                    actorId: session.user.id,
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
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getUsers() {
    return await prisma.user.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function getStatuses(teamKey?: string) {
    // Ignore teamKey to provide "One set of statuses for all projects"
    const statuses = await prisma.workflowStatus.findMany({
        orderBy: { position: 'asc' }
    });

    // Deduplicate by name (case-insensitive for safety)
    const uniqueMap = new Map();
    const uniqueStatuses = [];

    for (const status of statuses) {
        const normalizedName = status.name.trim();
        if (!uniqueMap.has(normalizedName.toLowerCase())) {
            uniqueMap.set(normalizedName.toLowerCase(), true);
            uniqueStatuses.push(status);
        }
    }

    return uniqueStatuses;
}

export async function getIssueByReadableId(readableId: string) {
    return await prisma.issue.findUnique({
        where: { readableId },
        include: {
            status: true,
            assignee: true,
            reporter: true,
            comments: {
                include: {
                    author: true,
                    attachments: true
                },
                orderBy: { createdAt: 'desc' }
            },
            attachments: true,
            history: {
                include: { actor: true },
                orderBy: { createdAt: 'desc' }
            },
            labels: {
                include: { label: true }
            }
        }
    });
}

export async function updateIssue(id: number, data: any) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error('Not authenticated');

        const oldIssue = await prisma.issue.findUnique({ where: { id } });
        if (!oldIssue) throw new Error('Issue not found');

        const updatedIssue = await prisma.issue.update({
            where: { id },
            data
        });

        // Track history for changed fields
        const historyEntries = [];
        if (data.statusId && data.statusId !== oldIssue.statusId) {
            // Fetch status names for history
            const oldStatus = await prisma.workflowStatus.findUnique({ where: { id: oldIssue.statusId } });
            const newStatus = await prisma.workflowStatus.findUnique({ where: { id: data.statusId } });

            historyEntries.push({
                issueId: id,
                actorId: session.user.id,
                field: 'status',
                oldValue: oldStatus?.name || 'Unknown',
                newValue: newStatus?.name || 'Unknown'
            });
        }

        if (data.assigneeId && data.assigneeId !== oldIssue.assigneeId) {
            // Fetch user names for history
            const oldUser = oldIssue.assigneeId ? await prisma.user.findUnique({ where: { id: oldIssue.assigneeId } }) : null;
            const newUser = await prisma.user.findUnique({ where: { id: data.assigneeId } });

            historyEntries.push({
                issueId: id,
                actorId: session.user.id,
                field: 'assignee',
                oldValue: oldUser?.name || 'Unassigned',
                newValue: newUser?.name || 'Unassigned'
            });

            if (data.assigneeId) {
                await createNotification({
                    userId: data.assigneeId,
                    actorId: session.user.id,
                    issueId: id,
                    type: 'ASSIGNED'
                });
            }
        }

        // Notify status change
        if (data.statusId && data.statusId !== oldIssue.statusId) {
            const recipients = new Set([oldIssue.assigneeId, oldIssue.reporterId].filter(uid => uid && uid !== session.user?.id)) as Set<string>;
            for (const userId of recipients) {
                await createNotification({
                    userId,
                    actorId: session.user.id,
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
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addIssueAttachment(issueId: number, formData: FormData) {
    try {
        const files = formData.getAll('files') as File[];
        if (!files || files.length === 0) throw new Error('No files provided');

        const savedAttachments = await saveFiles(issueId, files);

        revalidatePath('/');
        // We need to fetch the issue to get the readableId for revalidation
        const issue = await prisma.issue.findUnique({ where: { id: issueId } });
        if (issue) revalidatePath(`/issues/${issue.readableId}`);

        return { success: true, data: savedAttachments };
    } catch (error: any) {
        console.error('Upload Error:', error);
        return { success: false, error: error.message };
    }
}

