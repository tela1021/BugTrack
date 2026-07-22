'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireTeamRole } from '@/lib/authorization';

const periodSchema = z.union([z.literal(7), z.literal(30), z.literal(90)]);

export async function getTeamAnalytics(teamId: string, period: 7 | 30 | 90 = 30) {
    await requireTeamRole(teamId, 'MEMBER');
    const days = periodSchema.parse(period);
    const since = new Date(Date.now() - days * 86_400_000);
    const [team, issues, activeCycle] = await Promise.all([
        prisma.team.findUniqueOrThrow({ where: { id: teamId }, select: { key: true } }),
        prisma.issue.findMany({
            where: { teamId, deletedAt: null },
            select: { id: true, issueType: true, createdAt: true, updatedAt: true, cycleId: true, status: { select: { type: true } } },
        }),
        prisma.cycle.findFirst({ where: { teamId, status: 'ACTIVE' }, select: { id: true, name: true, startsAt: true, endsAt: true } }),
    ]);
    const isResolved = (issue: typeof issues[number]) => issue.status.type === 'DONE' || issue.status.type === 'CANCELED';
    const created = issues.filter((issue) => issue.createdAt >= since);
    const resolved = issues.filter((issue) => issue.updatedAt >= since && isResolved(issue));
    const activeIssues = issues.filter((issue) => !isResolved(issue));
    const wip = activeIssues.filter((issue) => issue.status.type === 'IN_PROGRESS').length;
    const averageDays = (items: typeof issues) => items.length ? Number((items.reduce((sum, issue) => sum + (issue.updatedAt.getTime() - issue.createdAt.getTime()) / 86_400_000, 0) / items.length).toFixed(1)) : null;
    const activeCycleIssues = activeCycle ? issues.filter((issue) => issue.cycleId === activeCycle.id) : [];
    const activeCycleResolved = activeCycleIssues.filter(isResolved).length;
    const trend = Array.from({ length: Math.min(days, 30) }, (_, index) => {
        const date = new Date(Date.now() - (Math.min(days, 30) - index - 1) * 86_400_000);
        const key = date.toISOString().slice(0, 10);
        return {
            date: key,
            created: issues.filter((issue) => issue.createdAt.toISOString().slice(0, 10) === key).length,
            resolved: issues.filter((issue) => isResolved(issue) && issue.updatedAt.toISOString().slice(0, 10) === key).length,
        };
    });

    return {
        period: days,
        sourceHref: `/?team=${encodeURIComponent(team.key)}&updated=${days === 7 ? '7d' : days === 30 ? '30d' : 'All'}`,
        created: created.length,
        throughput: resolved.length,
        wip,
        agingDays: activeIssues.length ? Number((activeIssues.reduce((sum, issue) => sum + (Date.now() - issue.createdAt.getTime()) / 86_400_000, 0) / activeIssues.length).toFixed(1)) : null,
        leadTimeDays: averageDays(resolved),
        mttrDays: averageDays(resolved.filter((issue) => issue.issueType === 'BUG')),
        cycle: activeCycle ? { name: activeCycle.name, total: activeCycleIssues.length, completed: activeCycleResolved, completion: activeCycleIssues.length ? Math.round(activeCycleResolved / activeCycleIssues.length * 100) : 0 } : null,
        trend,
    };
}
