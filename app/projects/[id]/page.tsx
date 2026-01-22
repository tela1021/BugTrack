'use client';

import { useState, use } from 'react';
import IssueCard from "@/components/IssueCard";
import CreateIssueModal from "@/components/CreateIssueModal";
import Board from "@/components/Board";
import { List, Layout, ChevronLeft } from "lucide-react";
import Link from 'next/link';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [view, setView] = useState<'list' | 'board'>('list');

    // Logic to fetch issues for specific project would go here
    // For now using mockup data filtered by ID or just showing mockup
    const issues = [
        { id: '1', title: 'Implement file upload with Supabase Storage', projectKey: id, number: 242, status: 'In Progress', priority: 'High', commentCount: 3, attachmentCount: 1 },
        { id: '2', title: 'Fix CSS layout issues on mobile', projectKey: id, number: 251, status: 'Todo', priority: 'Medium', commentCount: 0, attachmentCount: 0 },
    ];

    const boardColumns = [
        { id: 'todo', name: 'Todo', issues: issues.filter(i => i.status === 'Todo') },
        { id: 'in_progress', name: 'In Progress', issues: issues.filter(i => i.status === 'In Progress') },
        { id: 'done', name: 'Done', issues: issues.filter(i => i.status === 'Done') },
    ];

    return (
        <div className="container">
            <header style={{ marginBottom: '32px' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted-foreground)', fontSize: '13px', marginBottom: '12px' }}>
                    <ChevronLeft size={14} /> Back to Inbox
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Project: {id}</h1>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>
                            Viewing all tasks for {id}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div className="glass" style={{ display: 'flex', padding: '4px', borderRadius: '8px' }}>
                            <button
                                className={`btn ${view === 'list' ? 'btn-primary' : ''}`}
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => setView('list')}
                            >
                                <List size={14} />
                            </button>
                            <button
                                className={`btn ${view === 'board' ? 'btn-primary' : ''}`}
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => setView('board')}
                            >
                                <Layout size={14} />
                            </button>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsModalOpen(true)}
                        >
                            + New Issue
                        </button>
                    </div>
                </div>
            </header>

            {view === 'list' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {issues.map(issue => (
                        <IssueCard key={issue.id} {...issue} />
                    ))}
                </div>
            ) : (
                <Board
                    initialColumns={boardColumns}
                    onStatusChange={(id, status) => console.log('Status change:', id, status)}
                    onCreateIssue={() => setIsModalOpen(true)}
                />
            )}

            <CreateIssueModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
