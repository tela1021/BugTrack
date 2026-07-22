'use client';

import { useEffect, useState } from 'react';
import { getThemePreference, saveThemePreference, type ThemePreference as ThemeValue } from '@/actions/settings';

function applyTheme(preference: ThemeValue) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;
}

export default function ThemePreference() {
    const [theme, setTheme] = useState<ThemeValue>('system');

    useEffect(() => {
        void getThemePreference().then((preference) => {
            setTheme(preference);
            applyTheme(preference);
        });
    }, []);

    useEffect(() => {
        if (theme !== 'system') return;
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme('system');
        query.addEventListener('change', handleChange);
        return () => query.removeEventListener('change', handleChange);
    }, [theme]);

    const changeTheme = (nextTheme: ThemeValue) => {
        setTheme(nextTheme);
        applyTheme(nextTheme);
        void saveThemePreference(nextTheme);
    };

    return (
        <label>
            Тема
            <select value={theme} onChange={(event) => changeTheme(event.target.value as ThemeValue)}>
                <option value="system">Системная</option>
                <option value="light">Светлая</option>
                <option value="dark">Тёмная</option>
            </select>
        </label>
    );
}
