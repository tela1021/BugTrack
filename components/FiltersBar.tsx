'use client';

import { Filter, User, ArrowDownUp, Folder, Search, CalendarRange } from 'lucide-react';
import styles from './FiltersBar.module.css';
import { useEffect, useState } from 'react';
import { getIssueFormData } from '@/actions/form-data';
import type { UserOption, WorkflowStatusOption } from '@/types/view-models';

type IssueFilters = {
    status: string;
    assignee: string;
    sort: string;
    team: string;
    projectId: string;
    cycleId: string;
    labelId: string;
    priority: string;
    issueType: string;
    updated: string;
    search: string;
};

interface FiltersBarProps {
    onFilterChange: (filters: IssueFilters) => void;
    activeFilters: IssueFilters;
    statuses?: WorkflowStatusOption[];
}

export default function FiltersBar({ onFilterChange, activeFilters, statuses = [] }: FiltersBarProps) {
    const [teams, setTeams] = useState<Awaited<ReturnType<typeof getIssueFormData>>['teams']>([]);
    const [users, setUsers] = useState<UserOption[]>([]);

    useEffect(() => {
        getIssueFormData().then(({ teams, users }) => {
            setTeams(teams);
            setUsers(users);
        });
    }, []);

    const handleChange = (key: keyof IssueFilters, value: string) => {
        const nextFilters = { ...activeFilters, [key]: value };
        if (key === 'team') {
            nextFilters.projectId = '';
            nextFilters.cycleId = '';
            nextFilters.labelId = '';
        }
        onFilterChange(nextFilters);
    };

    const scopedTeams = activeFilters.team === 'All'
        ? teams
        : teams.filter((team) => team.key === activeFilters.team);
    const projects = scopedTeams.flatMap((team) => team.projects.map((project) => ({ ...project, teamName: team.name })));
    const cycles = scopedTeams.flatMap((team) => team.cycles.map((cycle) => ({ ...cycle, teamName: team.name })));
    const labels = scopedTeams.flatMap((team) => team.labels.map((label) => ({ ...label, teamName: team.name })));

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
                <Folder size={14} className={styles.icon} />
                <select
                    className={styles.select}
                    value={activeFilters.projectId}
                    onChange={(e) => handleChange('projectId', e.target.value)}
                    aria-label="Проект"
                >
                    <option value="">Все проекты</option>
                    {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                            {activeFilters.team === 'All' ? `${project.teamName}: ${project.name}` : project.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.filterItem}>
                <CalendarRange size={14} className={styles.icon} />
                <select
                    className={styles.select}
                    value={activeFilters.cycleId}
                    onChange={(e) => handleChange('cycleId', e.target.value)}
                    aria-label="Цикл"
                >
                    <option value="">Все циклы</option>
                    {cycles.map((cycle) => (
                        <option key={cycle.id} value={cycle.id}>
                            {activeFilters.team === 'All' ? `${cycle.teamName}: ${cycle.name}` : cycle.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.filterItem}>
                <Filter size={14} className={styles.icon} />
                <select className={styles.select} value={activeFilters.labelId} onChange={(e) => handleChange('labelId', e.target.value)} aria-label="Метка">
                    <option value="">Все метки</option>
                    {labels.map((label) => <option key={label.id} value={label.id}>{activeFilters.team === 'All' ? `${label.teamName}: ${label.name}` : label.name}</option>)}
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
            <div className={styles.filterItem}>
                <Filter size={14} className={styles.icon} />
                <select className={styles.select} value={activeFilters.priority} onChange={(e) => handleChange('priority', e.target.value)} aria-label="Приоритет">
                    <option value="All">Приоритет</option><option value="URGENT">Срочный</option><option value="HIGH">Высокий</option><option value="MEDIUM">Средний</option><option value="LOW">Низкий</option><option value="NONE">Без приоритета</option>
                </select>
            </div>
            <div className={styles.filterItem}>
                <Filter size={14} className={styles.icon} />
                <select className={styles.select} value={activeFilters.updated} onChange={(e) => handleChange('updated', e.target.value)} aria-label="Обновлены">
                    <option value="All">Обновлены: за всё время</option><option value="1d">За последние сутки</option><option value="7d">За 7 дней</option><option value="30d">За 30 дней</option>
                </select>
            </div>
            <div className={styles.filterItem}>
                <Filter size={14} className={styles.icon} />
                <select className={styles.select} value={activeFilters.issueType} onChange={(e) => handleChange('issueType', e.target.value)} aria-label="Тип задачи">
                    <option value="All">Все типы</option><option value="TASK">Задача</option><option value="BUG">Ошибка</option><option value="FEATURE">Функция</option><option value="IMPROVEMENT">Улучшение</option>
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
