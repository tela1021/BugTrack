"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CREATE_ISSUE_EVENT, ISSUE_CREATED_EVENT } from "@/lib/client-events";

const CreateIssueModal = dynamic(() => import("@/components/CreateIssueModal"), { ssr: false });

interface LayoutContentProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
    commandPalette: React.ReactNode;
}

export default function LayoutContent({ children, sidebar, commandPalette }: LayoutContentProps) {
    const pathname = usePathname();
    const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
    const isAuthPage = pathname?.startsWith("/auth") || pathname?.startsWith("/login");

    useEffect(() => {
        const openCreateIssue = () => setIsCreateIssueOpen(true);
        window.addEventListener(CREATE_ISSUE_EVENT, openCreateIssue);
        return () => window.removeEventListener(CREATE_ISSUE_EVENT, openCreateIssue);
    }, []);

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
            <CreateIssueModal
                isOpen={isCreateIssueOpen}
                onClose={() => setIsCreateIssueOpen(false)}
                onSuccess={() => window.dispatchEvent(new Event(ISSUE_CREATED_EVENT))}
            />
        </div>
    );
}
