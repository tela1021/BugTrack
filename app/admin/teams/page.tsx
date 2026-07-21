'use client';

import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createTeam, getAdminTeams } from '@/actions/teams';

type TeamSummary = {
    id: string;
    key: string;
    name: string;
    description: string | null;
    _count: { issues: number; members: number; projects: number };
};

export default function TeamsAdmin() {
    const [teams, setTeams] = useState<TeamSummary[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', key: '', description: '' });

    const loadTeams = async () => {
        setLoading(true);
        setTeams(await getAdminTeams());
        setLoading(false);
    };

    useEffect(() => { loadTeams(); }, []);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const result = await createTeam(form);
        if (!result.success) return;
        setForm({ name: '', key: '', description: '' });
        setIsCreating(false);
        await loadTeams();
    };

    return (
        <div className="container">
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', marginBottom: '24px' }}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Team Management</h1>
                    <p style={{ color: 'var(--muted-foreground)' }}>Teams own members, workflow and projects.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsCreating(!isCreating)}><Plus size={16} /> Create Team</button>
            </div>

            {isCreating && <form onSubmit={submit} className="glass" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '12px', padding: '16px', marginBottom: '20px' }}>
                <input className="input" placeholder="Team name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                <input className="input" placeholder="KEY" value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} required />
                <input className="input" placeholder="Description (optional)" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                <button className="btn btn-primary" type="submit">Create</button>
            </form>}

            {loading ? <div>Loading teams...</div> : teams.length === 0 ? <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>No teams created yet.</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {teams.map((team) => <Link key={team.id} href={`/teams/${team.id}`} className="glass" style={{ padding: '20px', textDecoration: 'none', color: 'inherit' }}>
                        <strong>{team.name}</strong> <span style={{ color: 'var(--muted-foreground)' }}>({team.key})</span>
                        <p style={{ color: 'var(--muted-foreground)', minHeight: '40px' }}>{team.description || 'No description'}</p>
                        <small>{team._count.members} members · {team._count.projects} projects · {team._count.issues} issues</small>
                    </Link>)}
                </div>
            )}
        </div>
    );
}
