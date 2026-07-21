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

type IssueDetail = NonNullable<Awaited<ReturnType<typeof getIssueByReadableId>>>;
type IssueMember = Awaited<ReturnType<typeof getUsers>>[number];
type IssueStatus = Awaited<ReturnType<typeof getStatuses>>[number];

export default function IssueDetailsPage({ params }: { params: Promise<{ readableId: string }> }) {
    const toast = useToast();
    const { readableId } = use(params);
    const [issue, setIssue] = useState<IssueDetail | null>(null);
    const [users, setUsers] = useState<IssueMember[]>([]);
    const [statuses, setStatuses] = useState<IssueStatus[]>([]);
    const [commentText, setCommentText] = useState('');
    const [commentFiles, setCommentFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const commentFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getIssueByReadableId(readableId).then(async (issueData) => {
            if (issueData) {
                setIssue(issueData);
                const [usersData, statusesData] = await Promise.all([
                    getUsers(issueData.team.key),
                    getStatuses(issueData.team.key),
                ]);
                setUsers(usersData);
                setStatuses(statusesData);
            }
            setLoading(false);
        });
    }, [readableId]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
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

    const refreshIssue = async () => {
        const updated = await getIssueByReadableId(readableId);
        setIssue(updated);
    };

    if (loading) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!issue) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Issue not found</div>;

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
                        <h1 className={styles.title}>{issue.title}</h1>
                    </header>

                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>Description</h3>
                        <div className={styles.description}>
                            {issue.description || <span className={styles.empty}>No description provided.</span>}
                        </div>
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
                                    <div className={styles.commentContent}>{comment.content}</div>

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
                            />

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
                            <span className={styles.priorityLabel}>{issue.priority}</span>
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
                                    <p>
                                        <strong>{h.actor.name}</strong> changed <strong>{h.field}</strong> from <span>{h.oldValue}</span> to <span>{h.newValue}</span>
                                    </p>
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
