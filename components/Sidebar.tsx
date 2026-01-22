import Link from 'next/link';
import {
    BarChart2,
    Layers,
    Layout,
    List,
    Search,
    Settings,
    Terminal,
    Users,
    Shield
} from 'lucide-react';
import styles from './Sidebar.module.css';

import { getSidebarData } from '@/actions/sidebar';

export default async function Sidebar() {
    const data = await getSidebarData();

    const menuItems = [
        { icon: Search, label: 'Search', shortcut: '⌘K' },
        { icon: List, label: 'Inbox', count: data.inboxCount, href: '/' },
        // Added All Issues link for explicit "See all"
        { icon: Layout, label: 'All Issues', href: '/' },
        { icon: Shield, label: 'Admin', href: '/admin' },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
                <div className={styles.workspaceLogo}>BZ</div>
                <span className={styles.workspaceName}>BugZero Workspace</span>
            </div>

            <nav className={styles.sidebarNav}>
                {menuItems.map((item, idx) => {
                    const Content = (
                        <div className={styles.navItem}>
                            <item.icon size={18} />
                            <span className={styles.navLabel}>{item.label}</span>
                            {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
                            {item.count !== undefined && item.count > 0 && <span className={styles.badge}>{item.count}</span>}
                        </div>
                    );

                    if (item.href) {
                        return (
                            <Link href={item.href} key={idx} style={{ display: 'block', width: '100%', textDecoration: 'none', color: 'inherit' }}>
                                {Content}
                            </Link>
                        );
                    }

                    return <div key={idx} style={{ cursor: 'pointer' }}>{Content}</div>;
                })}
            </nav>

            <div className={styles.sidebarSection}>
                <h3 className={styles.sectionTitle}>PROJECTS</h3>
                <nav className={styles.sidebarNav}>
                    {data.projects.map((proj: any, idx: number) => (
                        <Link href={`/admin/projects`} key={idx} className={styles.navItem} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div
                                className={styles.projectDot}
                                style={{ backgroundColor: proj.color }}
                            />
                            <span className={styles.navLabel}>{proj.label}</span>
                        </Link>
                    ))}
                    {data.projects.length === 0 && (
                        <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--muted-foreground)' }}>No projects</div>
                    )}
                </nav>
            </div>

            <div className={styles.sidebarSection}>
                <h3 className={styles.sectionTitle}>TEAMS</h3>
                <nav className={styles.sidebarNav}>
                    <Link href="/admin/teams" className={styles.navItem} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Users size={18} />
                        <span className={styles.navLabel}>Engineering</span>
                    </Link>
                </nav>
            </div>

            <div className={styles.sidebarFooter}>
                <button className={styles.navItem}>
                    <Settings size={18} />
                    <span className={styles.navLabel}>Settings</span>
                </button>
            </div>
        </aside>
    );
}
import React from 'react';
