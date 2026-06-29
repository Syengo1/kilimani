'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface POSSearchBarProps {
  query: string;
  setQuery: (val: string) => void;
}

export function POSSearchBar({ query, setQuery }: POSSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQuery('');
        inputRef.current?.blur(); // Drop keyboard on mobile
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setQuery]);

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
      <input 
        ref={inputRef}
        type="text"
        placeholder="Scan or type SKU, Name, etc. (Press ESC to clear)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-12 pr-12 py-3.5 bg-foreground/5 border border-border/50 rounded-2xl text-foreground font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/70"
      />
      {query && (
        <button 
          onClick={() => setQuery('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 bg-background rounded-full shadow-sm"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}