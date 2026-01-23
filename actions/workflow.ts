'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getWorkflowStatuses(teamId?: string) {
    // Return all statuses for global configuration
    return await prisma.workflowStatus.findMany({
        orderBy: { position: 'asc' }
    });
}

export async function createStatus(data: { name: string; type: string; teamId?: string }) {
    try {
        // Get max position across all
        const maxPos = await prisma.workflowStatus.aggregate({
            _max: { position: true }
        });
        const position = (maxPos._max.position || 0) + 1;

        const status = await prisma.workflowStatus.create({
            data: {
                name: data.name,
                type: data.type as any,
                teamId: undefined, // Always global now
                position
            } as any
        });
        revalidatePath('/admin/workflow');
        return { success: true, data: status };
    } catch (error: any) {
        console.error('[createStatus] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateStatus(id: string, data: { name?: string; type?: string }) {
    try {
        await prisma.workflowStatus.update({
            where: { id },
            data: {
                name: data.name,
                type: data.type as any
            }
        });
        revalidatePath('/admin/workflow');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteStatus(id: string) {
    try {
        const statusToDelete = await prisma.workflowStatus.findUnique({ where: { id } });
        if (!statusToDelete) throw new Error('Status not found');

        // Check for issues using this status
        const issuesCount = await prisma.issue.count({ where: { statusId: id } });

        if (issuesCount > 0) {
            // Find a replacement status with the same name but different ID
            const replacement = await prisma.workflowStatus.findFirst({
                where: {
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
    } catch (error: any) {
        console.error('[deleteStatus] Error:', error);
        return { success: false, error: error.message };
    }
}
