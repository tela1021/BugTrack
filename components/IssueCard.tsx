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
    issueType: string;
    assigneeName?: string | null;
    labels?: { id: string; name: string; color: string }[];
    createdAt?: string;
    ageDays?: number;
    commentCount?: number;
    attachmentCount?: number;
    hideStatus?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
}

export default function IssueCard({
    title,
    projectKey,
    number,
    status,
    priority,
    issueType,
    assigneeName,
    labels = [],
    ageDays,
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
                    <span className={styles.status}>{issueType === 'BUG' ? 'Ошибка' : issueType === 'FEATURE' ? 'Функция' : issueType === 'IMPROVEMENT' ? 'Улучшение' : 'Задача'}</span>
                    {!hideStatus && <span className={styles.status}>{status}</span>}
                </div>
                <h4 className={styles.title}>{title}</h4>
                {labels.length > 0 && <div className={styles.labels}>{labels.slice(0, 3).map((label) => <span key={label.id} style={{ borderColor: label.color }}>{label.name}</span>)}</div>}
                <div className={styles.footer}>
                    <div className={styles.left}>
                        <BadgeAlert size={14} color={getPriorityColor(priority)} />
                        <span className={styles.priority}>{priority}</span>
                    </div>
                    <div className={styles.right}>
                        {assigneeName && <span className={styles.assignee} title={assigneeName}>{assigneeName.slice(0, 1).toUpperCase()}</span>}
                        {ageDays !== undefined && <span className={styles.meta} aria-label={`Возраст задачи: ${ageDays} дн.`}>{ageDays} дн.</span>}
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
