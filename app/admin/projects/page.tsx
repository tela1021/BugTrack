'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Folder, Calendar, MoreVertical, Loader2 } from 'lucide-react';
import Link from 'next/link';
import styles from './Projects.module.css';
import { getProjects, createProject, updateProject } from '@/actions/projects';

export default function ProjectsAdmin() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        const data = await getProjects();
        setProjects(data);
        setLoading(false);
    };

    const openCreateModal = () => {
        setEditingProject(null);
        setFormData({ name: '', description: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (project: any) => {
        setEditingProject(project);
        setFormData({ name: project.name, description: '' }); // Description not fetched in list but okay for now
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        let res;
        if (editingProject) {
            res = await updateProject(editingProject.id, { name: formData.name, description: formData.description });
        } else {
            res = await createProject(formData.name, formData.description);
        }

        if (res.success) {
            await loadProjects();
            setIsModalOpen(false);
        } else {
            alert('Failed to save project: ' + res.error);
        }
    };

    return (
        <div className="container">
            <Link href="/admin" className={styles.backLink}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Projects</h1>
                    <p className={styles.subtitle}>Manage your organization's projects</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={16} /> New Project
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" size={24} />
                </div>
            ) : projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>
                    No projects found. Create one to get started.
                </div>
            ) : (
                <div className={styles.grid}>
                    {projects.map(project => (
                        <div key={project.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.projectIcon}>
                                    <Folder size={20} />
                                </div>
                                <button className={styles.moreBtn} onClick={() => openEditModal(project)} title="Edit Project">
                                    <MoreVertical size={16} />
                                </button>
                            </div>

                            <h3 className={styles.projectName}>{project.name}</h3>
                            <span className={styles.projectKey}>{project.key}</span>

                            <div className={styles.stats}>
                                <div className={styles.statItem}>
                                    <span className={styles.statValue}>{project.issues}</span>
                                    <span className={styles.statLabel}>Issues</span>
                                </div>
                                <div className={styles.statItem}>
                                    <Calendar size={14} />
                                    <span className={styles.statLabel}>{new Date(project.created).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
                }} onClick={() => setIsModalOpen(false)}>
                    <div className="glass" style={{ width: '400px', padding: '24px', background: 'var(--card)' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 600 }}>
                            {editingProject ? 'Edit Project' : 'Create New Project'}
                        </h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600 }}>Project Name</label>
                                <input
                                    className="input"
                                    placeholder="e.g. Website Redesign"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600 }}>Description</label>
                                <textarea
                                    className="input"
                                    placeholder="Optional description..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                                <button type="button" className="btn glass" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingProject ? 'Save Changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
