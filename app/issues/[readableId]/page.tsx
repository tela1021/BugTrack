'use client';

import { use, useEffect, useState, useRef } from 'react';
import { getIssueByReadableId, addComment, updateIssue, getUsers, getStatuses, addIssueAttachment } from '@/actions/issue-details';
import Link from 'next/link';
import {
    ChevronLeft,
    MessageSquare,
    Paperclip,
    History as HistoryIcon,
    Send,
    User as UserIcon,
    ChevronDown
} from 'lucide-react';
import styles from './IssueDetails.module.css';
import { useToast } from '@/components/ToastProvider';
import { addLabelToIssue, getAllLabels, removeLabelFromIssue } from '@/actions/labels';
import { getIssueFormData } from '@/actions/form-data';
import MarkdownPreview from '@/components/MarkdownPreview';
import { getIssues } from '@/actions/issues';
import type { IssueListItem } from '@/types/view-models';
import { addIssueLink, removeIssueLink } from '@/actions/issue-links';
import { IssueDetailSkeleton } from '@/components/Skeleton';

type IssueDetail = NonNullable<Awaited<ReturnType<typeof getIssueByReadableId>>>;
type IssueMember = Awaited<ReturnType<typeof getUsers>>[number];
type IssueStatus = Awaited<ReturnType<typeof getStatuses>>[number];
const fieldLabels: Record<string, string> = { created: 'создал задачу', title: 'название', description: 'описание', priority: 'приоритет', type: 'тип', status: 'статус', assignee: 'исполнителя', project: 'проект', cycle: 'цикл', parent: 'родительскую задачу', link: 'связь', comment: 'комментарий', attachment: 'вложение', deleted: 'состояние удаления' };

