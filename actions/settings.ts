'use server';

import { requireAuthenticatedUser } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const issueColumnSchema = z.enum(['id', 'type', 'title', 'priority', 'status', 'assignee', 'labels', 'project', 'cycle', 'updatedAt']);
const issueListPreferencesSchema = z.object({
    hiddenColumns: z.array(issueColumnSchema).max(9),
    columnWidths: z.record(z.string(), z.number().int().min(80).max(600)).default({}),
});
export type IssueListPreferences = z.infer<typeof issueListPreferencesSchema>;

export async function getIssueListPreferences(): Promise<IssueListPreferences> {
    const userId = await requireAuthenticatedUser();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
    const value = user?.preferences && typeof user.preferences === 'object' && !Array.isArray(user.preferences) ? (user.preferences as Record<string, unknown>).issueList : undefined;
    return issueListPreferencesSchema.safeParse(value).data || { hiddenColumns: [], columnWidths: {} };
}

export async function saveIssueListPreferences(data: unknown) {
    try {
        const userId = await requireAuthenticatedUser();
        const input = issueListPreferencesSchema.parse(data);
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
        const current = user?.preferences && typeof user.preferences === 'object' && !Array.isArray(user.preferences) ? user.preferences as Record<string, unknown> : {};
        await prisma.user.update({ where: { id: userId }, data: { preferences: { ...current, issueList: input } } });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Не удалось сохранить настройки списка' };
    }
}

const themePreferenceSchema = z.enum(['system', 'light', 'dark']);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export async function getThemePreference(): Promise<ThemePreference> {
    const userId = await requireAuthenticatedUser();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
    const preferences = user?.preferences && typeof user.preferences === 'object' && !Array.isArray(user.preferences)
        ? user.preferences as Record<string, unknown>
        : {};
    return themePreferenceSchema.safeParse(preferences.theme).data || 'system';
}

export async function saveThemePreference(data: unknown) {
    try {
        const userId = await requireAuthenticatedUser();
        const theme = themePreferenceSchema.parse(data);
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
        const current = user?.preferences && typeof user.preferences === 'object' && !Array.isArray(user.preferences)
            ? user.preferences as Record<string, unknown>
            : {};
        await prisma.user.update({ where: { id: userId }, data: { preferences: { ...current, theme } } });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Не удалось сохранить тему' };
    }
}

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(12, "New password must be at least 12 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password")
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

export type PasswordActionState = {
    error?: string;
    success?: string;
    fieldErrors?: Record<string, string[] | undefined>;
};

export async function updatePassword(_prevState: PasswordActionState, formData: FormData): Promise<PasswordActionState> {
    const userId = await requireAuthenticatedUser();
    const validatedFields = passwordSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors
        };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || !user.hashedPassword) {
            return { error: "User not found" };
        }

        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.hashedPassword
        );

        if (!isPasswordCorrect) {
            return { error: "Incorrect current password" };
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { hashedPassword: hashedNewPassword }
        });

        return { success: "Password updated successfully" };
    } catch {
        return { error: "Internal server error" };
    }
}
