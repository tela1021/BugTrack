import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import LayoutContent from "@/components/LayoutContent";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import "./globals.css";

export const metadata: Metadata = {
  title: "BugZero | Productivity Tool for Engineers",
  description: "High-performance bug tracking system for modern engineering teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LayoutContent
            sidebar={<Sidebar />}
            commandPalette={<CommandPalette />}
          >
            {children}
          </LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