export default function IssueDetailsPage({ params }: { params: Promise<{ readableId: string }> }) {
    const toast = useToast();
    const { readableId } = use(params);
    const [issue, setIssue] = useState<IssueDetail | null>(null);
    const [users, setUsers] = useState<IssueMember[]>([]);
    const [statuses, setStatuses] = useState<IssueStatus[]>([]);
    const [availableLabels, setAvailableLabels] = useState<Awaited<ReturnType<typeof getAllLabels>>>([]);
    const [formData, setFormData] = useState<Awaited<ReturnType<typeof getIssueFormData>> | null>(null);
    const [teamIssues, setTeamIssues] = useState<IssueListItem[]>([]);
    const [commentText, setCommentText] = useState('');
    const [commentFiles, setCommentFiles] = useState<File[]>([]);
    const [editingDescription, setEditingDescription] = useState(false);
    const [descriptionDraft, setDescriptionDraft] = useState('');
    const [titleDraft, setTitleDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const commentFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getIssueByReadableId(readableId).then(async (issueData) => {
            if (issueData) {
                setIssue(issueData);
                setDescriptionDraft(issueData.description || '');
                setTitleDraft(issueData.title);
                const [usersData, statusesData, labelsData, formDataResult, teamIssuesData] = await Promise.all([
                    getUsers(issueData.team.key),
                    getStatuses(issueData.team.key),
                    getAllLabels(issueData.team.id),
                    getIssueFormData(),
                    getIssues({ team: issueData.team.key }),
                ]);
                setUsers(usersData);
                setStatuses(statusesData);
                setAvailableLabels(labelsData);
                setFormData(formDataResult);
                setTeamIssues(teamIssuesData);
            }
            setLoading(false);
        });
    }, [readableId]);

    const submitComment = async () => {
        if (!commentText.trim() && commentFiles.length === 0) return;
        if (!issue) return;

        const formData = new FormData();
        formData.append('content', commentText);
        commentFiles.forEach(file => formData.append('files', file));

        const res = await addComment(issue.id, formData);
        if (res.success) {
            setCommentText('');
            setCommentFiles([]);
            refreshIssue();
        }
    };
    const handleAddComment = async (e: React.FormEvent) => { e.preventDefault(); await submitComment(); };

    const handleIssueUpdate = async (data: { title?: string; description?: string; priority?: string; issueType?: string; projectId?: string | null; cycleId?: string | null; parentId?: number | null }) => {
        if (!issue) return;
        const result = await updateIssue(issue.id, data);
        if (result.success) { toast.success('Задача обновлена'); setEditingDescription(false); await refreshIssue(); }
        else toast.error(result.error || 'Не удалось обновить задачу');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !issue) return;

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));

        const res = await addIssueAttachment(issue.id, formData);
        if (res.success) {
            refreshIssue();
        } else {
            toast.error(res.error || 'Не удалось загрузить вложение');
        }

        // Reset input
        e.target.value = '';
    };

    const handleStatusChange = async (newStatusId: string) => {
        if (!issue) return;
        const res = await updateIssue(issue.id, { statusId: newStatusId });
        if (res.success) {
            toast.success('Статус обновлён');
            refreshIssue();
        } else toast.error(res.error || 'Не удалось обновить статус');
    };

    const handleAssigneeChange = async (newAssigneeId: string) => {
        if (!issue) return;
        const res = await updateIssue(issue.id, { assigneeId: newAssigneeId });
        if (res.success) {
            toast.success('Исполнитель обновлён');
            refreshIssue();
        } else toast.error(res.error || 'Не удалось обновить исполнителя');
    };
    const handleLabelAdd = async (labelId: string) => {
        if (!issue || !labelId) return;
        const result = await addLabelToIssue(issue.id, labelId);
        if (result.success) { toast.success('Метка добавлена'); await refreshIssue(); }
        else toast.error(result.error || 'Не удалось добавить метку');
    };
    const handleLabelRemove = async (labelId: string) => {
        if (!issue) return;
        const result = await removeLabelFromIssue(issue.id, labelId);
        if (result.success) { toast.success('Метка удалена'); await refreshIssue(); }
        else toast.error(result.error || 'Не удалось удалить метку');
    };
    const handleLinkAdd = async (targetId: string, relation: string) => {
        if (!issue || !targetId) return;
        const result = await addIssueLink(issue.id, { targetId: Number(targetId), relation });
        if (result.success) { toast.success('Связь добавлена'); await refreshIssue(); } else toast.error(result.error || 'Не удалось добавить связь');
    };
    const handleLinkRemove = async (linkId: string) => { const result = await removeIssueLink(linkId); if (result.success) { toast.success('Связь удалена'); await refreshIssue(); } else toast.error(result.error || 'Не удалось удалить связь'); };

    const refreshIssue = async () => {
        const updated = await getIssueByReadableId(readableId);
        setIssue(updated);
    };

    if (loading) return <div className="container"><IssueDetailSkeleton /></div>;
    if (!issue) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Issue not found</div>;

    const issueTeam = formData?.teams.find((team) => team.id === issue.teamId);
    const completedSubtasks = issue.children.filter((child) => child.status.type === 'DONE' || child.status.type === 'CANCELED').length;

    return (
        <div className="container">
            <Link href="/" className={styles.backLink}>
                <ChevronLeft size={16} /> Back to Inbox
            </Link>

            <div className={styles.grid}>
                <div className={styles.main}>
                    <header className={styles.header}>
                        <div className={styles.meta}>
                            <span className={styles.readableId}>{issue.readableId}</span>
                            <div className={styles.statusSelectWrapper}>
                                <select
                                    className={styles.statusSelect}
                                    value={issue.statusId}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                >
                                    {statuses.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={12} className={styles.statusChevron} />
                            </div>
                        </div>
                        <input className={styles.title} aria-label="Название задачи" value={titleDraft} onChange={(event) => setTitleDraft(event.target.value)} onBlur={() => titleDraft.trim() && titleDraft !== issue.title && void handleIssueUpdate({ title: titleDraft })} />
                    </header>

                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>Description <button type="button" className="btn glass" onClick={() => setEditingDescription(!editingDescription)}>Редактировать описание</button></h3>
                        {editingDescription ? <div><textarea className={styles.description} value={descriptionDraft} onChange={(event) => setDescriptionDraft(event.target.value)} /><button type="button" className="btn btn-primary" onClick={() => void handleIssueUpdate({ description: descriptionDraft })}>Сохранить</button></div> : issue.description ? <MarkdownPreview content={issue.description} className={styles.description} /> : <div className={styles.description}><span className={styles.empty}>No description provided.</span></div>}
                    </section>

                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                <Paperclip size={16} /> Attachments ({issue.attachments.length})
                                <button
                                    className="btn glass"
                                    style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '12px' }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    + Add
                                </button>
                                <input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </h3>
                        {issue.attachments.length > 0 ? (
                            <div className={styles.attachmentList} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                                {issue.attachments.map((file) => (
                                    <a
                                        key={file.id}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.attachmentCard}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '8px 12px', border: '1px solid var(--border)',
                                            borderRadius: '6px', textDecoration: 'none', color: 'inherit',
                                            background: 'var(--card)'
                                        }}
                                    >
                                        <Paperclip size={14} />
                                        <span style={{ fontSize: '13px' }}>{file.name}</span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.empty} style={{ marginTop: '8px' }}>No attachments.</div>
                        )}
                    </section>

                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <MessageSquare size={16} /> Comments ({issue.comments.length})
                        </h3>
                        <div className={styles.commentList}>
                            {issue.comments.map((comment) => (
                                <div key={comment.id} className={styles.comment}>
                                    <div className={styles.commentHeader}>
                                        <span className={styles.author}>{comment.author.name}</span>
                                        <span className={styles.date}>{new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    <MarkdownPreview content={comment.content} className={styles.commentContent} />

                                    {comment.attachments && comment.attachments.length > 0 && (
                                        <div className={styles.commentAttachments}>
                                            {comment.attachments.map((file) => (
                                                <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className={styles.smallAttachment}>
                                                    <Paperclip size={12} />
                                                    <span>{file.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <form className={styles.commentForm} onSubmit={handleAddComment}>
                            <textarea
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); void submitComment(); } }}
                            />
                            <small className={styles.empty}>Ctrl+Enter / Cmd+Enter — отправить</small>

                            {commentFiles.length > 0 && (
                                <div className={styles.previewStrip}>
                                    {commentFiles.map((f, i) => (
                                        <div key={i} className={styles.previewItem}>
                                            <Paperclip size={12} />
                                            <span>{f.name}</span>
                                            <button type="button" onClick={() => setCommentFiles(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={styles.commentActions}>
                                <button
                                    type="button"
                                    className="btn glass"
                                    onClick={() => commentFileInputRef.current?.click()}
                                >
                                    <Paperclip size={14} />
                                </button>
                                <input
                                    type="file"
                                    multiple
                                    ref={commentFileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setCommentFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                    }}
                                />
                                <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                                    <Send size={14} /> Send
                                </button>
                            </div>
                        </form>
                    </section>
                </div>

                <aside className={styles.sidebar}>
                    <div className={styles.sidebarBox}>
                        <h3 className={styles.sidebarTitle}>Details</h3>

                        <div className={styles.detailItem}>
                            <label>Assignee</label>
                            <div className={styles.selectWrapper}>
                                <UserIcon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 1, pointerEvents: 'none', color: 'var(--muted-foreground)' }} />
                                <select
                                    className={styles.sidebarSelect}
                                    value={issue.assigneeId || ''}
                                    onChange={(e) => handleAssigneeChange(e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.detailItem}>
                            <label>Priority</label>
                            <select className={styles.sidebarSelect} value={issue.priority} onChange={(event) => void handleIssueUpdate({ priority: event.target.value })}>
                                <option value="URGENT">Срочный</option><option value="HIGH">Высокий</option><option value="MEDIUM">Средний</option><option value="LOW">Низкий</option><option value="NONE">Без приоритета</option>
                            </select>
                        </div>
                        <div className={styles.detailItem}>
                            <label>Тип</label>
                            <select className={styles.sidebarSelect} value={issue.issueType} onChange={(event) => void handleIssueUpdate({ issueType: event.target.value })}>
                                <option value="TASK">Задача</option><option value="BUG">Ошибка</option><option value="FEATURE">Функция</option><option value="IMPROVEMENT">Улучшение</option>
                            </select>
                        </div>
                        <div className={styles.detailItem}>
                            <label>Проект</label>
                            <select className={styles.sidebarSelect} value={issue.projectId || ''} onChange={(event) => void handleIssueUpdate({ projectId: event.target.value || null })}>
                                <option value="">Без проекта</option>
                                {issueTeam?.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                            </select>
                        </div>
                        <div className={styles.detailItem}>
                            <label>Цикл</label>
                            <select className={styles.sidebarSelect} value={issue.cycleId || ''} onChange={(event) => void handleIssueUpdate({ cycleId: event.target.value || null })}>
                                <option value="">Без цикла</option>
                                {issueTeam?.cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
                            </select>
                        </div>
                        <div className={styles.detailItem}>
                            <label>Метки</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {issue.labels.map(({ label }) => <button type="button" className="btn glass" key={label.id} onClick={() => void handleLabelRemove(label.id)} title="Удалить метку">{label.name} ×</button>)}
                            </div>
                            <select className={styles.sidebarSelect} defaultValue="" aria-label="Добавить метку" onChange={(event) => { void handleLabelAdd(event.target.value); event.currentTarget.value = ''; }}>
                                <option value="">Добавить метку…</option>
                                {availableLabels.filter((label) => !issue.labels.some(({ label: current }) => current.id === label.id)).map((label) => <option key={label.id} value={label.id}>{label.name}</option>)}
                            </select>
                        </div>
                        <div className={styles.detailItem}>
                            <label>Родительская задача</label>
                            <select className={styles.sidebarSelect} value={issue.parentId || ''} onChange={(event) => void handleIssueUpdate({ parentId: event.target.value ? Number(event.target.value) : null })}>
                                <option value="">Нет родительской задачи</option>
                                {teamIssues.filter((candidate) => candidate.id !== issue.id.toString()).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.readableId}: {candidate.title}</option>)}
                            </select>
                            {issue.parent && <Link href={`/issues/${issue.parent.readableId}`}>{issue.parent.readableId}: {issue.parent.title}</Link>}
                        </div>
                        <div className={styles.detailItem}>
                            <label>Подзадачи</label>
                            {issue.children.length > 0 && <span>Прогресс подзадач: {completedSubtasks}/{issue.children.length}</span>}
                            {issue.children.length ? issue.children.map((child) => <Link key={child.id} href={`/issues/${child.readableId}`}>{child.readableId}: {child.title} · {child.status.name}</Link>) : <span className={styles.empty}>Подзадач пока нет.</span>}
                        </div>
                        <div className={styles.detailItem}>
                            <label>Связи задач</label>
                            {[...issue.outgoingLinks.map((link) => ({ id: link.id, relation: link.relation, readableId: link.target.readableId, title: link.target.title })), ...issue.incomingLinks.map((link) => ({ id: link.id, relation: `${link.relation} (входящая)`, readableId: link.source.readableId, title: link.source.title }))].map((link) => <div key={link.id}><button type="button" className="btn glass" title="Удалить связь" onClick={() => void handleLinkRemove(link.id)}>{link.relation} · {link.readableId} ×</button> {link.title}</div>)}
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}><select className={styles.sidebarSelect} defaultValue="" aria-label="Связать с задачей" onChange={(event) => { const [targetId, relation] = event.target.value.split(':'); void handleLinkAdd(targetId, relation); event.currentTarget.value = ''; }}><option value="">Добавить связь…</option>{(['BLOCKS', 'BLOCKED_BY', 'DUPLICATES', 'RELATES_TO'] as const).flatMap((relation) => teamIssues.filter((candidate) => candidate.id !== issue.id.toString()).map((candidate) => <option key={`${relation}-${candidate.id}`} value={`${candidate.id}:${relation}`}>{relation}: {candidate.readableId}</option>))}</select></div>
                        </div>
                        <div className={styles.detailItem}>
                            <label>Created</label>
                            <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className={styles.sidebarBox}>
                        <h3 className={styles.sidebarTitle}>
                            <HistoryIcon size={14} /> History
                        </h3>
                        <div className={styles.historyList}>
                            {issue.history.map((h) => (
                                <div key={h.id} className={styles.historyItem}>
                                    <p><strong>{h.actor.name}</strong> {h.field === 'created' ? 'создал(а) задачу' : h.field === 'comment' ? 'добавил(а) комментарий' : h.field === 'attachment' ? `добавил(а) вложение «${h.newValue}»` : <>изменил(а) {fieldLabels[h.field] || h.field}: <span>{h.oldValue || '—'}</span> → <span>{h.newValue || '—'}</span></>}</p>
                                    <span className={styles.date}>{new Date(h.createdAt).toLocaleTimeString()} {new Date(h.createdAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                            {issue.history.length === 0 && <span className={styles.empty}>No history yet.</span>}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
