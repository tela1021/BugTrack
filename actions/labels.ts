'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireIssueAccess, requireTeamRole } from '@/lib/authorization';

async function requireIssueLabelAccess(issueId: number, labelId: string) {
    const access = await requireIssueAccess(issueId, "MEMBER");
    const [issue, label] = await Promise.all([
        prisma.issue.findUnique({ where: { id: issueId }, select: { teamId: true } }),
        prisma.label.findUnique({ where: { id: labelId } }),
    ]);

    if (!issue || !label || label.teamId !== issue.teamId) {
        throw new Error('Label does not belong to the issue team');
    }
    return { userId: access.userId, label };
}

export async function addLabelToIssue(issueId: number, labelId: string) {
    try {
        const { userId, label } = await requireIssueLabelAccess(issueId, labelId);
        await prisma.labelOnIssue.create({
            data: {
                issueId,
                labelId
            }
        });
        await prisma.issueHistory.create({
            data: { issueId, actorId: userId, field: 'label', oldValue: null, newValue: label.name },
        });

        revalidatePath(`/issues/${issueId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to add label' };
    }
}

export async function removeLabelFromIssue(issueId: number, labelId: string) {
    try {
        const { userId, label } = await requireIssueLabelAccess(issueId, labelId);
        await prisma.labelOnIssue.delete({
            where: {
                issueId_labelId: {
                    issueId,
                    labelId
                }
            }
        });
        await prisma.issueHistory.create({
            data: { issueId, actorId: userId, field: 'label', oldValue: label.name, newValue: null },
        });

        revalidatePath(`/issues/${issueId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to remove label' };
    }
}

export async function getAllLabels(teamId: string) {
    await requireTeamRole(teamId, "MEMBER");
    return prisma.label.findMany({ where: { teamId }, orderBy: { name: 'asc' } });
}
