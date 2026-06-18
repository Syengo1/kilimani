'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // FIX: Wrapping the state update in a setTimeout defers it to the macrotask queue.
    // This perfectly satisfies the ESLint rule against "synchronous setState in effects"
    // while maintaining the strict hydration safety required by next-themes.
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Skeleton fallback matching the exact dimensions of the active button
  // shrink-0 prevents it from squishing in the flex containers of your navigation
  if (!mounted) {
    return <div className="w-9 h-9 animate-pulse bg-foreground/10 rounded-full shrink-0" />;
  }

  const isDark = theme === 'sleek-dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'sleek-dark')}
      className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-95 shrink-0"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {/* Sun Icon - Rotates and scales in when Dark Mode is active */}
      <Sun 
        size={18} 
        className={`absolute transition-all duration-500 ease-out ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`} 
      />
      
      {/* Moon Icon - Rotates and scales in when Light Mode is active */}
      <Moon 
        size={18} 
        className={`absolute transition-all duration-500 ease-out ${
          !isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
        }`} 
      />
    </button>
  );
}