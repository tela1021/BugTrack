import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

function isValidSignature(payload: string, signature: string | null) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret || !signature?.startsWith('sha256=')) return false;
    const expected = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(signature);
    return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

function issueReferences(value: string) {
    return [...value.matchAll(/(?:Fixes|Closes)\s+([A-Z][A-Z0-9]{1,9}-\d+)/gi)].map((match) => match[1].toUpperCase());
}

export async function POST(request: Request) {
    const payload = await request.text();
    if (!isValidSignature(payload, request.headers.get('x-hub-signature-256'))) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    const deliveryId = request.headers.get('x-github-delivery');
    const event = request.headers.get('x-github-event') || 'unknown';
    if (!deliveryId) return NextResponse.json({ error: 'Missing delivery id' }, { status: 400 });
    const existing = await prisma.webhookDelivery.findUnique({ where: { provider_deliveryId: { provider: 'GITHUB', deliveryId } }, select: { id: true } });
    if (existing) return NextResponse.json({ status: 'duplicate' });

    let body: Record<string, unknown>;
    try { body = JSON.parse(payload) as Record<string, unknown>; } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const repository = body.repository as { full_name?: string } | undefined;
    const integration = repository?.full_name ? await prisma.teamIntegration.findFirst({ where: { provider: 'GITHUB', repository: repository.full_name, enabled: true } }) : null;
    const delivery = await prisma.webhookDelivery.create({ data: { provider: 'GITHUB', deliveryId, event, payloadHash: createHash('sha256').update(payload).digest('hex'), integrationId: integration?.id } });
    if (!integration || event !== 'pull_request') {
        await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { status: 'IGNORED', processedAt: new Date() } });
        return NextResponse.json({ status: 'ignored' }, { status: 202 });
    }

    try {
        const pullRequest = body.pull_request as { title?: string; body?: string; merged?: boolean; head?: { ref?: string } } | undefined;
        const action = typeof body.action === 'string' ? body.action : '';
        const refs = issueReferences([pullRequest?.title, pullRequest?.body, pullRequest?.head?.ref].filter(Boolean).join('\n'));
        const statusId = pullRequest?.merged && action === 'closed' ? integration.doneStatusId : ['opened', 'reopened'].includes(action) ? integration.reviewStatusId : null;
        if (refs.length && statusId) {
            const nextStatus = await prisma.workflowStatus.findFirst({ where: { id: statusId, teamId: integration.teamId }, select: { id: true, name: true } });
            if (nextStatus) {
                const issues = await prisma.issue.findMany({ where: { teamId: integration.teamId, readableId: { in: refs }, deletedAt: null }, select: { id: true, status: { select: { name: true } } } });
                await prisma.$transaction(async (transaction) => {
                    for (const issue of issues) {
                        if (issue.status.name === nextStatus.name) continue;
                        await transaction.issue.update({ where: { id: issue.id }, data: { statusId: nextStatus.id } });
                        await transaction.issueHistory.create({ data: { issueId: issue.id, actorId: integration.actorUserId, field: 'status', oldValue: issue.status.name, newValue: nextStatus.name } });
                    }
                });
            }
        }
        await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { status: 'PROCESSED', processedAt: new Date() } });
        return NextResponse.json({ status: 'processed' });
    } catch {
        await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { status: 'FAILED', error: 'Processing failed', processedAt: new Date() } });
        return NextResponse.json({ status: 'failed' }, { status: 500 });
    }
}
