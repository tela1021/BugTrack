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
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getWorkflowStatuses, createStatus, deleteStatus, reorderWorkflowStatuses, updateStatus } from '@/actions/workflow';
import { getAdminTeams } from '@/actions/teams';
import { useToast } from '@/components/ToastProvider';

type TeamOption = {
    id: string;
    name: string;
    key: string;
};

type WorkflowStatus = {
    id: string;
    name: string;
    type: string;
    position: number;
    teamId: string | null;
    wipLimit: number | null;
    color?: string | null;
};

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'BACKLOG': return <AlertCircle size={16} />;
        case 'TODO': return <Circle size={16} />;
        case 'IN_PROGRESS': return <Clock size={16} />;
        case 'DONE': return <CheckCircle2 size={16} />;
        default: return <Circle size={16} />;
    }
};

type SortableStatusItemProps = {
    status: WorkflowStatus;
    disabled: boolean;
    onDelete: (id: string) => void;
    onWipLimitChange: (id: string, value: string) => void;
    onWipLimitSave: (status: WorkflowStatus) => void;
};

function SortableStatusItem({ status, disabled, onDelete, onWipLimitChange, onWipLimitSave }: SortableStatusItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: status.id,
        disabled
    });

    return (
        <div
            ref={setNodeRef}
            className={`${styles.statusItem} ${isDragging ? styles.statusItemDragging : ''}`}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            role="listitem"
        >
            <button
                type="button"
                className={styles.dragHandle}
                disabled={disabled}
                {...attributes}
                {...listeners}
                aria-label={`Изменить порядок статуса ${status.name}`}
            >
                <GripVertical size={16} />
            </button>
            <div className={styles.statusIcon} style={{ color: status.color || '#454542' }}>
                {getTypeIcon(status.type)}
            </div>
            <div className={styles.statusInfo}>
                <span className={styles.statusName}>{status.name}</span>
                <span className={styles.statusType}>{status.type}</span>
            </div>
            <label className={styles.wipControl}>
                <span>WIP-лимит</span>
                <input type="number" min="1" max="999" inputMode="numeric" aria-label={`WIP-лимит статуса ${status.name}`} value={status.wipLimit ?? ''} onChange={(event) => onWipLimitChange(status.id, event.target.value)} />
                <button type="button" className="btn glass" onClick={() => onWipLimitSave(status)}>Сохранить</button>
            </label>
            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => onDelete(status.id)}
                    aria-label={`Удалить статус ${status.name}`}
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

export default function WorkflowAdmin() {
    const toast = useToast();
    const [teams, setTeams] = useState<TeamOption[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [isReordering, setIsReordering] = useState(false);
    const [newStatusName, setNewStatusName] = useState('');
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        getAdminTeams().then(data => {
            setTeams(data);
            setSelectedTeamId(data[0]?.id ?? '');
        });
    }, []);

    useEffect(() => {
        if (!selectedTeamId) {
            setStatuses([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        getWorkflowStatuses(selectedTeamId).then(data => {
            setStatuses(data);
            setLoading(false);
        });
    }, [selectedTeamId]);

    const handleAddStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStatusName.trim()) return;

        const result = await createStatus({
            name: newStatusName,
            type: 'TODO',
            teamId: selectedTeamId
        });

        if (result.success && result.data) {
            setStatuses([...statuses, result.data]);
            setNewStatusName('');
            toast.success('Статус добавлен');
        } else {
            toast.error(result.error || 'Не удалось добавить статус');
        }
    };

    const handleDeleteStatus = async (id: string) => {
        if (confirm('Are you sure you want to delete this status?')) {
            const result = await deleteStatus(id);
            if (result.success) {
                setStatuses(statuses.filter(s => s.id !== id));
                toast.success('Статус удалён');
            } else {
                toast.error(result.error || 'Не удалось удалить статус');
            }
        }
    };

    const handleWipLimitChange = (id: string, value: string) => {
        const wipLimit = value === '' ? null : Number(value);
        setStatuses((current) => current.map((status) => status.id === id ? { ...status, wipLimit } : status));
    };

    const handleWipLimitSave = async (status: WorkflowStatus) => {
        const result = await updateStatus(status.id, { wipLimit: status.wipLimit });
        if (result.success) {
            toast.success('WIP-лимит сохранён');
        } else {
            toast.error(result.error || 'Не удалось сохранить WIP-лимит');
            void getWorkflowStatuses(selectedTeamId).then(setStatuses);
        }
    };

    const handleDragEnd = async ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id || isReordering) return;

        const previousStatuses = statuses;
        const oldIndex = previousStatuses.findIndex((status) => status.id === active.id);
        const newIndex = previousStatuses.findIndex((status) => status.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const reorderedStatuses = arrayMove(previousStatuses, oldIndex, newIndex).map((status, index) => ({
            ...status,
            position: index
        }));
        setStatuses(reorderedStatuses);
        setIsReordering(true);

        try {
            const result = await reorderWorkflowStatuses(selectedTeamId, reorderedStatuses.map((status) => status.id));
            if (result.success) {
                toast.success('Порядок статусов сохранён');
            } else {
                setStatuses(previousStatuses);
                toast.error(result.error || 'Не удалось сохранить порядок статусов');
            }
        } catch {
            setStatuses(previousStatuses);
            toast.error('Не удалось сохранить порядок статусов');
        } finally {
            setIsReordering(false);
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
                    <p className={styles.subtitle}>Define the lifecycle of issues for a selected team</p>
                </div>
                <div className={styles.teamSelector}>
                    <label htmlFor="workflow-team">Team</label>
                    <select
                        id="workflow-team"
                        className={styles.select}
                        value={selectedTeamId}
                        onChange={(event) => setSelectedTeamId(event.target.value)}
                        disabled={teams.length === 0 || isReordering}
                    >
                        {teams.length === 0 ? (
                            <option value="">No teams available</option>
                        ) : teams.map((team) => (
                            <option key={team.id} value={team.id}>
                                {team.name} ({team.key})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.statusList}>
                    {loading ? (
                        <div className={styles.loading}>Loading statuses...</div>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
                            <SortableContext items={statuses.map((status) => status.id)} strategy={verticalListSortingStrategy}>
                                <div className={styles.sortableList} role="list" aria-label="Порядок статусов">
                                    {statuses.map((status) => (
                                        <SortableStatusItem
                                            key={status.id}
                                            status={status}
                                            disabled={isReordering}
                                            onDelete={(id) => void handleDeleteStatus(id)}
                                            onWipLimitChange={handleWipLimitChange}
                                            onWipLimitSave={(item) => void handleWipLimitSave(item)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                    <p className={styles.reorderStatus} aria-live="polite">
                        {isReordering ? 'Сохраняем порядок…' : ''}
                    </p>

                    <form className={styles.addForm} onSubmit={handleAddStatus}>
                        <div className={styles.addInputWrapper}>
                            <Plus size={16} className={styles.plusIcon} />
                            <input
                                placeholder="New status name..."
                                value={newStatusName}
                                onChange={(e) => setNewStatusName(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={!selectedTeamId}>Add</button>
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
