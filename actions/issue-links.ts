'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireIssueAccess } from '@/lib/authorization';

const linkSchema = z.object({ targetId: z.coerce.number().int().positive(), relation: z.enum(['BLOCKS', 'BLOCKED_BY', 'DUPLICATES', 'RELATES_TO']) });

export async function addIssueLink(sourceId: number, data: unknown) {
    try {
        const { userId } = await requireIssueAccess(sourceId, 'MEMBER');
        const input = linkSchema.parse(data);
        if (input.targetId === sourceId) throw new Error('An issue cannot link to itself');
        const [source, target] = await Promise.all([prisma.issue.findUnique({ where: { id: sourceId } }), prisma.issue.findUnique({ where: { id: input.targetId } })]);
        if (!source || !target || target.deletedAt || source.teamId !== target.teamId) throw new Error('Linked issue must belong to the issue team');
        const link = await prisma.issueLink.upsert({ where: { sourceId_targetId_relation: { sourceId, targetId: input.targetId, relation: input.relation } }, create: { sourceId, targetId: input.targetId, relation: input.relation }, update: {} });
        await prisma.issueHistory.create({ data: { issueId: sourceId, actorId: userId, field: 'link', newValue: `${input.relation}:${target.readableId}` } });
        return { success: true, data: link };
    } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Не удалось добавить связь' }; }
}

export async function removeIssueLink(linkId: string) {
    try {
        const link = await prisma.issueLink.findUnique({ where: { id: linkId } });
        if (!link) throw new Error('Issue link not found');
        await requireIssueAccess(link.sourceId, 'MEMBER');
        await prisma.issueLink.delete({ where: { id: linkId } });
        return { success: true };
    } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Не удалось удалить связь' }; }
}
