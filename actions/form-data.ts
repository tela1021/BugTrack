'use server';

import prisma from '@/lib/prisma';

export async function getIssueFormData() {
    const [users, teams] = await Promise.all([
        prisma.user.findMany({ orderBy: { name: 'asc' } }),
        prisma.team.findMany({ orderBy: { name: 'asc' } })
    ]);

    return { users, teams };
}
