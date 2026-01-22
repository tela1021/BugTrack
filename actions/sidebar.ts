'use server';

import prisma from '@/lib/prisma';

export async function getSidebarData() {
    const [inboxCount, projects] = await Promise.all([
        // Inbox = Issues assigned to the default admin user for now or all unassigned if we want "Inbox" behavior
        // Let's assume Inbox "Assigned to Me" + "Unassigned" for broad visibility
        prisma.issue.count({
            where: {
                OR: [
                    { assignee: { email: 'admin@bugzero.io' } },
                    { assigneeId: null }
                ],
                status: { type: { not: 'DONE' } } // Don't count done issues in inbox
            }
        }),
        prisma.team.findMany({
            orderBy: { name: 'asc' },
            take: 10
        })
    ]);

    return {
        inboxCount,
        projects: projects.map((p: any) => ({
            label: p.name,
            key: p.key,
            color: '#3b82f6', // Default blue for now
            id: p.id
        }))
    };
}
