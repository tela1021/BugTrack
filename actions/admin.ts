'use server';

import prisma from '@/lib/prisma';

export async function getSystemStats() {
    try {
        const [userCount, teamCount, projectCount] = await Promise.all([
            prisma.user.count(),
            prisma.team.count(),
            prisma.project.count(),
        ]);

        return {
            users: userCount,
            teams: teamCount,
            projects: projectCount,
        };
    } catch (error) {
        console.error('Failed to fetch system stats:', error);
        return {
            users: 0,
            teams: 0,
            projects: 0,
        };
    }
}
