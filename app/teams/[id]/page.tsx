'use client';

import { useState, use } from 'react';
import IssueCard from "@/components/IssueCard";
import CreateIssueModal from "@/components/CreateIssueModal";
import { ChevronLeft } from "lucide-react";
import Link from 'next/link';

export default function TeamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="container">
            <header style={{ marginBottom: '32px' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted-foreground)', fontSize: '13px', marginBottom: '12px' }}>
                    <ChevronLeft size={14} /> Back to Inbox
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Team: {id}</h1>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>
                            Management and issues for team {id}
                        </p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsModalOpen(true)}
                    >
                        + New Issue
                    </button>
                </div>
            </header>

            <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                No issues assigned specifically to this team yet.
            </div>

            <CreateIssueModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
