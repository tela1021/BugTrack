'use client';

import { useEffect, useState, use } from 'react';
import IssueCard from '@/components/IssueCard';
import CreateIssueModal from '@/components/CreateIssueModal';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getProjectById } from '@/actions/projects';
import { getIssues } from '@/actions/issues';
import type { IssueListItem } from '@/types/view-models';

type ProjectData = {
    id: string;
    name: string;
    description: string | null;
    teamId: string;
    team: { id: string; key: string; name: string };
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [project, setProject] = useState<ProjectData | null>(null);
    const [issues, setIssues] = useState<IssueListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const projectData = await getProjectById(id);
            if (projectData) {
                setProject(projectData);
                setIssues(await getIssues({ projectId: projectData.id }));
            }
            setLoading(false);
        };
        load();
    }, [id]);

    if (loading) return <div className="container">Loading project...</div>;
    if (!project) return <div className="container">Project not found.</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '32px' }}>
                <Link href={`/teams/${project.team.id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted-foreground)', fontSize: '13px', marginBottom: '12px' }}>
                    <ChevronLeft size={14} /> Back to {project.team.name}
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{project.name}</h1>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>{project.description || `Project in ${project.team.name}`}</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New Issue</button>
                </div>
            </header>

            {issues.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {issues.map((issue) => <IssueCard key={issue.id} {...issue} />)}
                </div>
            ) : <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>No issues in this project yet.</div>}

            <CreateIssueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialTeamKey={project.team.key} />
        </div>
    );
}
