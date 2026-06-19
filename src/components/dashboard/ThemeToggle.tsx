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

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  // THE MAGIC: Intercept the click and wrap it in the View Transition API
  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';

    // 1. Fallback for older browsers (like old versions of Safari)
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    // 2. Trigger the native browser curtain wipe
    document.startViewTransition(() => {
      // The browser freezes the screen, executes this change instantly, 
      // and then runs our wipe-down CSS animation to reveal it.
      setTheme(newTheme);
    });
  };

  return (
    <button
      onClick={handleThemeToggle}
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