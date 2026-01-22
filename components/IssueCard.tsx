import styles from './IssueCard.module.css';
import { BadgeAlert, MessageSquare, Paperclip } from 'lucide-react';
import Link from 'next/link';

interface IssueCardProps {
    id: string;
    title: string;
    projectKey: string;
    number: number;
    status: string;
    priority: string;
    commentCount?: number;
    attachmentCount?: number;
    hideStatus?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
}

export default function IssueCard({
    id,
    title,
    projectKey,
    number,
    status,
    priority,
    commentCount = 0,
    attachmentCount = 0,
    hideStatus = false,
    onDragStart
}: IssueCardProps) {
    const getPriorityColor = (p: string) => {
        switch (p.toUpperCase()) {
            case 'URGENT': return '#ef4444';
            case 'HIGH': return '#f97316';
            case 'MEDIUM': return '#eab308';
            case 'LOW': return '#3b82f6';
            default: return 'var(--muted-foreground)';
        }
    };

    const readableId = `${projectKey}-${number}`;

    return (
        <Link href={`/issues/${readableId}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div
                className={styles.card}
                draggable={!!onDragStart}
                onDragStart={onDragStart}
            >
                <div className={styles.header}>
                    <span className={styles.issueId}>{projectKey}-{number}</span>
                    {!hideStatus && <span className={styles.status}>{status}</span>}
                </div>
                <h4 className={styles.title}>{title}</h4>
                <div className={styles.footer}>
                    <div className={styles.left}>
                        <BadgeAlert size={14} color={getPriorityColor(priority)} />
                        <span className={styles.priority}>{priority}</span>
                    </div>
                    <div className={styles.right}>
                        {attachmentCount > 0 && (
                            <div className={styles.meta}>
                                <Paperclip size={14} />
                                <span>{attachmentCount}</span>
                            </div>
                        )}
                        {commentCount > 0 && (
                            <div className={styles.meta}>
                                <MessageSquare size={14} />
                                <span>{commentCount}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
