"use client";

import { usePathname } from "next/navigation";

interface LayoutContentProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
    commandPalette: React.ReactNode;
}

export default function LayoutContent({ children, sidebar, commandPalette }: LayoutContentProps) {
    const pathname = usePathname();
    const isAuthPage = pathname?.startsWith("/auth");

    if (isAuthPage) {
        return <main style={{ width: "100%", height: "100vh" }}>{children}</main>;
    }

    return (
        <div style={{ display: 'flex' }}>
            {sidebar}
            <main style={{ flex: 1, height: "100vh", overflowY: "auto" }}>
                {children}
            </main>
            {commandPalette}
        </div>
    );
}
