'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireTeamAdminOrGlobal, requireTeamRole } from '@/lib/authorization';
import { createCycleSchema, updateCycleSchema } from '@/lib/validation.mts';

export async function getCycles(teamId: string) {
    await requireTeamRole(teamId, 'MEMBER');
    return prisma.cycle.findMany({
        where: { teamId },
        include: { _count: { select: { issues: { where: { deletedAt: null } } } } },
        orderBy: [{ status: 'asc' }, { startsAt: 'desc' }],
    });
}

export async function createCycle(teamId: string, data: unknown) {
    try {
        await requireTeamAdminOrGlobal(teamId);
        const input = createCycleSchema.parse(data);
        const cycle = await prisma.$transaction(async (transaction) => {
            if (input.status === 'ACTIVE') {
                const activeCycle = await transaction.cycle.findFirst({ where: { teamId, status: 'ACTIVE' }, select: { id: true } });
                if (activeCycle) throw new Error('Only one active cycle is allowed per team');
            }
            return transaction.cycle.create({ data: { ...input, teamId } });
        });
        revalidatePath(`/teams/${teamId}`);
        return { success: true, data: cycle };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Не удалось создать цикл' };
    }
}

export async function updateCycle(cycleId: string, data: unknown) {
    try {
        const current = await prisma.cycle.findUnique({ where: { id: cycleId } });
        if (!current) throw new Error('Cycle not found');
        await requireTeamAdminOrGlobal(current.teamId);
        const input = updateCycleSchema.parse(data);
        const startsAt = input.startsAt || current.startsAt;
        const endsAt = input.endsAt || current.endsAt;
        if (endsAt <= startsAt) throw new Error('Cycle end must be after its start date.');
        const status = input.status || current.status;
        const cycle = await prisma.$transaction(async (transaction) => {
            if (status === 'ACTIVE') {
                const activeCycle = await transaction.cycle.findFirst({ where: { teamId: current.teamId, status: 'ACTIVE', id: { not: cycleId } }, select: { id: true } });
                if (activeCycle) throw new Error('Only one active cycle is allowed per team');
            }
            return transaction.cycle.update({ where: { id: cycleId }, data: input });
        });
        revalidatePath(`/teams/${current.teamId}`);
        return { success: true, data: cycle };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Не удалось обновить цикл' };
    }
}
