import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import LayoutContent from "@/components/LayoutContent";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "BugZero | Productivity Tool for Engineers",
  description: "High-performance bug tracking system for modern engineering teams.",
};

import { auth } from "@/lib/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider session={session}>
          <ToastProvider>
            <LayoutContent
              sidebar={<Sidebar />}
              commandPalette={<CommandPalette />}
            >
              {children}
            </LayoutContent>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
