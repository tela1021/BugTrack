'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuthenticatedUser } from '@/lib/authorization';

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
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                actorId: data.actorId,
                issueId: data.issueId,
                commentId: data.commentId || null,
                type: data.type,
            }
        });
        return notification;
    } catch {
        return null;
    }
}

export async function getNotifications() {
    const userId = await requireAuthenticatedUser();

    return await prisma.notification.findMany({
        where: { userId },
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
        const userId = await requireAuthenticatedUser();
        const result = await prisma.notification.updateMany({
            where: { id, userId },
            data: { read: true }
        });

        if (result.count === 0) {
            return { success: false, error: 'Notification not found' };
        }

        revalidatePath('/notifications');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to mark as read' };
    }
}

export async function getUnreadCount() {
    const userId = await requireAuthenticatedUser();

    return await prisma.notification.count({
        where: { userId, read: false }
    });
}
