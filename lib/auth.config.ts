import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    providers: [], // Providers configured in auth.ts
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = !nextUrl.pathname.startsWith("/login") && !nextUrl.pathname.startsWith("/auth") && !nextUrl.pathname.startsWith("/uploads");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // Redirect logged-in users away from login page to dashboard
                if (nextUrl.pathname.startsWith("/login")) {
                    return Response.redirect(new URL("/", nextUrl));
                }
            }
            return true;
        },
    },
    cookies: {
        sessionToken: {
            name: process.env.NEXTAUTH_URL?.startsWith("https://")
                ? "__Secure-bugtrack-session-token"
                : "bugtrack-session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NEXTAUTH_URL?.startsWith("https://"),
            },
        },
    },
} satisfies NextAuthConfig;
