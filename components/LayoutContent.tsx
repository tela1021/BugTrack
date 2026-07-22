"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CREATE_ISSUE_EVENT, ISSUE_CREATED_EVENT } from "@/lib/client-events";
import { Menu, X } from 'lucide-react';
import styles from './LayoutContent.module.css';

const CreateIssueModal = dynamic(() => import("@/components/CreateIssueModal"), { ssr: false });

interface LayoutContentProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
    commandPalette: React.ReactNode;
}

export default function LayoutContent({ children, sidebar, commandPalette }: LayoutContentProps) {
    const pathname = usePathname();
    const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isAuthPage = pathname?.startsWith("/auth") || pathname?.startsWith("/login");

    useEffect(() => {
        const openCreateIssue = () => setIsCreateIssueOpen(true);
        window.addEventListener(CREATE_ISSUE_EVENT, openCreateIssue);
        return () => window.removeEventListener(CREATE_ISSUE_EVENT, openCreateIssue);
    }, []);

    if (isAuthPage) {
        return <main id="main-content" style={{ width: "100%", height: "100vh" }}>{children}</main>;
    }

    return (
        <div className={styles.shell}>
            <button type="button" className={styles.mobileMenu} onClick={() => setDrawerOpen(true)} aria-label="Открыть навигацию" aria-expanded={drawerOpen}><Menu size={18} /></button>
            {drawerOpen && <button type="button" className={styles.backdrop} aria-label="Закрыть навигацию" onClick={() => setDrawerOpen(false)} />}
            <div className={`${styles.sidebarWrap} ${drawerOpen ? styles.sidebarWrapOpen : ''}`}>
                <button type="button" className={styles.drawerClose} onClick={() => setDrawerOpen(false)} aria-label="Закрыть навигацию"><X size={16} /></button>
                {sidebar}
            </div>
            <main id="main-content" className={styles.main}>
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
