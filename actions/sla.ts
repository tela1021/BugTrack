'use server';

import prisma from '@/lib/prisma';
import { requireTeamAdminOrGlobal, requireTeamRole } from '@/lib/authorization';
import { z } from 'zod';

const defaultPolicy = { timezone: 'UTC', businessDays: [1, 2, 3, 4, 5], startHour: 9, endHour: 18, responseMinutes: { URGENT: 60, HIGH: 240, MEDIUM: 480, LOW: 1440 }, resolutionMinutes: { URGENT: 240, HIGH: 1440, MEDIUM: 2880, LOW: 7200 } };
const durationSchema = z.object({ URGENT: z.number().int().min(1).max(43_200), HIGH: z.number().int().min(1).max(43_200), MEDIUM: z.number().int().min(1).max(43_200), LOW: z.number().int().min(1).max(43_200) });
const slaPolicySchema = z.object({ timezone: z.string().trim().min(1).max(100), businessDays: z.array(z.number().int().min(1).max(7)).min(1).max(7), startHour: z.number().int().min(0).max(23), endHour: z.number().int().min(1).max(24), responseMinutes: durationSchema, resolutionMinutes: durationSchema }).refine((data) => data.endHour > data.startHour, { message: 'Working day must have a positive duration.' });

function businessMinutesBetween(start: Date, end: Date, policy: typeof defaultPolicy) {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: policy.timezone, weekday: 'short', hour: 'numeric', hour12: false });
    const weekdays: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    let minutes = 0;
    for (let time = start.getTime(); time < end.getTime(); time += 15 * 60_000) {
        const parts = Object.fromEntries(formatter.formatToParts(new Date(time)).map((part) => [part.type, part.value]));
        if (policy.businessDays.includes(weekdays[parts.weekday] || 0) && Number(parts.hour) >= policy.startHour && Number(parts.hour) < policy.endHour) minutes += 15;
    }
    return minutes;
}

export async function getSlaSummary(teamId: string) {
    await requireTeamRole(teamId, 'MEMBER');
    const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId }, select: { slaPolicy: true } });
    const policy = { ...defaultPolicy, ...(team.slaPolicy && typeof team.slaPolicy === 'object' ? team.slaPolicy as Partial<typeof defaultPolicy> : {}) };
    const bugs = await prisma.issue.findMany({ where: { teamId, issueType: 'BUG', deletedAt: null, status: { type: { notIn: ['DONE', 'CANCELED'] } } }, select: { readableId: true, priority: true, createdAt: true, comments: { select: { createdAt: true }, orderBy: { createdAt: 'asc' }, take: 1 } } });
    const now = new Date();
    const atRisk = bugs.map((bug) => {
        const responseElapsed = businessMinutesBetween(bug.createdAt, bug.comments[0]?.createdAt || now, policy);
        const resolutionElapsed = businessMinutesBetween(bug.createdAt, now, policy);
        const responseLimit = policy.responseMinutes[bug.priority as keyof typeof policy.responseMinutes] || policy.responseMinutes.LOW;
        const resolutionLimit = policy.resolutionMinutes[bug.priority as keyof typeof policy.resolutionMinutes] || policy.resolutionMinutes.LOW;
        const level = responseElapsed > responseLimit || resolutionElapsed > resolutionLimit ? 'breach' : responseElapsed >= responseLimit * .8 || resolutionElapsed >= resolutionLimit * .8 ? 'risk' : 'ok';
        return { readableId: bug.readableId, level, responseElapsed, resolutionElapsed };
    });
    return { policy, openBugs: bugs.length, atRisk: atRisk.filter((item) => item.level === 'risk'), breached: atRisk.filter((item) => item.level === 'breach') };
}

export async function saveSlaPolicy(teamId: string, data: unknown) {
    try {
        await requireTeamAdminOrGlobal(teamId);
        const policy = slaPolicySchema.parse(data);
        // Fail fast on a non-IANA timezone instead of saving a policy that cannot be calculated.
        new Intl.DateTimeFormat('en-US', { timeZone: policy.timezone }).format();
        await prisma.team.update({ where: { id: teamId }, data: { slaPolicy: policy } });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Не удалось сохранить SLA policy' };
    }
}
