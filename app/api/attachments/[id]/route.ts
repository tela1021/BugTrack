import { createHash } from 'crypto';
import { readAttachmentFile } from '@/lib/attachment-storage';
import { requireIssueAccess } from '@/lib/authorization';
import prisma from '@/lib/prisma';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const attachment = await prisma.attachment.findUnique({
        where: { id },
        select: { issueId: true, name: true, mimeType: true, size: true, checksum: true },
    });
    if (!attachment) return new Response('Not found', { status: 404 });

    const { userId } = await requireIssueAccess(attachment.issueId, 'MEMBER');
    try {
        const file = await readAttachmentFile(id);
        if (attachment.checksum && createHash('sha256').update(file).digest('hex') !== attachment.checksum) {
            return new Response('Attachment integrity check failed', { status: 409 });
        }
        await prisma.issueHistory.create({
            data: { issueId: attachment.issueId, actorId: userId, field: 'attachment_download', newValue: attachment.name },
        });
        return new Response(file, {
            headers: {
                'Content-Type': attachment.mimeType || 'application/octet-stream',
                'Content-Length': attachment.size.toString(),
                'Content-Disposition': `attachment; filename="${attachment.name.replace(/["\\]/g, '_')}"`,
                'Cache-Control': 'private, no-store',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch {
        return new Response('Not found', { status: 404 });
    }
}
