'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireGlobalAdmin, requireTeamAdminOrGlobal, requireTeamRole } from '@/lib/authorization';
import { teamMemberSchema, teamSchema } from '@/lib/validation.mts';

export async function getAdminTeams() {
    await requireGlobalAdmin();
    return prisma.team.findMany({
        select: {
            id: true,
            key: true,
            name: true,
            description: true,
            _count: { select: { issues: true, members: true, projects: true } },
        },
        orderBy: { name: 'asc' },
    });
}

export async function createTeam(data: unknown) {
    try {
        const userId = await requireGlobalAdmin();
        const input = teamSchema.parse(data);
        const team = await prisma.team.create({
            data: {
                ...input,
                members: { create: { userId, role: 'OWNER' } },
                statuses: {
                    create: [
                        { name: 'Backlog', type: 'BACKLOG', position: 0 },
                        { name: 'Todo', type: 'TODO', position: 1 },
                        { name: 'In Progress', type: 'IN_PROGRESS', position: 2 },
                        { name: 'In Review', type: 'IN_PROGRESS', position: 3 },
                        { name: 'Done', type: 'DONE', position: 4 },
                        { name: 'Canceled', type: 'CANCELED', position: 5 },
                    ],
                },
            },
        });
        return { success: true, data: team };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to create team' };
    }
}

export async function getTeamById(id: string) {
    await requireTeamRole(id, 'MEMBER');
    return prisma.team.findUnique({
        where: { id },
        select: {
            id: true,
            key: true,
            name: true,
            description: true,
            _count: { select: { issues: true, members: true, projects: true } },
        },
    });
}

export async function getTeamMembers(teamId: string) {
    await requireTeamRole(teamId, 'MEMBER');
    return prisma.teamMember.findMany({
        where: { teamId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: [{ role: 'asc' }, { user: { name: 'asc' } }],
    });
}

export async function saveTeamMember(teamId: string, data: unknown) {
    try {
        const { userId: actorId, role: actorRole } = await requireTeamAdminOrGlobal(teamId);
        const input = teamMemberSchema.parse(data);
        if (actorRole !== 'OWNER' && input.role === 'OWNER') throw new Error('Only a team owner can assign the OWNER role');
        const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } });
        if (!user) throw new Error('User not found');

        const member = await prisma.teamMember.upsert({
            where: { userId_teamId: { userId: input.userId, teamId } },
            create: { userId: input.userId, teamId, role: input.role },
            update: { role: input.role },
        });
        revalidatePath(`/teams/${teamId}`);
        return { success: true, data: member, actorId };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to save team member' };
    }
}

export async function removeTeamMember(teamId: string, userId: string) {
    try {
        const { userId: actorId, role: actorRole } = await requireTeamAdminOrGlobal(teamId);
        const member = await prisma.teamMember.findUnique({ where: { userId_teamId: { userId, teamId } } });
        if (!member) throw new Error('Team member not found');
        if (member.role === 'OWNER') {
            const ownerCount = await prisma.teamMember.count({ where: { teamId, role: 'OWNER' } });
            if (ownerCount <= 1) throw new Error('A team must retain at least one owner');
            if (actorRole !== 'OWNER') throw new Error('Only a team owner can remove an owner');
        }
        await prisma.teamMember.delete({ where: { userId_teamId: { userId, teamId } } });
        revalidatePath(`/teams/${teamId}`);
        return { success: true, actorId };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to remove team member' };
    }
}
