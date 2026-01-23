"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname?.startsWith("/auth");

    if (isAuthPage) {
        return <main style={{ width: "100%", height: "100vh" }}>{children}</main>;
    }

    return (
        <div style={{ display: 'flex' }}>
            {/* @ts-ignore */}
            <Sidebar />
            <main style={{ flex: 1, height: "100vh", overflowY: "auto" }}>
                {children}
            </main>
            <CommandPalette />
        </div>
    );
}
