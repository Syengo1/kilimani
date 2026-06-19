'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 animate-pulse bg-foreground/10 rounded-full shrink-0" />;
  }

  // 1. PERFECTED: Resolve 'system' so the button knows exactly what color is currently showing
  const currentTheme = theme === 'system' ? systemTheme : theme;
  
  // 2. FIXED: Use the industry standard 'dark' keyword required by Tailwind v4
  const isDark = currentTheme === 'dark';

  return (
    <button
      // 3. FIXED: Tell next-themes to explicitly set 'dark' or 'light'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-95 shrink-0"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <Sun 
        size={18} 
        className={`absolute transition-all duration-500 ease-out ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`} 
      />
      <Moon 
        size={18} 
        className={`absolute transition-all duration-500 ease-out ${
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`} 
      />
    </button>
  );
}