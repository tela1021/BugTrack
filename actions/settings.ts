'use server';

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password")
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

export async function updatePassword(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    const userId = session.user.id;
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
    } catch (error) {
        console.error("Failed to update password:", error);
        return { error: "Internal server error" };
    }
}
