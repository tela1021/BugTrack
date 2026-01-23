'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth';

export async function getIssues(filters?: { status?: string; assignee?: string; sort?: string; team?: string; search?: string }) {
    const where: any = {};

    if (filters?.search) {
        where.OR = [
            { title: { contains: filters.search } },
            { readableId: { contains: filters.search } },
            { description: { contains: filters.search } },
        ];
    }

    if (filters?.status && filters.status !== 'All') {
        const status = await prisma.workflowStatus.findFirst({
            where: { name: filters.status }
        });
        if (status) {
            where.statusId = status.id;
        }
    }

    if (filters?.assignee && filters.assignee !== 'All') {
        if (filters.assignee === 'Unassigned') {
            where.assigneeId = null;
        } else if (filters.assignee === 'Me') {
            const session = await auth();
            if (session?.user?.id) where.assigneeId = session.user.id;
        } else {
            // Assume it's a specific user ID
            where.assigneeId = filters.assignee;
        }
    }

    if (filters?.team && filters.team !== 'All') {
        const team = await prisma.team.findUnique({ where: { key: filters.team } });
        if (team) {
            where.teamId = team.id;
        }
    }

    const orderBy: any = {};
    if (filters?.sort === 'oldest') {
        orderBy.createdAt = 'asc';
    } else {
        orderBy.createdAt = 'desc';
    }

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
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const priority = formData.get('priority') as string;
        const statusName = formData.get('status') as string;
        const teamKey = formData.get('teamKey') as string;
        const assigneeId = formData.get('assigneeId') as string;
        const files = formData.getAll('files') as File[];

        // 1. Get team
        const team = await prisma.team.findUnique({ where: { key: teamKey } });
        if (!team) throw new Error('Project not found');

        const session = await auth();
        if (!session?.user?.id) throw new Error('Not authenticated');

        // 2. Get status ID (with self-healing)
        let status = await prisma.workflowStatus.findFirst({
            where: { name: statusName, teamId: team.id }
        });

        if (!status) {
            const statusCount = await prisma.workflowStatus.count({ where: { teamId: team.id } });
            if (statusCount === 0) {
                await prisma.workflowStatus.createMany({
                    data: [
                        { name: 'Backlog', type: 'BACKLOG', position: 0, teamId: team.id },
                        { name: 'Todo', type: 'TODO', position: 1, teamId: team.id },
                        { name: 'In Progress', type: 'IN_PROGRESS', position: 2, teamId: team.id },
                        { name: 'Done', type: 'DONE', position: 3, teamId: team.id },
                        { name: 'Canceled', type: 'CANCELED', position: 4, teamId: team.id }
                    ]
                });
                status = await prisma.workflowStatus.findFirst({
                    where: { name: statusName, teamId: team.id }
                });
            }
        }

        if (!status) throw new Error(`Invalid status '${statusName}'`);

        // 3. Readable ID
        const count = await prisma.issue.count({ where: { teamId: team.id } });
        const readableId = `${team.key}-${count + 1}`;

        // 4. Create Issue
        const issue = await prisma.issue.create({
            data: {
                title,
                description,
                priority: priority.toUpperCase() as any,
                readableId,
                statusId: status.id,
                teamId: team.id,
                reporterId: session.user.id,
                assigneeId: assigneeId || null
            }
        });

        // 5. Handle File Uploads
        if (files && files.length > 0) {
            const uploadDir = join(process.cwd(), 'public', 'uploads');
            await mkdir(uploadDir, { recursive: true });

            for (const file of files) {
                if (file.size > 0) {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
                    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const fileName = `${uniqueSuffix}-${cleanName}`;

                    await writeFile(join(uploadDir, fileName), buffer);

                    await prisma.attachment.create({
                        data: {
                            issueId: issue.id,
                            name: file.name,
                            url: `/uploads/${fileName}`,
                            mimeType: file.type,
                            size: file.size
                        }
                    });
                }
            }
        }

        revalidatePath('/');
        return { success: true, data: issue };

    } catch (error: any) {
        console.error('Create Issue Error:', error);
        return { success: false, error: error.message };
    }
}
