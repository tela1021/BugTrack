'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import IssueCard from "@/components/IssueCard";
const CreateIssueModal = dynamic(() => import("@/components/CreateIssueModal"), { ssr: false });
import Board from "@/components/Board";
import FiltersBar from "@/components/FiltersBar";
import { List, Layout } from "lucide-react";
import { getIssues } from "@/actions/issues";
import { getStatuses, updateIssue } from "@/actions/issue-details";
import type { IssueListItem, WorkflowStatusOption } from '@/types/view-models';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

const defaultFilters = {
  status: 'All',
  assignee: 'All',
  sort: 'newest',
  team: 'All',
  search: '',
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'list' | 'board'>('list');
  const [filters, setFilters] = useState(defaultFilters);
  const [issues, setIssues] = useState<IssueListItem[]>([]);
  const [statuses, setStatuses] = useState<WorkflowStatusOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    setLoading(true);
    const [issuesData, statusesData] = await Promise.all([
      getIssues(filters),
      getStatuses(filters.team)
    ]);
    setIssues(issuesData);
    setStatuses(statusesData);
    setLoading(false);
  };

  useEffect(() => {
    fetchIssues();
  }, [filters]);

  useEffect(() => {
    setFilters({
      status: searchParams.get('status') || defaultFilters.status,
      assignee: searchParams.get('assignee') || defaultFilters.assignee,
      sort: searchParams.get('sort') || defaultFilters.sort,
      team: searchParams.get('team') || defaultFilters.team,
      search: searchParams.get('search') || defaultFilters.search,
    });
  }, [searchParams]);

  const handleFilterChange = (nextFilters: typeof defaultFilters) => {
    setFilters(nextFilters);
    const params = new URLSearchParams();
    (Object.entries(nextFilters) as [keyof typeof defaultFilters, string][]).forEach(([key, value]) => {
      if (value && value !== defaultFilters[key]) params.set(key, value);
    });
    router.replace(params.size > 0 ? `/?${params.toString()}` : '/', { scroll: false });
  };

  const resetFilters = () => handleFilterChange(defaultFilters);

  const handleStatusChange = async (issueId: number, statusId: string): Promise<boolean> => {
    const result = await updateIssue(issueId, { statusId });
    if (result.success) {
      toast.success('Статус задачи обновлён');
      fetchIssues();
      return true;
    }
    toast.error(result.error || 'Не удалось обновить статус задачи');
    return false;
  };

  // Create columns based on fetched statuses
  const displayStatuses = [...statuses];

  // Also collect any statuses present on issues that are NOT in the official list
  issues.forEach(issue => {
    if (issue.status && !displayStatuses.some(s => s.name.toLowerCase() === issue.status.toLowerCase())) {
      displayStatuses.push({
        id: `dynamic-${issue.status}`,
        name: issue.status,
        position: 999 // Put at the end
      });
    }
  });

  const boardColumns = displayStatuses.map(status => ({
    id: status.id,
    name: status.name,
    issues: issues.filter(i => i.status?.toLowerCase() === status.name.toLowerCase())
  }));

  if (boardColumns.length === 0) {
    // Fallback if no statuses found
    boardColumns.push(
      { id: 'todo', name: 'Todo', issues: issues.filter(i => i.status === 'Todo') },
      { id: 'in_progress', name: 'In Progress', issues: issues.filter(i => i.status === 'In Progress') },
      { id: 'done', name: 'Done', issues: issues.filter(i => i.status === 'Done') }
    );
  }

  return (
    <div className="container">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>{view === 'list' ? 'Inbox' : 'Board'}</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>
            {view === 'list' ? 'All issues assigned to you' : 'Project BUG workflow'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="glass" style={{ display: 'flex', padding: '4px', borderRadius: '8px' }}>
            <button
              className={`btn ${view === 'list' ? 'btn-primary' : ''}`}
              style={{ padding: '4px 8px', fontSize: '12px' }}
              onClick={() => setView('list')}
              aria-label="Список задач"
              title="Список задач"
            >
              <List size={14} />
            </button>
            <button
              className={`btn ${view === 'board' ? 'btn-primary' : ''}`}
              style={{ padding: '4px 8px', fontSize: '12px' }}
              onClick={() => setView('board')}
              aria-label="Доска задач"
              title="Доска задач"
            >
              <Layout size={14} />
            </button>
          </div>
          <button
            className="btn btn-primary"
            style={{ height: '36px', padding: '0 16px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}
            onClick={() => setIsModalOpen(true)}
          >
            + New Issue
          </button>
        </div>
      </header>

      <FiltersBar
        activeFilters={filters}
        onFilterChange={handleFilterChange}
        statuses={displayStatuses}
      />

      {view === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>Loading...</div>
          ) : issues.length > 0 ? (
            issues.map(issue => (
              <IssueCard key={issue.id} {...issue} />
            ))
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
              <p>Нет задач по выбранным фильтрам.</p>
              <button type="button" className="btn glass" style={{ marginTop: '12px' }} onClick={resetFilters}>Сбросить фильтры</button>
            </div>
          )}
        </div>
      ) : (
        <Board
          initialColumns={boardColumns}
          onStatusChange={handleStatusChange}
          onCreateIssue={() => setIsModalOpen(true)}
        />
      )}

      <CreateIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchIssues();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
