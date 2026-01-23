'use client';

import { useEffect, useState } from 'react';
import { getNotifications, markAsRead } from '@/actions/notifications';
import { Bell, Check, MessageSquare, History, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        const data = await getNotifications();
        setNotifications(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        const res = await markAsRead(id);
        if (res.success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'COMMENT': return <MessageSquare size={16} />;
            case 'STATUS_CHANGE': return <History size={16} />;
            case 'ASSIGNED': return <UserPlus size={16} />;
            default: return <Bell size={16} />;
        }
    };

    const getMessage = (n: any) => {
        const actorName = n.actor.name || 'Someone';
        const issueTitle = n.issue.title;
        switch (n.type) {
            case 'COMMENT': return `${actorName} commented on "${issueTitle}"`;
            case 'STATUS_CHANGE': return `${actorName} changed status of "${issueTitle}"`;
            case 'ASSIGNED': return `${actorName} assigned you to "${issueTitle}"`;
            default: return `${actorName} notified you about "${issueTitle}"`;
        }
    };

    if (loading) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Notifications</h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>Stay updated on your issues</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notifications.length > 0 ? (
                    notifications.map((n) => (
                        <div
                            key={n.id}
                            style={{
                                padding: '16px',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                background: n.read ? 'transparent' : 'var(--card)',
                                opacity: n.read ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '16px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{
                                padding: '10px',
                                borderRadius: '10px',
                                background: n.read ? 'var(--muted)' : 'var(--primary-muted)',
                                color: n.read ? 'var(--muted-foreground)' : 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {getIcon(n.type)}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <Link
                                        href={`/issues/${n.issue.readableId}`}
                                        style={{ textDecoration: 'none', color: 'inherit', fontWeight: n.read ? 500 : 700, fontSize: '15px' }}
                                    >
                                        {getMessage(n)}
                                    </Link>
                                    {!n.read && (
                                        <button
                                            onClick={() => handleMarkAsRead(n.id)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'var(--muted-foreground)'
                                            }}
                                            title="Mark as read"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                                    {new Date(n.createdAt).toLocaleString()} • {n.issue.readableId}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ padding: '80px 40px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '16px' }}>
                        <Bell size={48} style={{ color: 'var(--muted-foreground)', marginBottom: '16px', opacity: 0.3 }} />
                        <h3 style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>All caught up!</h3>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>No new notifications for you.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
