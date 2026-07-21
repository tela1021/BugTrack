'use server';

import prisma from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/authorization';

export async function getIssueFormData() {
    const userId = await requireAuthenticatedUser();
    const memberships = await prisma.teamMember.findMany({
        where: { userId },
        include: {
            team: {
                include: {
                    statuses: { orderBy: { position: 'asc' } },
                    members: {
                        include: { user: true },
                        orderBy: { user: { name: 'asc' } },
                    },
                },
            },
        },
        orderBy: { team: { name: 'asc' } },
    });

    const teams = memberships.map(({ team }) => ({
            id: team.id,
            key: team.key,
            name: team.name,
            statuses: team.statuses.map((status) => ({
                id: status.id,
                name: status.name,
                type: status.type,
            })),
            members: team.members.map(({ user }) => ({
                id: user.id,
                name: user.name,
                email: user.email,
            })),
        }));
    const usersById = new Map(
        teams.flatMap((team) => team.members).map((member) => [member.id, member])
    );

    return {
        teams,
        users: Array.from(usersById.values()).sort((left, right) =>
            (left.name || left.email).localeCompare(right.name || right.email)
        ),
    };
}
