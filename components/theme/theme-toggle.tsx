'use client';

import React from 'react';
import { useTheme } from '@/lib/contexts/theme-context';
import { Button } from '@/components/ui/button';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
    const { mode, setMode } = useTheme();

    const item = (value: 'light' | 'dark' | 'system', label: string, Icon: React.ComponentType<any>) => {
        const active = mode === value;
        return (
            <Button
                type="button"
                key={value}
                variant={active ? 'default' : 'ghost'}
                size="sm"
                aria-pressed={active}
                aria-label={`Use ${label} theme`}
                onClick={() => setMode(value)}
                className={cn('gap-2', active ? '' : 'text-muted-foreground')}
            >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
            </Button>
        );
    };

    return (
        <div className={cn('inline-flex items-center rounded-md border border-input bg-background p-0.5', className)} role="group" aria-label="Theme">
            {item('light', 'Light', Sun)}
            {item('dark', 'Dark', Moon)}
            {item('system', 'System', Monitor)}
        </div>
    );
}

export default ThemeToggle;


