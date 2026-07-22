'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireTeamAdminOrGlobal, requireTeamRole } from '@/lib/authorization';

const githubIntegrationSchema = z.object({
    repository: z.string().trim().regex(/^[\w.-]+\/[\w.-]+$/, 'Repository must be owner/name.'),
    enabled: z.boolean().default(true),
    actorUserId: z.string().trim().min(1).max(100),
    reviewStatusId: z.string().trim().min(1).max(100).nullable().optional(),
    doneStatusId: z.string().trim().min(1).max(100).nullable().optional(),
}).strict();

export async function getGitHubIntegration(teamId: string) {
    await requireTeamRole(teamId, 'MEMBER');
    return prisma.teamIntegration.findMany({ where: { teamId, provider: 'GITHUB' }, orderBy: { repository: 'asc' } });
}

export async function saveGitHubIntegration(teamId: string, data: unknown) {
    try {
        await requireTeamAdminOrGlobal(teamId);
        const input = githubIntegrationSchema.parse(data);
        const membership = await prisma.teamMember.findUnique({ where: { userId_teamId: { userId: input.actorUserId, teamId } }, select: { userId: true } });
        if (!membership) throw new Error('Automation actor must be a member of the team');
        const statusIds = [input.reviewStatusId, input.doneStatusId].filter((id): id is string => Boolean(id));
        if (statusIds.length) {
            const statuses = await prisma.workflowStatus.count({ where: { teamId, id: { in: statusIds } } });
            if (statuses !== new Set(statusIds).size) throw new Error('Configured workflow statuses must belong to the team');
        }
        const integration = await prisma.teamIntegration.upsert({
            where: { teamId_provider_repository: { teamId, provider: 'GITHUB', repository: input.repository } },
            create: { ...input, teamId, provider: 'GITHUB' },
            update: input,
        });
        return { success: true, data: integration };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Не удалось сохранить GitHub-интеграцию' };
    }
}

export async function saveGitLabIntegration(teamId: string, data: unknown) {
    try {
        await requireTeamAdminOrGlobal(teamId);
        const input = githubIntegrationSchema.parse(data);
        const member = await prisma.teamMember.findUnique({ where: { userId_teamId: { userId: input.actorUserId, teamId } }, select: { userId: true } });
        if (!member) throw new Error('Automation actor must be a member of the team');
        return { success: true, data: await prisma.teamIntegration.upsert({ where: { teamId_provider_repository: { teamId, provider: 'GITLAB', repository: input.repository } }, create: { ...input, teamId, provider: 'GITLAB' }, update: input }) };
    } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Не удалось сохранить GitLab-интеграцию' }; }
}
