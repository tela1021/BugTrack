"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import styles from "./Sidebar.module.css";
import Link from "next/link";

export default function UserAccount() {
    const { data: session } = useSession();

    if (!session?.user) return null;

    return (
        <div className={styles.sidebarFooter} style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
            <div className={styles.navItem} style={{ cursor: "default", background: "none" }}>
                <div style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <UserIcon size={14} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {session.user.name}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--muted-foreground)" }}>
                        {(session.user as any).role || "Member"}
                    </span>
                </div>
            </div>

            <Link href="/settings" className={styles.navItem} style={{ textDecoration: "none", color: "inherit" }}>
                <Settings size={16} />
                <span className={styles.navLabel}>Settings</span>
            </Link>

            <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className={styles.navItem}
                style={{ marginTop: "4px", color: "var(--destructive)" }}
            >
                <LogOut size={16} />
                <span className={styles.navLabel}>Sign Out</span>
            </button>
        </div>
    );
}
