'use server';

import prisma from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/authorization';

export async function getSidebarData() {
    const userId = await requireAuthenticatedUser();
    const memberships = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true, team: { select: { id: true, key: true, name: true } } },
        orderBy: { team: { name: 'asc' } },
        take: 10,
    });
    const accessibleTeamIds = memberships.map((membership) => membership.teamId);

    const [inboxCount, notificationCount] = await Promise.all([
        // Inbox = Issues assigned to the current user or unassigned
        prisma.issue.count({
            where: {
                teamId: { in: accessibleTeamIds },
                deletedAt: null,
                OR: [
                    { assigneeId: userId },
                    { assigneeId: null }
                ],
                status: { type: { not: 'DONE' } }
            }
        }),
        prisma.notification.count({
            where: { userId, read: false }
        })
    ]);

    return {
        inboxCount,
        notificationCount,
        projects: memberships.map(({ team }) => ({
            label: team.name,
            key: team.key,
            color: '#3b82f6', // Default blue for now
            id: team.id
        }))
    };
}
