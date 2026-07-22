'use client';

import { useState, useEffect } from 'react';
import styles from './Board.module.css';
import IssueCard from './IssueCard';
import type { IssueListItem } from '@/types/view-models';
import {
    Plus,
    Circle,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle
} from 'lucide-react';

const getStatusIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('backlog')) return <AlertCircle size={14} />;
    if (n.includes('todo')) return <Circle size={14} />;
    if (n.includes('progress')) return <Clock size={14} />;
    if (n.includes('done')) return <CheckCircle2 size={14} />;
    if (n.includes('cancel')) return <XCircle size={14} />;
    if (n.includes('review')) return <Clock size={14} style={{ opacity: 0.7 }} />;
    return <Circle size={14} />;
};

interface Column {
    id: string;
    name: string;
    wipLimit?: number | null;
    issues: IssueListItem[];
}

type PendingWipMove = { issueId: number; toStatusId: string; toStatusName: string; wipLimit: number };

interface BoardProps {
    initialColumns: Column[];
    onStatusChange: (issueId: number, statusId: string) => Promise<boolean>;
    onCreateIssue: (statusId: string) => void;
}

export default function Board({ initialColumns, onStatusChange, onCreateIssue }: BoardProps) {
    const [columns, setColumns] = useState(initialColumns);
    const [activeIssueId, setActiveIssueId] = useState<number | null>(null);
    const [pendingIssueId, setPendingIssueId] = useState<number | null>(null);
    const [pendingWipMove, setPendingWipMove] = useState<PendingWipMove | null>(null);

    // Sync state with props when filters change
    useEffect(() => {
        setColumns(initialColumns);
    }, [initialColumns]);

    const handleDragStart = (e: React.DragEvent, issueId: number) => {
        if (pendingIssueId !== null || pendingWipMove !== null) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('issueId', issueId.toString());
        setActiveIssueId(issueId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Required for drop
    };

    const moveIssue = async (issueId: number, toStatusId: string) => {
        // Find where the issue currently is
        let fromColId = '';
        columns.forEach(col => {
            if (col.issues.find(i => i.id === issueId.toString())) {
                fromColId = col.id;
            }
        });

        if (fromColId === toStatusId) return;

        // Preserve an immutable snapshot for a deterministic rollback.
        const previousColumns = columns.map((column) => ({ ...column, issues: [...column.issues] }));
        const newCols = columns.map((column) => ({ ...column, issues: [...column.issues] }));
        const fromCol = newCols.find(c => c.id === fromColId);
        const toCol = newCols.find(c => c.id === toStatusId);

        if (fromCol && toCol) {
            const issueIndex = fromCol.issues.findIndex((issue) => issue.id === issueId.toString());
            if (issueIndex > -1) {
                const [movedIssue] = fromCol.issues.splice(issueIndex, 1);
                const issue = { ...movedIssue, status: toCol.name };
                toCol.issues.push(issue);
                setColumns(newCols);
                setPendingIssueId(issueId);
                try {
                    const saved = await onStatusChange(issueId, toStatusId);
                    if (!saved) setColumns(previousColumns);
                } catch {
                    setColumns(previousColumns);
                } finally {
                    setPendingIssueId(null);
                }
            }
        }
    };

    const handleDrop = (e: React.DragEvent, toStatusId: string) => {
        e.preventDefault();
        const issueId = Number.parseInt(e.dataTransfer.getData('issueId'), 10);
        setActiveIssueId(null);
        if (Number.isNaN(issueId)) return;

        const toColumn = columns.find((column) => column.id === toStatusId);
        if (!toColumn) return;
        if (toColumn.issues.some((issue) => issue.id === issueId.toString())) return;
        if (toColumn.wipLimit !== null && toColumn.wipLimit !== undefined && toColumn.issues.length >= toColumn.wipLimit) {
            setPendingWipMove({ issueId, toStatusId, toStatusName: toColumn.name, wipLimit: toColumn.wipLimit });
            return;
        }
        void moveIssue(issueId, toStatusId);
    };

    return (
        <>
        <div className={styles.board}>
            {columns.map((column: Column) => {
                const isWipExceeded = column.wipLimit !== null && column.wipLimit !== undefined && column.issues.length > column.wipLimit;
                return (
                <div
                    key={column.id}
                    className={`${styles.column} ${isWipExceeded ? styles.wipExceeded : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                >
                    <header className={styles.columnHeader}>
                        <div className={styles.columnInfo}>
                            <div className={styles.columnIcon}>
                                {getStatusIcon(column.name)}
                            </div>
                            <span className={styles.columnTitle}>{column.name}</span>
                            <span className={styles.count}>{column.issues.length}</span>
                            {column.wipLimit !== null && column.wipLimit !== undefined && <span className={styles.wipCount} aria-label={`WIP-лимит ${column.wipLimit}`}>WIP {column.issues.length}/{column.wipLimit}</span>}
                        </div>
                        <button
                            className={styles.addBtn}
                            onClick={() => onCreateIssue(column.id)}
                            aria-label={`Создать задачу в статусе ${column.name}`}
                            title={`Создать задачу в статусе ${column.name}`}
                        >
                            <Plus size={16} />
                        </button>
                    </header>

                    <div className={styles.issueList}>
                        {column.issues.map((issue) => (
                            <div
                                key={issue.id}
                                className={`${styles.draggableWrapper} ${activeIssueId === parseInt(issue.id) || pendingIssueId === parseInt(issue.id) ? styles.dragging : ''}`}
                            >
                                <IssueCard
                                    {...issue}
                                    hideStatus
                                    onDragStart={(e) => handleDragStart(e, parseInt(issue.id))}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )})}
        </div>
        {pendingWipMove && (
            <section className={styles.wipDialog} role="alertdialog" aria-modal="true" aria-label="Превышен WIP-лимит">
                <strong>Превышен WIP-лимит</strong>
                <p>В колонке «{pendingWipMove.toStatusName}» уже {pendingWipMove.wipLimit} задач. Перенести ещё одну?</p>
                <div>
                    <button type="button" className="btn glass" onClick={() => setPendingWipMove(null)}>Отмена</button>
                    <button type="button" className="btn btn-primary" onClick={() => { const move = pendingWipMove; setPendingWipMove(null); void moveIssue(move.issueId, move.toStatusId); }}>Подтвердить перенос</button>
                </div>
            </section>
        )}
        </>
    );
}
