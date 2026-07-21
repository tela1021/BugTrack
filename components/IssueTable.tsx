'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IssueListItem } from '@/types/view-models';
import styles from './IssueTable.module.css';

type SortKey = 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'priority_asc' | 'priority_desc' | 'updated_asc' | 'updated_desc';

interface IssueTableProps {
    issues: IssueListItem[];
    sort: SortKey;
    onSortChange: (sort: SortKey) => void;
    page: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    onPreviousPage: () => void;
    onNextPage: () => void;
}

const priorityLabels: Record<string, string> = {
    URGENT: 'Срочный', HIGH: 'Высокий', MEDIUM: 'Средний', LOW: 'Низкий', NONE: 'Без приоритета',
};

function SortButton({ label, currentSort, asc, desc, onSortChange }: {
    label: string;
    currentSort: SortKey;
    asc: SortKey;
    desc: SortKey;
    onSortChange: (sort: SortKey) => void;
}) {
    const active = currentSort === asc || currentSort === desc;
    return (
        <button type="button" className={styles.sortButton} onClick={() => onSortChange(currentSort === asc ? desc : asc)}>
            {label}<span aria-hidden="true">{active ? (currentSort === asc ? ' ↑' : ' ↓') : ' ↕'}</span>
        </button>
    );
}

export default function IssueTable({ issues, sort, onSortChange, page, hasPreviousPage, hasNextPage, onPreviousPage, onNextPage }: IssueTableProps) {
    const router = useRouter();
    const openIssue = (readableId: string) => router.push(`/issues/${readableId}`);
    const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, readableId: string) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openIssue(readableId);
    };

    return (
        <section className={styles.section} aria-label="Список задач">
            <div className={styles.scrollArea}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th><SortButton label="Название" currentSort={sort} asc="title_asc" desc="title_desc" onSortChange={onSortChange} /></th>
                            <th><SortButton label="Приоритет" currentSort={sort} asc="priority_asc" desc="priority_desc" onSortChange={onSortChange} /></th>
                            <th>Статус</th>
                            <th>Исполнитель</th>
                            <th>Метки</th>
                            <th>Проект</th>
                            <th><SortButton label="Обновлено" currentSort={sort} asc="updated_asc" desc="updated_desc" onSortChange={onSortChange} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {issues.map((issue) => (
                            <tr key={issue.id} className={styles.issueRow} tabIndex={0} onClick={() => openIssue(issue.readableId)} onKeyDown={(event) => handleRowKeyDown(event, issue.readableId)}>
                                <td><Link className={styles.issueId} href={`/issues/${issue.readableId}`}>{issue.readableId}</Link></td>
                                <td><Link className={styles.title} href={`/issues/${issue.readableId}`}>{issue.title}</Link></td>
                                <td><span className={`${styles.priority} ${styles[`priority${issue.priority.toUpperCase()}`] || ''}`}>{priorityLabels[issue.priority.toUpperCase()] || issue.priority}</span></td>
                                <td><span className={styles.status}>{issue.status}</span></td>
                                <td>{issue.assigneeName || 'Не назначен'}</td>
                                <td>
                                    <div className={styles.labels}>
                                        {issue.labels.length ? issue.labels.map((label) => <span key={label.id} className={styles.label} style={{ borderColor: label.color }}>{label.name}</span>) : '—'}
                                    </div>
                                </td>
                                <td>{issue.projectName || issue.projectKey}</td>
                                <td><time dateTime={issue.updatedAt}>{new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(issue.updatedAt))}</time></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <nav className={styles.pagination} aria-label="Пагинация задач">
                <span>Страница {page}</span>
                <div>
                    <button type="button" className="btn glass" onClick={onPreviousPage} disabled={!hasPreviousPage} aria-label="Предыдущая страница">Назад</button>
                    <button type="button" className="btn glass" onClick={onNextPage} disabled={!hasNextPage} aria-label="Следующая страница">Вперёд</button>
                </div>
            </nav>
        </section>
    );
}
