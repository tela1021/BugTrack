'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IssueListItem } from '@/types/view-models';
import styles from './IssueTable.module.css';

type SortKey = 'newest' | 'oldest' | 'id_asc' | 'id_desc' | 'type_asc' | 'type_desc' | 'title_asc' | 'title_desc' | 'priority_asc' | 'priority_desc' | 'status_asc' | 'status_desc' | 'assignee_asc' | 'assignee_desc' | 'labels_asc' | 'labels_desc' | 'project_asc' | 'project_desc' | 'cycle_asc' | 'cycle_desc' | 'updated_asc' | 'updated_desc';
export type IssueColumn = 'id' | 'type' | 'title' | 'priority' | 'status' | 'assignee' | 'labels' | 'project' | 'cycle' | 'updatedAt';

interface IssueTableProps {
    issues: IssueListItem[];
    sort: SortKey;
    onSortChange: (sort: SortKey) => void;
    page: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    onPreviousPage: () => void;
    onNextPage: () => void;
    selectedIssueIds: string[];
    onSelectedIssueIdsChange: (issueIds: string[]) => void;
    visibleColumns: IssueColumn[];
    columnWidths?: Partial<Record<IssueColumn, number>>;
}

const priorityLabels: Record<string, string> = {
    URGENT: 'Срочный', HIGH: 'Высокий', MEDIUM: 'Средний', LOW: 'Низкий', NONE: 'Без приоритета',
};
const typeLabels: Record<string, string> = { TASK: 'Задача', BUG: 'Ошибка', FEATURE: 'Функция', IMPROVEMENT: 'Улучшение' };

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

