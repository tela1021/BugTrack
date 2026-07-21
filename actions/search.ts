'use server';

import prisma from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/authorization';

export async function searchIssues(query: string) {
    const userId = await requireAuthenticatedUser();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return [];

    const memberships = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
    });
    const accessibleTeamIds = memberships.map((membership) => membership.teamId);

    return await prisma.issue.findMany({
        where: {
            teamId: { in: accessibleTeamIds },
            deletedAt: null,
            OR: [
                { title: { contains: normalizedQuery } },
                { readableId: { contains: normalizedQuery } },
                { description: { contains: normalizedQuery } },
            ]
        },
        select: {
            id: true,
            title: true,
            readableId: true,
        },
        take: 8
    });
}
