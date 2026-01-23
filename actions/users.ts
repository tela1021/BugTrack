'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function getUsers() {
    return await prisma.user.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function updateUser(userId: string, data: { name?: string; role?: 'ADMIN' | 'MEMBER' }) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createUser(data: { name: string; email: string; role: 'ADMIN' | 'MEMBER'; password?: string }) {
    try {
        const hashedPassword = await bcrypt.hash(data.password || '123456', 10);
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                hashedPassword: hashedPassword
            }
        });
        revalidatePath('/admin/users');
        return { success: true, data: user };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function resetPassword(userId: string, password: string) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { hashedPassword: hashedPassword }
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
