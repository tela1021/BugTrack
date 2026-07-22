'use client';

import { useState, useEffect, useCallback } from 'react';
import IssueTable from "@/components/IssueTable";
import Board from "@/components/Board";
import FiltersBar from "@/components/FiltersBar";
import { List, Layout } from "lucide-react";
import { bulkUpdateIssues, getIssues, getIssuesPage } from "@/actions/issues";
import { getStatuses, updateIssue } from "@/actions/issue-details";
import { getIssueFormData } from '@/actions/form-data';
import type { IssueListItem, WorkflowStatusOption } from '@/types/view-models';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { CREATE_ISSUE_EVENT, ISSUE_CREATED_EVENT } from '@/lib/client-events';

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
  const [view, setView] = useState<'list' | 'board'>('list');
  const [filters, setFilters] = useState(defaultFilters);
  const [issues, setIssues] = useState<IssueListItem[]>([]);
  const [statuses, setStatuses] = useState<WorkflowStatusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [issueFormData, setIssueFormData] = useState<Awaited<ReturnType<typeof getIssueFormData>> | null>(null);
  const [bulkLabelIds, setBulkLabelIds] = useState<string[]>([]);
  const [confirmingLabelReplace, setConfirmingLabelReplace] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    const issuesRequest = view === 'board'
      ? getIssues(filters).then((items) => ({ issues: items, nextCursor: null }))
      : getIssuesPage(filters, currentCursor);
    const [issuesData, statusesData] = await Promise.all([
      issuesRequest,
      getStatuses(filters.team)
    ]);
    setIssues(issuesData.issues);
    setSelectedIssueIds([]);
    setNextCursor(issuesData.nextCursor);
    setStatuses(statusesData);
    setLoading(false);
  }, [currentCursor, filters, view]);

  useEffect(() => {
    void fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    void getIssueFormData().then(setIssueFormData).catch(() => setIssueFormData(null));
  }, []);

  useEffect(() => {
    setCurrentCursor(null);
    setCursorHistory([]);
    setFilters({
      status: searchParams.get('status') || defaultFilters.status,
      assignee: searchParams.get('assignee') || defaultFilters.assignee,
      sort: searchParams.get('sort') || defaultFilters.sort,
      team: searchParams.get('team') || defaultFilters.team,
      search: searchParams.get('search') || defaultFilters.search,
    });
  }, [searchParams]);

  useEffect(() => {
    setView(searchParams.get('view') === 'board' ? 'board' : 'list');
  }, [searchParams]);

  useEffect(() => {
    const refreshIssues = () => { void fetchIssues(); };
    window.addEventListener(ISSUE_CREATED_EVENT, refreshIssues);
    return () => window.removeEventListener(ISSUE_CREATED_EVENT, refreshIssues);
  }, [fetchIssues]);

  const handleFilterChange = (nextFilters: typeof defaultFilters) => {
    setCurrentCursor(null);
    setCursorHistory([]);
    setFilters(nextFilters);
    const params = new URLSearchParams(searchParams.toString());
    (Object.entries(nextFilters) as [keyof typeof defaultFilters, string][]).forEach(([key, value]) => {
      if (value && value !== defaultFilters[key]) params.set(key, value);
      else params.delete(key);
    });
    router.replace(params.size > 0 ? `/?${params.toString()}` : '/', { scroll: false });
  };

  const setViewInUrl = (nextView: 'list' | 'board') => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextView === 'board') params.set('view', 'board');
    else params.delete('view');
    router.replace(params.size > 0 ? `/?${params.toString()}` : '/', { scroll: false });
  };

  const openCreateIssue = () => window.dispatchEvent(new Event(CREATE_ISSUE_EVENT));

  const resetFilters = () => handleFilterChange(defaultFilters);

  const handleSortChange = (sort: typeof defaultFilters.sort) => handleFilterChange({ ...filters, sort });

  const goToNextPage = () => {
    if (!nextCursor) return;
    setCursorHistory((history) => [...history, currentCursor]);
    setCurrentCursor(nextCursor);
  };

  const goToPreviousPage = () => {
    if (cursorHistory.length === 0) return;
    const previousCursor = cursorHistory[cursorHistory.length - 1];
    setCursorHistory((history) => history.slice(0, -1));
    setCurrentCursor(previousCursor);
  };

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

  const handleSelectedIssueIdsChange = (issueIds: string[]) => {
    setSelectedIssueIds(issueIds);
    setBulkLabelIds([]);
    setConfirmingLabelReplace(false);
  };

  const selectedIssues = issues.filter((issue) => selectedIssueIds.includes(issue.id));
  const selectedTeamKeys = new Set(selectedIssues.map((issue) => issue.projectKey));
  const selectedTeam = selectedTeamKeys.size === 1
    ? issueFormData?.teams.find((team) => team.key === selectedIssues[0]?.projectKey)
    : undefined;
  const canBulkUpdate = selectedIssues.length === selectedIssueIds.length && selectedIssues.length > 0 && Boolean(selectedTeam);

  const handleBulkUpdate = async (data: { statusId?: string; assigneeId?: string | null; priority?: string; labelIds?: string[] }) => {
    if (!canBulkUpdate) {
      toast.error('Выберите задачи одной команды на текущей странице');
      return;
    }
    setBulkUpdating(true);
    const result = await bulkUpdateIssues({ issueIds: selectedIssueIds.map(Number), ...data });
    setBulkUpdating(false);
    if (!result.success) {
      toast.error(result.error || 'Не удалось массово изменить задачи');
      return;
    }
    const updatedCount = 'updatedCount' in result ? result.updatedCount ?? 0 : 0;
    toast.success(updatedCount > 0 ? `Изменено задач: ${updatedCount}` : 'Выбранные задачи уже содержат эти значения');
    setSelectedIssueIds([]);
    setBulkLabelIds([]);
    setConfirmingLabelReplace(false);
    void fetchIssues();
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
    wipLimit: status.wipLimit,
    issues: issues.filter(i => i.status?.toLowerCase() === status.name.toLowerCase())
  }));

  if (boardColumns.length === 0) {
    // Fallback if no statuses found
    boardColumns.push(
      { id: 'todo', name: 'Todo', wipLimit: null, issues: issues.filter(i => i.status === 'Todo') },
      { id: 'in_progress', name: 'In Progress', wipLimit: null, issues: issues.filter(i => i.status === 'In Progress') },
      { id: 'done', name: 'Done', wipLimit: null, issues: issues.filter(i => i.status === 'Done') }
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
              onClick={() => setViewInUrl('list')}
              aria-label="Список задач"
              title="Список задач"
            >
              <List size={14} />
            </button>
            <button
              className={`btn ${view === 'board' ? 'btn-primary' : ''}`}
              style={{ padding: '4px 8px', fontSize: '12px' }}
              onClick={() => setViewInUrl('board')}
              aria-label="Доска задач"
              title="Доска задач"
            >
              <Layout size={14} />
            </button>
          </div>
          <button
            className="btn btn-primary"
            style={{ height: '36px', padding: '0 16px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}
            onClick={openCreateIssue}
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
            <>
              {selectedIssueIds.length > 0 && (
                <section className="glass" aria-label="Массовые действия" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px' }}>
                  <strong>{selectedIssueIds.length} выбрано</strong>
                  {canBulkUpdate && selectedTeam ? (
                    <>
                      <select aria-label="Изменить статус выбранных задач" defaultValue="" disabled={bulkUpdating} onChange={(event) => event.target.value && void handleBulkUpdate({ statusId: event.target.value })}>
                        <option value="" disabled>Изменить статус…</option>
                        {selectedTeam.statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
                      </select>
                      <select aria-label="Изменить исполнителя выбранных задач" defaultValue="" disabled={bulkUpdating} onChange={(event) => event.target.value && void handleBulkUpdate({ assigneeId: event.target.value === '__unassigned__' ? null : event.target.value })}>
                        <option value="" disabled>Изменить исполнителя…</option>
                        <option value="__unassigned__">Не назначен</option>
                        {selectedTeam.members.map((member) => <option key={member.id} value={member.id}>{member.name || member.email}</option>)}
                      </select>
                      <select aria-label="Изменить приоритет выбранных задач" defaultValue="" disabled={bulkUpdating} onChange={(event) => event.target.value && void handleBulkUpdate({ priority: event.target.value })}>
                        <option value="" disabled>Изменить приоритет…</option>
                        <option value="URGENT">Срочный</option><option value="HIGH">Высокий</option><option value="MEDIUM">Средний</option><option value="LOW">Низкий</option><option value="NONE">Без приоритета</option>
                      </select>
                      <select aria-label="Метки для выбранных задач" multiple value={bulkLabelIds} disabled={bulkUpdating} onChange={(event) => { setBulkLabelIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value)); setConfirmingLabelReplace(false); }}>
                        {selectedTeam.labels.map((label) => <option key={label.id} value={label.id}>{label.name}</option>)}
                      </select>
                      {confirmingLabelReplace ? (
                        <>
                          <span style={{ color: 'var(--muted-foreground)' }}>Заменить метки у {selectedIssueIds.length} задач?</span>
                          <button type="button" className="btn btn-primary" disabled={bulkUpdating} onClick={() => void handleBulkUpdate({ labelIds: bulkLabelIds })}>Подтвердить замену меток</button>
                          <button type="button" className="btn glass" disabled={bulkUpdating} onClick={() => setConfirmingLabelReplace(false)}>Отмена</button>
                        </>
                      ) : <button type="button" className="btn glass" disabled={bulkUpdating} onClick={() => setConfirmingLabelReplace(true)}>Заменить метки</button>}
                    </>
                  ) : <span style={{ color: 'var(--muted-foreground)' }}>Для массового изменения выберите задачи одной команды.</span>}
                  <button type="button" className="btn glass" disabled={bulkUpdating} onClick={() => handleSelectedIssueIdsChange([])}>Снять выделение</button>
                </section>
              )}
              <IssueTable
                issues={issues}
                sort={filters.sort as Parameters<typeof IssueTable>[0]['sort']}
                onSortChange={handleSortChange}
                page={cursorHistory.length + 1}
                hasPreviousPage={cursorHistory.length > 0}
                hasNextPage={Boolean(nextCursor)}
                onPreviousPage={goToPreviousPage}
                onNextPage={goToNextPage}
                selectedIssueIds={selectedIssueIds}
                onSelectedIssueIdsChange={handleSelectedIssueIdsChange}
              />
            </>
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
          onCreateIssue={openCreateIssue}
        />
      )}
    </div>
  );
}
