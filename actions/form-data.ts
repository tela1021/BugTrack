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
                    labels: { orderBy: { name: 'asc' } },
                    projects: { orderBy: { name: 'asc' } },
                    cycles: { orderBy: { startsAt: 'desc' } },
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
            labels: team.labels.map((label) => ({
                id: label.id,
                name: label.name,
                color: label.color,
            })),
            projects: team.projects.map((project) => ({
                id: project.id,
                name: project.name,
            })),
            cycles: team.cycles.map((cycle) => ({
                id: cycle.id,
                name: cycle.name,
                startsAt: cycle.startsAt.toISOString(),
                endsAt: cycle.endsAt.toISOString(),
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
