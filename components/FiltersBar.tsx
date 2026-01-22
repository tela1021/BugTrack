'use client';

import { Filter, User, ArrowDownUp, Folder, Search } from 'lucide-react';
import styles from './FiltersBar.module.css';
import { useEffect, useState } from 'react';
import { getIssueFormData } from '@/actions/form-data';

interface FiltersBarProps {
    onFilterChange: (filters: any) => void;
    activeFilters: {
        status: string;
        assignee: string;
        sort: string;
        team?: string;
        search?: string;
    };
    statuses?: any[];
}

export default function FiltersBar({ onFilterChange, activeFilters, statuses = [] }: FiltersBarProps) {
    const [teams, setTeams] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        getIssueFormData().then(({ teams, users }) => {
            setTeams(teams);
            setUsers(users);
        });
    }, []);

    const handleChange = (key: string, value: string) => {
        onFilterChange({ ...activeFilters, [key]: value });
    };

    return (
        <div className={styles.container}>
            <div className={styles.filterItem}>
                <Search size={14} className={styles.icon} />
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search issues..."
                    value={activeFilters.search || ''}
                    onChange={(e) => handleChange('search', e.target.value)}
                />
            </div>

            <div className={styles.separator} />

            <div className={styles.filterItem}>
                <Folder size={14} className={styles.icon} />
                <select
                    className={styles.select}
                    value={activeFilters.team || 'All'}
                    onChange={(e) => handleChange('team', e.target.value)}
                >
                    <option value="All">All Projects</option>
                    {teams.map(t => (
                        <option key={t.id} value={t.key}>{t.name} ({t.key})</option>
                    ))}
                </select>
            </div>

            <div className={styles.filterItem}>
                <Filter size={14} className={styles.icon} />
                <select
                    className={styles.select}
                    value={activeFilters.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    {statuses.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                </select>
            </div>

            <div className={styles.filterItem}>
                <User size={14} className={styles.icon} />
                <select
                    className={styles.select}
                    value={activeFilters.assignee}
                    onChange={(e) => handleChange('assignee', e.target.value)}
                >
                    <option value="All">All Assignees</option>
                    <option value="Me">Assigned to Me</option>
                    <option value="Unassigned">Unassigned</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>

            <div className={styles.separator} />

            <div className={styles.filterItem}>
                <ArrowDownUp size={14} className={styles.icon} />
                <select
                    className={styles.select}
                    value={activeFilters.sort}
                    onChange={(e) => handleChange('sort', e.target.value)}
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                </select>
            </div>
        </div>
    );
}