export default function IssueTable({ issues, sort, onSortChange, page, hasPreviousPage, hasNextPage, onPreviousPage, onNextPage, selectedIssueIds, onSelectedIssueIdsChange, visibleColumns, columnWidths }: IssueTableProps) {
    const router = useRouter();
    const selectedIds = new Set(selectedIssueIds);
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
    const shiftKeyRef = useRef(false);
    const openIssue = (readableId: string) => router.push(`/issues/${readableId}`);
    const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, readableId: string) => {
        if (event.target instanceof HTMLElement && event.target.closest('a,button,input,select')) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openIssue(readableId);
    };
    const toggleIssue = (issueId: string, index: number, checked: boolean, shiftKey: boolean) => {
        const nextSelectedIds = new Set(selectedIssueIds);
        if (shiftKey && lastSelectedIndex !== null) {
            const [start, end] = [lastSelectedIndex, index].sort((left, right) => left - right);
            issues.slice(start, end + 1).forEach((issue) => checked ? nextSelectedIds.add(issue.id) : nextSelectedIds.delete(issue.id));
        } else if (checked) {
            nextSelectedIds.add(issueId);
        } else {
            nextSelectedIds.delete(issueId);
        }
        setLastSelectedIndex(index);
        onSelectedIssueIdsChange([...nextSelectedIds]);
    };
    const allOnPageSelected = issues.length > 0 && issues.every((issue) => selectedIds.has(issue.id));
    const togglePage = (checked: boolean) => {
        const nextSelectedIds = new Set(selectedIssueIds);
        issues.forEach((issue) => checked ? nextSelectedIds.add(issue.id) : nextSelectedIds.delete(issue.id));
        setLastSelectedIndex(null);
        onSelectedIssueIdsChange([...nextSelectedIds]);
    };
    const getColumnStyle = (column: IssueColumn) => columnWidths?.[column] ? { width: `${columnWidths[column]}px`, minWidth: `${columnWidths[column]}px` } : undefined;

    return (
        <section className={styles.section} aria-label="Список задач">
            <div className={styles.scrollArea}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th><input type="checkbox" aria-label="Выбрать все задачи на странице" checked={allOnPageSelected} onChange={(event) => togglePage(event.target.checked)} /></th>
                            {visibleColumns.includes('id') && <th style={getColumnStyle('id')}><SortButton label="ID" currentSort={sort} asc="id_asc" desc="id_desc" onSortChange={onSortChange} /></th>}{visibleColumns.includes('type') && <th style={getColumnStyle('type')}><SortButton label="Тип" currentSort={sort} asc="type_asc" desc="type_desc" onSortChange={onSortChange} /></th>}{visibleColumns.includes('title') && <th style={getColumnStyle('title')}><SortButton label="Название" currentSort={sort} asc="title_asc" desc="title_desc" onSortChange={onSortChange} /></th>}{visibleColumns.includes('priority') && <th style={getColumnStyle('priority')}><SortButton label="Приоритет" currentSort={sort} asc="priority_asc" desc="priority_desc" onSortChange={onSortChange} /></th>}{visibleColumns.includes('status') && <th style={getColumnStyle('status')}><SortButton label="Статус" currentSort={sort} asc="status_asc" desc="status_desc" onSortChange={onSortChange} /></th>}{visibleColumns.includes('assignee') && <th style={getColumnStyle('assignee')}><SortButton label="Исполнитель" currentSort={sort} asc="assignee_asc" desc="assignee_desc" onSortChange={onSortChange} /></th>}{visibleColumns.includes('labels') && <th style={getColumnStyle('labels')}><SortButton label="Метки" currentSort={sort} asc="labels_asc" desc="labels_desc" onSortChange={onSortChange} /></th>}{visibleColumns.includes('project') && <th style={getColumnStyle('project')}><SortButton label="Проект" currentSort={sort} asc="project_asc" desc="project_desc" onSortChange={onSortChange} /></th>}{visibleColumns.includes('cycle') && <th style={getColumnStyle('cycle')}><SortButton label="Цикл" currentSort={sort} asc="cycle_asc" desc="cycle_desc" onSortChange={onSortChange} /></th>}{visibleColumns.includes('updatedAt') && <th style={getColumnStyle('updatedAt')}><SortButton label="Обновлено" currentSort={sort} asc="updated_asc" desc="updated_desc" onSortChange={onSortChange} /></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {issues.map((issue, index) => (
                            <tr key={issue.id} className={styles.issueRow} tabIndex={0} onClick={() => openIssue(issue.readableId)} onKeyDown={(event) => handleRowKeyDown(event, issue.readableId)}>
                                <td className={styles.checkboxCell}><input type="checkbox" aria-label={`Выбрать задачу ${issue.readableId}`} checked={selectedIds.has(issue.id)} onClick={(event) => { event.stopPropagation(); shiftKeyRef.current = event.shiftKey; }} onChange={(event) => { toggleIssue(issue.id, index, event.target.checked, shiftKeyRef.current); shiftKeyRef.current = false; }} /></td>
                                {visibleColumns.includes('id') && <td><Link className={styles.issueId} href={`/issues/${issue.readableId}`}>{issue.readableId}</Link></td>}{visibleColumns.includes('type') && <td><span className={styles.status}>{typeLabels[issue.issueType] || issue.issueType}</span></td>}{visibleColumns.includes('title') && <td><Link className={styles.title} href={`/issues/${issue.readableId}`}>{issue.title}</Link></td>}
                                {visibleColumns.includes('priority') && <td><span className={`${styles.priority} ${styles[`priority${issue.priority.toUpperCase()}`] || ''}`}>{priorityLabels[issue.priority.toUpperCase()] || issue.priority}</span></td>}{visibleColumns.includes('status') && <td><span className={styles.status}>{issue.status}</span></td>}{visibleColumns.includes('assignee') && <td>{issue.assigneeName || 'Не назначен'}</td>}{visibleColumns.includes('labels') && <td>
                                    <div className={styles.labels}>
                                        {issue.labels.length ? issue.labels.map((label) => <span key={label.id} className={styles.label} style={{ borderColor: label.color }}>{label.name}</span>) : '—'}
                                    </div>
                                </td>}{visibleColumns.includes('project') && <td>{issue.projectName || issue.projectKey}</td>}{visibleColumns.includes('cycle') && <td>{issue.cycleName || '—'}</td>}{visibleColumns.includes('updatedAt') && <td><time dateTime={issue.updatedAt}>{new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(issue.updatedAt))}</time></td>}
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
