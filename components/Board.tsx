'use client';

import { useState, useEffect } from 'react';
import styles from './Board.module.css';
import IssueCard from './IssueCard';
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
    issues: any[];
}

interface BoardProps {
    initialColumns: Column[];
    onStatusChange: (issueId: number, statusId: string) => void;
    onCreateIssue: (statusId: string) => void;
}

export default function Board({ initialColumns, onStatusChange, onCreateIssue }: BoardProps) {
    const [columns, setColumns] = useState(initialColumns);

    // Sync state with props when filters change
    useEffect(() => {
        setColumns(initialColumns);
    }, [initialColumns]);

    // Simplified drag-and-drop simulation (real drag-and-drop would use dnd-kit)
    const handleMove = (issueId: number, fromColId: string, toColId: string) => {
        // Optimistic UI update
        const newCols = [...columns];
        const fromCol = newCols.find(c => c.id === fromColId);
        const toCol = newCols.find(c => c.id === toColId);

        if (fromCol && toCol) {
            const issueIndex = fromCol.issues.findIndex((i: any) => i.id === issueId.toString());
            if (issueIndex > -1) {
                const [issue] = fromCol.issues.splice(issueIndex, 1);
                issue.status = toCol.name;
                toCol.issues.push(issue);
                setColumns(newCols);
                onStatusChange(issueId, toColId);
            }
        }
    };

    return (
        <div className={styles.board}>
            {columns.map((column: Column) => (
                <div key={column.id} className={styles.column}>
                    <header className={styles.columnHeader}>
                        <div className={styles.columnInfo}>
                            <div className={styles.columnIcon}>
                                {getStatusIcon(column.name)}
                            </div>
                            <span className={styles.columnTitle}>{column.name}</span>
                            <span className={styles.count}>{column.issues.length}</span>
                        </div>
                        <button
                            className={styles.addBtn}
                            onClick={() => onCreateIssue(column.id)}
                        >
                            <Plus size={16} />
                        </button>
                    </header>

                    <div className={styles.issueList}>
                        {column.issues.map((issue: any) => (
                            <div key={issue.id} className={styles.draggableWrapper}>
                                <IssueCard {...issue} hideStatus />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
