'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireGlobalAdmin, requireTeamAdminOrGlobal, requireTeamRole } from '@/lib/authorization';
import { projectSchema } from '@/lib/validation.mts';

export async function getProjects() {
    await requireGlobalAdmin();
    const projects = await prisma.project.findMany({
        include: {
            team: { select: { id: true, name: true, key: true } },
            _count: { select: { issues: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        teamId: project.teamId,
        teamName: project.team.name,
        teamKey: project.team.key,
        issues: project._count.issues,
        created: project.createdAt.toISOString(),
    }));
}

export async function createProject(data: unknown) {
    try {
        const input = projectSchema.parse(data);
        await requireTeamAdminOrGlobal(input.teamId);
        const project = await prisma.project.create({
            data: input,
        });
        revalidatePath('/admin/projects');
        return { success: true, data: project };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to create project' };
    }
}

export async function updateProject(id: string, data: unknown) {
    try {
        const input = projectSchema.parse(data);
        const existingProject = await prisma.project.findUnique({ where: { id }, select: { teamId: true } });
        if (!existingProject) throw new Error('Project not found');
        await requireTeamAdminOrGlobal(existingProject.teamId);
        if (input.teamId !== existingProject.teamId) throw new Error('Project team cannot be changed');
        await prisma.project.update({
            where: { id },
            data: input,
        });
        revalidatePath('/admin/projects');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to update project' };
    }
}

export async function getProjectById(id: string) {
    const project = await prisma.project.findUnique({
        where: { id },
        include: { team: { select: { id: true, key: true, name: true } } },
    });
    if (!project) return null;

    await requireTeamRole(project.teamId, 'MEMBER');
    return {
        id: project.id,
        name: project.name,
        description: project.description,
        teamId: project.teamId,
        team: project.team,
    };
}
