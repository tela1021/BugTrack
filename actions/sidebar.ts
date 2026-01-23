'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function getSidebarData() {
    const session = await auth();
    const userId = session?.user?.id;

    const [inboxCount, teams, notificationCount] = await Promise.all([
        // Inbox = Issues assigned to the current user or unassigned
        userId ? prisma.issue.count({
            where: {
                OR: [
                    { assigneeId: userId },
                    { assigneeId: null }
                ],
                status: { type: { not: 'DONE' } }
            }
        }) : Promise.resolve(0),
        prisma.team.findMany({
            orderBy: { name: 'asc' },
            take: 10
        }),
        userId && (prisma as any).notification ? (prisma as any).notification.count({
            where: { userId, read: false }
        }) : Promise.resolve(0)
    ]);

    return {
        inboxCount,
        notificationCount,
        projects: teams.map((p: any) => ({
            label: p.name,
            key: p.key,
            color: '#3b82f6', // Default blue for now
            id: p.id
        }))
    };
}
