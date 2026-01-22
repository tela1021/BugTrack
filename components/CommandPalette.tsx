'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Command } from 'cmdk';
import { Search, Plus, List, Layout, Settings, FileText } from 'lucide-react';
import styles from './CommandPalette.module.css';
import { searchIssues } from '@/actions/search';
import { useRouter } from 'next/navigation';

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        if (query.trim()) {
            startTransition(async () => {
                const data = await searchIssues(query);
                setResults(data);
            });
        } else {
            setResults([]);
        }
    }, [query]);

    const onSelectIssue = (readableId: string) => {
        setOpen(false);
        router.push(`/issues/${readableId}`);
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className={styles.dialog}
        >
            <div className={styles.container}>
                <Command.Input
                    placeholder="Type a command or search issues..."
                    className={styles.input}
                    value={query}
                    onValueChange={setQuery}
                />

                <Command.List className={styles.list}>
                    {query && results.length === 0 && !isPending && (
                        <Command.Empty className={styles.empty}>No results found.</Command.Empty>
                    )}

                    {results.length > 0 && (
                        <Command.Group heading="Issues" className={styles.group}>
                            {results.map((issue) => (
                                <Command.Item
                                    key={issue.id}
                                    className={styles.item}
                                    onSelect={() => onSelectIssue(issue.readableId)}
                                >
                                    <FileText size={16} />
                                    <span>{issue.readableId}: {issue.title}</span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                    <Command.Group heading="Suggestions" className={styles.group}>
                        <Command.Item className={styles.item} onSelect={() => setOpen(false)}>
                            <Plus size={16} />
                            <span>Create Issue</span>
                            <kbd className={styles.shortcut}>C</kbd>
                        </Command.Item>
                        <Command.Item className={styles.item}>
                            <Search size={16} />
                            <span>Search Issues</span>
                            <kbd className={styles.shortcut}>S</kbd>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Navigation" className={styles.group}>
                        <Command.Item className={styles.item} onSelect={() => { setOpen(false); router.push('/'); }}>
                            <List size={16} />
                            <span>Go to Inbox</span>
                        </Command.Item>
                        <Command.Item className={styles.item}>
                            <Layout size={16} />
                            <span>Go to Board</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Settings" className={styles.group}>
                        <Command.Item className={styles.item}>
                            <Settings size={16} />
                            <span>Settings</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </div>
        </Command.Dialog>
    );
}
