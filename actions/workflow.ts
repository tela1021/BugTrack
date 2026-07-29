'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireTeamAdminOrGlobal } from '@/lib/authorization';
import { workflowStatusOrderSchema, workflowStatusUpdateSchema } from '@/lib/validation.mts';

export async function getWorkflowStatuses(teamId: string) {
    await requireTeamAdminOrGlobal(teamId);

    return await prisma.workflowStatus.findMany({
        where: { teamId },
        orderBy: { position: 'asc' }
    });
}

export async function createStatus(data: { name: string; type: string; teamId: string }) {
    try {
        await requireTeamAdminOrGlobal(data.teamId);
        const maxPos = await prisma.workflowStatus.aggregate({
            where: { teamId: data.teamId },
            _max: { position: true }
        });
        const position = (maxPos._max.position || 0) + 1;

        const status = await prisma.workflowStatus.create({
            data: {
                name: data.name,
                type: data.type,
                teamId: data.teamId,
                position
            }
        });
        revalidatePath('/admin/workflow');
        return { success: true, data: status };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to create status' };
    }
}

export async function updateStatus(id: string, data: unknown) {
    try {
        const status = await prisma.workflowStatus.findUnique({ where: { id }, select: { teamId: true } });
        if (!status) throw new Error('Status not found');
        await requireTeamAdminOrGlobal(status.teamId);
        const input = workflowStatusUpdateSchema.parse(data);
        await prisma.workflowStatus.update({
            where: { id },
            data: input
        });
        revalidatePath('/admin/workflow');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to update status' };
    }
}

export async function reorderWorkflowStatuses(teamId: string, orderedStatusIds: unknown) {
    try {
        await requireTeamAdminOrGlobal(teamId);
        const statusIds = workflowStatusOrderSchema.parse(orderedStatusIds);
        const teamStatuses = await prisma.workflowStatus.findMany({
            where: { teamId },
            select: { id: true }
        });
        const teamStatusIds = new Set(teamStatuses.map((status) => status.id));

        if (teamStatuses.length !== statusIds.length || statusIds.some((id) => !teamStatusIds.has(id))) {
            throw new Error("Submitted status order does not match the team's workflow.");
        }

        await prisma.$transaction(async (transaction) => {
            for (const [index, id] of statusIds.entries()) {
                await transaction.workflowStatus.update({
                    where: { id },
                    data: { position: -(index + 1) }
                });
            }
            for (const [index, id] of statusIds.entries()) {
                await transaction.workflowStatus.update({
                    where: { id },
                    data: { position: index }
                });
            }
        });

        revalidatePath('/admin/workflow');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Не удалось сохранить порядок статусов' };
    }
}

export async function deleteStatus(id: string) {
    try {
        const statusToDelete = await prisma.workflowStatus.findUnique({ where: { id } });
        if (!statusToDelete) throw new Error('Status not found');
        await requireTeamAdminOrGlobal(statusToDelete.teamId);

        // Check for issues using this status
        const issuesCount = await prisma.issue.count({ where: { statusId: id } });

        if (issuesCount > 0) {
            const replacement = await prisma.workflowStatus.findFirst({
                where: {
                    teamId: statusToDelete.teamId,
                    name: statusToDelete.name,
                    id: { not: id }
                }
            });

            if (replacement) {
                // Migrate issues to the replacement status
                await prisma.issue.updateMany({
                    where: { statusId: id },
                    data: { statusId: replacement.id }
                });
            } else {
                throw new Error(`Cannot delete status "${statusToDelete.name}" because ${issuesCount} issues are using it and no replacement was found.`);
            }
        }

        await prisma.workflowStatus.delete({
            where: { id }
        });

        revalidatePath('/admin/workflow');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to delete status' };
    }
}
