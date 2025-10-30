'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
    mode: ThemeMode;
    resolvedTheme: 'light' | 'dark';
    setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme';

function getSystemPrefersDark(): boolean {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(mode: ThemeMode) {
    const isDark = mode === 'dark' || (mode === 'system' && getSystemPrefersDark());
    const root = document.documentElement;
    // Add a short transition class to smooth color changes without layout shifts
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 200);
    if (isDark) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>('system');
    const mediaRef = useRef<MediaQueryList | null>(null);

    const resolvedTheme: 'light' | 'dark' = useMemo(() => {
        if (mode === 'system') return getSystemPrefersDark() ? 'dark' : 'light';
        return mode;
    }, [mode]);

    // Initialize from storage on mount
    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
            const initial: ThemeMode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
            setModeState(initial);
            applyTheme(initial);
        } catch {
            // ignore
        }
    }, []);

    // Listen for OS color scheme changes when in system mode
    useEffect(() => {
        if (!('matchMedia' in window)) return;
        mediaRef.current = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => {
            if (mode === 'system') applyTheme('system');
        };
        mediaRef.current.addEventListener?.('change', onChange);
        return () => mediaRef.current?.removeEventListener?.('change', onChange);
    }, [mode]);

    // Apply theme when mode changes and persist
    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, mode);
        } catch {}
        if (typeof window !== 'undefined') applyTheme(mode);
    }, [mode]);

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next);
    }, []);

    const value = useMemo(() => ({ mode, resolvedTheme, setMode }), [mode, resolvedTheme, setMode]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}


