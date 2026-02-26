'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ThemeToggle({ isSidebarOpen = true }: { isSidebarOpen?: boolean }) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className={`w-full flex items-center ${isSidebarOpen ? 'px-5 justify-start' : 'justify-center'} py-3 rounded-xl text-sm font-bold transition-all text-muted-foreground`} disabled>
                <div className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="ml-4">Theme</span>}
            </button>
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`w-full flex items-center ${isSidebarOpen ? 'px-5 justify-start' : 'justify-center'} py-3 rounded-xl text-sm font-bold transition-all group text-muted-foreground hover:bg-muted hover:text-foreground`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            <div className="flex-shrink-0 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            {isSidebarOpen && <span className="ml-4">Theme: {isDark ? 'Dark' : 'Light'}</span>}
        </button>
    );
}
