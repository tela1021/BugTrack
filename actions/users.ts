'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { requireGlobalAdmin } from '@/lib/authorization';
import { createUserSchema } from '@/lib/validation.mts';

export async function getUsers() {
    await requireGlobalAdmin();
    return await prisma.user.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function updateUser(userId: string, data: { name?: string; role?: 'ADMIN' | 'MEMBER' }) {
    try {
        await requireGlobalAdmin();
        await prisma.user.update({
            where: { id: userId },
            data
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to update user' };
    }
}

export async function createUser(data: { name: string; email: string; role: 'ADMIN' | 'MEMBER'; password: string }) {
    try {
        await requireGlobalAdmin();
        const input = createUserSchema.parse(data);
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const user = await prisma.user.create({
            data: {
                name: input.name,
                email: input.email,
                role: input.role,
                hashedPassword: hashedPassword
            }
        });
        revalidatePath('/admin/users');
        return { success: true, data: user };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to create user' };
    }
}

export async function resetPassword(userId: string, password: string) {
    try {
        await requireGlobalAdmin();
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { hashedPassword: hashedPassword }
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unable to reset password' };
    }
}
