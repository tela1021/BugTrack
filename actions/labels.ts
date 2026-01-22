'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addLabelToIssue(issueId: number, labelId: string) {
    try {
        await prisma.labelOnIssue.create({
            data: {
                issueId,
                labelId
            }
        });

        revalidatePath(`/issues/${issueId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeLabelFromIssue(issueId: number, labelId: string) {
    try {
        await prisma.labelOnIssue.delete({
            where: {
                issueId_labelId: {
                    issueId,
                    labelId
                }
            }
        });

        revalidatePath(`/issues/${issueId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllLabels() {
    return await prisma.label.findMany();
}
