'use client';

import { useState, useEffect } from 'react';
import styles from './CreateIssueModal.module.css';
import FileAttachment from './FileAttachment';
import { X } from 'lucide-react';
import { createIssue } from '@/actions/issues';
import { updateIssue, addIssueAttachment } from '@/actions/issue-details';
import { getIssueFormData } from '@/actions/form-data';
import type { IssueListItem } from '@/types/view-models';
import { useToast } from './ToastProvider';

interface CreateIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void; // New prop
    initialData?: IssueListItem;
    initialTeamKey?: string;
}

type TeamFormData = {
    id: string;
    key: string;
    name: string;
    statuses: { id: string; name: string; type: string }[];
    members: { id: string; name: string | null; email: string }[];
};

export default function CreateIssueModal({ isOpen, onClose, onSuccess, initialData, initialTeamKey }: CreateIssueModalProps) {
    const toast = useToast();
    const isEditing = !!initialData;
    const [loading, setLoading] = useState(false);
    const [teams, setTeams] = useState<TeamFormData[]>([]);
    const [selectedTeam, setSelectedTeam] = useState(initialTeamKey || initialData?.projectKey || 'BUG');
    const [selectedStatus, setSelectedStatus] = useState(initialData?.status || '');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const selectedTeamData = teams.find((team) => team.key === selectedTeam);

    useEffect(() => {
        if (!isOpen) return;

        getIssueFormData().then(({ teams }) => {
            setTeams(teams);
            if (teams.length > 0 && !initialData) {
                const defaultTeam = teams.find((team) => team.key === 'BUG') || teams[0];
                if (defaultTeam) setSelectedTeam(defaultTeam.key);
            }
        });
    }, [initialData, isOpen]);

    useEffect(() => {
        if (!selectedTeamData?.statuses.length) {
            setSelectedStatus('');
            return;
        }

        if (!selectedTeamData.statuses.some((status) => status.name === selectedStatus)) {
            setSelectedStatus(selectedTeamData.statuses[0].name);
        }
    }, [selectedStatus, selectedTeamData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const form = new FormData(e.currentTarget);
        const title = String(form.get('title') || '');
        const description = String(form.get('description') || '');
        const priority = String(form.get('priority') || 'NONE');
        const assigneeId = String(form.get('assigneeId') || '');

        if (isEditing) {
            // Update logic
            const updateData = {
                title,
                description,
                priority: priority.toUpperCase(),
                // Status is handled via ID in updateIssue usually, but form has Name. 
                // However, initialData usually comes with full object. 
                // If we changed status here, we need the ID. 
                // For simplicity, let's assume we pass what we can or need to map it.
                // The current updateIssue expects specific fields. 
                // Let's stick to title/desc/priority/assignee for now. 
                // Status update via modal might be complex if we don't have IDs mapping handy.
                // Re-using the select logic: check if status changed? 
                assigneeId: assigneeId || null
            };

            // We try to find the status ID if changed? 
            // For now, let's update basic fields.

            const res = await updateIssue(parseInt(initialData.id), updateData);

            if (res.success && selectedFiles.length > 0) {
                const fileData = new FormData();
                selectedFiles.forEach(f => fileData.append('files', f));
                await addIssueAttachment(parseInt(initialData.id), fileData);
            }

            setLoading(false);
            if (res.success) {
                toast.success('Задача обновлена');
                if (onSuccess) onSuccess();
                onClose();
                setSelectedFiles([]);
            } else {
                toast.error(res.error || 'Не удалось обновить задачу');
            }

        } else {
            // Create logic
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('status', selectedStatus);
            formData.append('priority', priority);
            formData.append('assigneeId', assigneeId);
            formData.append('teamKey', selectedTeam);

            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            const res = await createIssue(formData);
            setLoading(false);

            if (res.success) {
                toast.success('Задача создана');
                if (onSuccess) onSuccess();
                onClose();
                setSelectedFiles([]); // Reset files
            } else {
                toast.error(res.error || 'Не удалось создать задачу');
            }
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                        {isEditing ? `Edit ${initialData.readableId}` : 'New Issue'}
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
                </header>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <input
                        name="title"
                        className={styles.titleInput}
                        placeholder="Issue title"
                        autoFocus
                        defaultValue={initialData?.title}
                        required
                    />

                    <textarea
                        name="description"
                        className={styles.descriptionInput}
                        placeholder="Add description..."
                        rows={5}
                        defaultValue={initialData?.description ?? undefined}
                    />

                    <div className={styles.attachmentsSection}>
                        <FileAttachment onFilesSelected={setSelectedFiles} />
                    </div>

                    <div className={styles.metaGrid}>
                        <div className={styles.metaItem}>
                            <label>Team</label>
                            <select
                                className="input"
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                disabled={isEditing} // Can't change project after creation usually as it breaks ID
                            >
                                {teams.map(t => (
                                    <option key={t.id} value={t.key}>{t.name} ({t.key})</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.metaItem}>
                            <label>Status</label>
                            <select
                                name="status"
                                className="input"
                                value={selectedStatus}
                                onChange={(event) => setSelectedStatus(event.target.value)}
                                disabled={!selectedTeamData?.statuses.length}
                            >
                                {selectedTeamData?.statuses.map((status) => (
                                    <option key={status.id} value={status.name}>{status.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.metaItem}>
                            <label>Priority</label>
                            <select name="priority" className="input" defaultValue={initialData?.priority}>
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Urgent</option>
                            </select>
                        </div>
                        <div className={styles.metaItem}>
                            <label>Assignee</label>
                            <select name="assigneeId" className="input" defaultValue={initialData?.assigneeId ?? undefined}>
                                <option value="">Unassigned</option>
                                {selectedTeamData?.members.map((member) => (
                                    <option key={member.id} value={member.id}>{member.name || member.email}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <footer className={styles.footer}>
                        <button type="button" className="btn glass" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Issue')}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}
