import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function refs(value: string) { return [...value.matchAll(/(?:Fixes|Closes)\s+([A-Z][A-Z0-9]{1,9}-\d+)/gi)].map((item) => item[1].toUpperCase()); }
export async function POST(request: Request) {
    if (!process.env.GITLAB_WEBHOOK_TOKEN || request.headers.get('x-gitlab-token') !== process.env.GITLAB_WEBHOOK_TOKEN) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const deliveryId = request.headers.get('x-gitlab-event-uuid');
    if (!deliveryId) return NextResponse.json({ error: 'Missing delivery id' }, { status: 400 });
    if (await prisma.webhookDelivery.findUnique({ where: { provider_deliveryId: { provider: 'GITLAB', deliveryId } } })) return NextResponse.json({ status: 'duplicate' });
    const payload = await request.text(); let body: Record<string, unknown>;
    try { body = JSON.parse(payload) as Record<string, unknown>; } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const project = body.project as { path_with_namespace?: string } | undefined;
    const integration = project?.path_with_namespace ? await prisma.teamIntegration.findFirst({ where: { provider: 'GITLAB', repository: project.path_with_namespace, enabled: true } }) : null;
    const delivery = await prisma.webhookDelivery.create({ data: { provider: 'GITLAB', deliveryId, event: request.headers.get('x-gitlab-event') || 'unknown', payloadHash: createHash('sha256').update(payload).digest('hex'), integrationId: integration?.id } });
    if (!integration) { await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { status: 'IGNORED', processedAt: new Date() } }); return NextResponse.json({ status: 'ignored' }, { status: 202 }); }
    const attributes = body.object_attributes as { title?: string; description?: string; state?: string; action?: string } | undefined;
    const issueIds = refs([attributes?.title, attributes?.description].filter(Boolean).join('\n'));
    const targetStatus = attributes?.state === 'merged' ? integration.doneStatusId : ['open', 'reopen'].includes(attributes?.action || '') ? integration.reviewStatusId : null;
    if (targetStatus && issueIds.length) { const status = await prisma.workflowStatus.findFirst({ where: { id: targetStatus, teamId: integration.teamId } }); if (status) { const issues = await prisma.issue.findMany({ where: { teamId: integration.teamId, readableId: { in: issueIds }, deletedAt: null }, include: { status: true } }); await prisma.$transaction(async (tx) => { for (const issue of issues) { if (issue.statusId === status.id) continue; await tx.issue.update({ where: { id: issue.id }, data: { statusId: status.id } }); await tx.issueHistory.create({ data: { issueId: issue.id, actorId: integration.actorUserId, field: 'status', oldValue: issue.status.name, newValue: status.name } }); } }); } }
    await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { status: 'PROCESSED', processedAt: new Date() } }); return NextResponse.json({ status: 'processed' });
}
