'use client';

import { ThemeToggle } from './ThemeToggle';

export function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-40 w-full h-16 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-serif font-bold tracking-wide text-foreground">Kilimani</h1>
      <ThemeToggle />
    </header>
  );
}