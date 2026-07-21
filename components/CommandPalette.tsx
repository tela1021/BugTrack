'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { Command } from 'cmdk';
import { Search, Plus, List, Layout, Settings, FileText } from 'lucide-react';
import styles from './CommandPalette.module.css';
import { searchIssues } from '@/actions/search';
import { useRouter } from 'next/navigation';
import { CREATE_ISSUE_EVENT } from '@/lib/client-events';

type SearchResult = Awaited<ReturnType<typeof searchIssues>>[number];
const SEARCH_DEBOUNCE_MS = 200;
const GO_SHORTCUT_TIMEOUT_MS = 800;

function isEditableTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

function highlightMatch(value: string, query: string) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return value;
    const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return value.split(new RegExp(`(${escapedQuery})`, 'ig')).map((part, index) => (
        part.toLowerCase() === normalizedQuery.toLowerCase()
            ? <mark key={`${part}-${index}`}>{part}</mark>
            : <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    ));
}

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isPending, startTransition] = useTransition();
    const goShortcutTimeout = useRef<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        const down = (event: KeyboardEvent) => {
            if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                setOpen((open) => !open);
                return;
            }

            if (event.key === 'Escape') {
                setOpen(false);
                return;
            }

            if (open || isEditableTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

            const key = event.key.toLowerCase();
            if (key === '/') {
                event.preventDefault();
                setQuery('');
                setOpen(true);
                return;
            }
            if (key === 'c') {
                event.preventDefault();
                window.dispatchEvent(new Event(CREATE_ISSUE_EVENT));
                return;
            }
            if (key === 'g') {
                event.preventDefault();
                if (goShortcutTimeout.current) window.clearTimeout(goShortcutTimeout.current);
                goShortcutTimeout.current = window.setTimeout(() => {
                    goShortcutTimeout.current = null;
                }, GO_SHORTCUT_TIMEOUT_MS);
                return;
            }
            if (!goShortcutTimeout.current) return;

            window.clearTimeout(goShortcutTimeout.current);
            goShortcutTimeout.current = null;
            if (key === 'i') router.push('/');
            if (key === 'b') router.push('/?view=board');
            if (key === 'p') router.push('/admin/projects');
        };

        document.addEventListener('keydown', down);
        return () => {
            document.removeEventListener('keydown', down);
            if (goShortcutTimeout.current) window.clearTimeout(goShortcutTimeout.current);
        };
    }, [open, router]);

    useEffect(() => {
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
            setResults([]);
            return;
        }

        const timeoutId = window.setTimeout(() => {
            startTransition(async () => {
                const data = await searchIssues(normalizedQuery);
                setResults(data);
            });
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timeoutId);
    }, [query, startTransition]);

    const navigate = (path: string) => {
        setOpen(false);
        setQuery('');
        router.push(path);
    };

    const openCreateIssue = () => {
        setOpen(false);
        setQuery('');
        window.dispatchEvent(new Event(CREATE_ISSUE_EVENT));
    };

    const onSelectIssue = (readableId: string) => {
        navigate(`/issues/${readableId}`);
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Командная палитра"
            className={styles.dialog}
        >
            <div className={styles.container}>
                <Command.Input
                    placeholder="Команда или поиск задач…"
                    className={styles.input}
                    value={query}
                    onValueChange={setQuery}
                />

                <Command.List className={styles.list}>
                    {query && results.length === 0 && !isPending && (
                        <Command.Empty className={styles.empty}>Задачи не найдены.</Command.Empty>
                    )}

                    {results.length > 0 && (
                        <Command.Group heading="Задачи" className={styles.group}>
                            {results.map((issue) => (
                                <Command.Item
                                    key={issue.id}
                                    className={styles.item}
                                    onSelect={() => onSelectIssue(issue.readableId)}
                                >
                                    <FileText size={16} />
                                    <span>
                                        {highlightMatch(`${issue.readableId}: ${issue.title}`, query)}
                                        <small className={styles.context}>
                                            {issue.team.name}{issue.project ? ` · ${issue.project.name}` : ''}
                                        </small>
                                    </span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                    <Command.Group heading="Действия" className={styles.group}>
                        <Command.Item className={styles.item} onSelect={openCreateIssue}>
                            <Plus size={16} />
                            <span>Создать задачу</span>
                            <kbd className={styles.shortcut}>C</kbd>
                        </Command.Item>
                        <Command.Item className={styles.item} onSelect={() => setQuery('')}>
                            <Search size={16} />
                            <span>Искать задачи</span>
                            <kbd className={styles.shortcut}>/</kbd>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Навигация" className={styles.group}>
                        <Command.Item className={styles.item} onSelect={() => navigate('/')}>
                            <List size={16} />
                            <span>Список задач</span>
                            <kbd className={styles.shortcut}>G I</kbd>
                        </Command.Item>
                        <Command.Item className={styles.item} onSelect={() => navigate('/?view=board')}>
                            <Layout size={16} />
                            <span>Доска задач</span>
                            <kbd className={styles.shortcut}>G B</kbd>
                        </Command.Item>
                        <Command.Item className={styles.item} onSelect={() => navigate('/admin/projects')}>
                            <FileText size={16} />
                            <span>Проекты</span>
                            <kbd className={styles.shortcut}>G P</kbd>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Настройки" className={styles.group}>
                        <Command.Item className={styles.item} onSelect={() => navigate('/settings')}>
                            <Settings size={16} />
                            <span>Настройки</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </div>
        </Command.Dialog>
    );
}
