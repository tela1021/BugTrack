'use client';

import { ArrowLeft, Plus, Settings2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function TeamsAdmin() {
    const [teams, setTeams] = useState([
        { id: '1', key: 'BUG', name: 'Core Engineering', description: 'Main development team' },
        { id: '2', key: 'UI', name: 'UI Library', description: 'Design system team' },
    ]);

    return (
        <div className="container">
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', marginBottom: '24px' }}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Team Management</h1>
                <button className="btn btn-primary"><Plus size={16} /> Create Team</button>
            </div>

            <div className={styles.teamGrid}>
                {teams.map(team => (
                    <div key={team.id} className="glass" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <span style={{ background: 'var(--muted)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{team.key}</span>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{team.name}</h3>
                            </div>
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: 0 }}>{team.description}</p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn glass" style={{ padding: '8px' }} title="Workflow Settings">
                                <Settings2 size={16} />
                            </button>
                            <button className="btn glass" style={{ padding: '8px', color: 'var(--destructive)' }} title="Delete Team">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Inline styles for simplicity in this admin mock
const styles = {
    teamGrid: 'teamGrid' // Will be handled by global or specific css
};
