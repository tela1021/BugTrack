'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

export async function createNotification(data: {
    userId: string;
    actorId: string;
    issueId: number;
    commentId?: string;
    type: 'COMMENT' | 'STATUS_CHANGE' | 'ASSIGNED';
}) {
    // Don't notify if the actor is the same as the recipient
    if (data.userId === data.actorId) return null;

    try {
        const notification = await (prisma as any).notification.create({
            data: {
                userId: data.userId,
                actorId: data.actorId,
                issueId: data.issueId,
                commentId: data.commentId || null,
                type: data.type,
            }
        });
        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
}

export async function getNotifications() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await (prisma as any).notification.findMany({
        where: { userId: session.user.id },
        include: {
            actor: true,
            issue: true,
            comment: true
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function markAsRead(id: string) {
    try {
        await (prisma as any).notification.update({
            where: { id },
            data: { read: true }
        });
        revalidatePath('/notifications');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to mark as read' };
    }
}

export async function getUnreadCount() {
    const session = await auth();
    if (!session?.user?.id) return 0;

    return await (prisma as any).notification.count({
        where: { userId: session.user.id, read: false }
    });
}
