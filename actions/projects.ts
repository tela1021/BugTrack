'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProjects() {
    const teams = await prisma.team.findMany({
        include: {
            _count: {
                select: { issues: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return teams.map(t => ({
        id: t.id,
        name: t.name,
        key: t.key,
        issues: t._count.issues,
        created: t.createdAt.toISOString()
    }));
}

export async function createProject(name: string, description?: string) {
    try {
        // Generate a simple key from name (first 3 chars, uppercase)
        // Ensure uniqueness logic would be needed in prod
        let key = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
        if (key.length < 2) key = 'PRJ';

        // Basic check to avoid duplicates (simplified)
        const existing = await prisma.team.findUnique({ where: { key } });
        if (existing) {
            key = key + Math.floor(Math.random() * 10);
        }

        const team = await prisma.team.create({
            data: {
                name,
                description,
                key,
                statuses: {
                    create: [
                        { name: 'Backlog', type: 'BACKLOG', position: 0 },
                        { name: 'Todo', type: 'TODO', position: 1 },
                        { name: 'In Progress', type: 'IN_PROGRESS', position: 2 },
                        { name: 'Done', type: 'DONE', position: 3 },
                        { name: 'Canceled', type: 'CANCELED', position: 4 }
                    ]
                }
            }
        });
        revalidatePath('/admin/projects');
        return { success: true, data: team };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateProject(id: string, data: { name?: string; description?: string }) {
    try {
        await prisma.team.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description
            }
        });
        revalidatePath('/admin/projects');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
