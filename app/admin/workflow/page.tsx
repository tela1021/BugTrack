'use client';

import {
    ArrowLeft,
    Plus,
    GripVertical,
    Trash2,
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import styles from './Workflow.module.css';
import { useEffect, useState } from 'react';
import { getIssueFormData } from '@/actions/form-data';
import { getWorkflowStatuses, createStatus, deleteStatus } from '@/actions/workflow';

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'BACKLOG': return <AlertCircle size={16} />;
        case 'TODO': return <Circle size={16} />;
        case 'IN_PROGRESS': return <Clock size={16} />;
        case 'DONE': return <CheckCircle2 size={16} />;
        default: return <Circle size={16} />;
    }
};

export default function WorkflowAdmin() {
    const [statuses, setStatuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newStatusName, setNewStatusName] = useState('');

    useEffect(() => {
        setLoading(true);
        getWorkflowStatuses().then(data => {
            setStatuses(data);
            setLoading(false);
        });
    }, []);

    const handleAddStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStatusName.trim()) return;

        const result = await createStatus({
            name: newStatusName,
            type: 'TODO'
        });

        if (result.success) {
            setStatuses([...statuses, result.data]);
            setNewStatusName('');
        }
    };

    const handleDeleteStatus = async (id: string) => {
        if (confirm('Are you sure you want to delete this status?')) {
            const result = await deleteStatus(id);
            if (result.success) {
                setStatuses(statuses.filter(s => s.id !== id));
            } else {
                alert(`Error: ${result.error}`);
            }
        }
    };

    return (
        <div className="container">
            <Link href="/admin" className={styles.backLink}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Workflow Management</h1>
                    <p className={styles.subtitle}>Define and order the lifecycle of your issues globally across all projects</p>
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.statusList}>
                    {loading ? (
                        <div className={styles.loading}>Loading statuses...</div>
                    ) : (
                        statuses.map((status) => (
                            <div key={status.id} className={styles.statusItem}>
                                <div className={styles.dragHandle}>
                                    <GripVertical size={16} />
                                </div>
                                <div className={styles.statusIcon} style={{ color: status.color || '#454542' }}>
                                    {getTypeIcon(status.type)}
                                </div>
                                <div className={styles.statusInfo}>
                                    <span className={styles.statusName}>{status.name}</span>
                                    <span className={styles.statusType}>{status.type}</span>
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => handleDeleteStatus(status.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}

                    <form className={styles.addForm} onSubmit={handleAddStatus}>
                        <div className={styles.addInputWrapper}>
                            <Plus size={16} className={styles.plusIcon} />
                            <input
                                placeholder="New status name..."
                                value={newStatusName}
                                onChange={(e) => setNewStatusName(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Add</button>
                    </form>
                </div>

                <aside className={styles.guide}>
                    <div className="glass" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>How it works</h3>
                        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                            Statuses represent the stages an issue goes through from creation to completion.
                            Drag to reorder how they appear on the Kanban board.
                        </p>
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>Categories:</h4>
                            <ul style={{ fontSize: '12px', color: 'var(--muted-foreground)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertCircle size={14} /> Backlog - New or unrefined items
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Circle size={14} /> Todo - Ready for development
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={14} /> In Progress - Currently being worked on
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircle2 size={14} /> Done - Completed and verified
                                </li>
                            </ul>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
