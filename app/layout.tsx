import type { Metadata } from "next";
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
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <main style={{ flex: 1, height: '100vh', overflowY: 'auto' }}>
            {children}
          </main>
        </div>
        <CommandPalette />
      </body>
    </html>
  );
}
