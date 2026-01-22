'use server';

import prisma from '@/lib/prisma';

export async function searchIssues(query: string) {
    if (!query) return [];

    return await prisma.issue.findMany({
        where: {
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { readableId: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
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
