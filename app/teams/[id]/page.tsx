'use client';

import { useEffect, useState, use } from 'react';
import IssueCard from '@/components/IssueCard';
import CreateIssueModal from '@/components/CreateIssueModal';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getTeamById } from '@/actions/teams';
import { getIssues } from '@/actions/issues';
import type { IssueListItem } from '@/types/view-models';

type TeamData = {
    id: string;
    key: string;
    name: string;
    description: string | null;
    _count: { issues: number; members: number; projects: number };
};

export default function TeamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [team, setTeam] = useState<TeamData | null>(null);
    const [issues, setIssues] = useState<IssueListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const teamData = await getTeamById(id);
            if (teamData) {
                setTeam(teamData);
                setIssues(await getIssues({ team: teamData.key }));
            }
            setLoading(false);
        };
        load();
    }, [id]);

    if (loading) return <div className="container">Loading team...</div>;
    if (!team) return <div className="container">Team not found.</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '32px' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted-foreground)', fontSize: '13px', marginBottom: '12px' }}>
                    <ChevronLeft size={14} /> Back to Inbox
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{team.name}</h1>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>
                            {team.description || `${team._count.members} members · ${team._count.projects} projects`}
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New Issue</button>
                </div>
            </header>

            {issues.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {issues.map((issue) => <IssueCard key={issue.id} {...issue} />)}
                </div>
            ) : <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>No issues in this team yet.</div>}

            <CreateIssueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialTeamKey={team.key} />
        </div>
    );
}
