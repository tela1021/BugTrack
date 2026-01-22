import {
    Users,
    Settings,
    Layout,
    CreditCard,
    Globe,
    ShieldCheck,
    ArrowRight,
    Folder
} from "lucide-react";
import Link from "next/link";
import styles from "./Admin.module.css";
import { getSystemStats } from "@/actions/admin";

export default async function AdminDashboard() {
    const stats = await getSystemStats();

    const sections = [
        {
            title: "Organization",
            items: [
                { icon: Users, label: "Users & Roles", count: stats.users, href: "/admin/users" },
                { icon: Layout, label: "Teams", count: stats.teams, href: "/admin/teams" },
                { icon: Folder, label: "Projects", count: stats.projects, href: "/admin/projects" },
                { icon: ShieldCheck, label: "Workflow Statuses", href: "/admin/workflow" },
                { icon: ShieldCheck, label: "Security & RLS", href: "/admin/security" }
            ]
        },
        {
            title: "System Settings",
            items: [
                { icon: Settings, label: "General Settings", href: "/admin/settings" },
                { icon: Globe, label: "Integrations & Webhooks", href: "/admin/integrations" }
            ]
        }
    ];

    return (
        <div className={styles.grid}>
            {sections.map((section, idx) => (
                <div key={idx} className={styles.section}>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                    <div className={styles.cardList}>
                        {section.items.map((item, i) => (
                            <Link key={i} href={item.href} className={styles.card}>
                                <div className={styles.cardIcon}>
                                    <item.icon size={20} />
                                </div>
                                <div className={styles.cardBody}>
                                    <span className={styles.cardLabel}>{item.label}</span>
                                    {item.count !== undefined && (
                                        <span className={styles.cardSubtext}>{item.count} total items</span>
                                    )}
                                </div>
                                <ArrowRight size={16} className={styles.arrow} />
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
