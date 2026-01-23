'use server';

import prisma from '@/lib/prisma';

export async function searchIssues(query: string) {
    if (!query) return [];

    return await prisma.issue.findMany({
        where: {
            OR: [
                { title: { contains: query } },
                { readableId: { contains: query } },
                { description: { contains: query } },
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
