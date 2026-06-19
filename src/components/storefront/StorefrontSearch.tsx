'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StorefrontSearch() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close search if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    router.push(`/search?q=${encodeURIComponent(query)}`);
    // Reset after navigation
    setTimeout(() => {
      setIsSearching(false);
      setIsExpanded(false);
    }, 500);
  };

  return (
    <div ref={containerRef} className="relative flex items-center justify-end z-50">
      <motion.div
        layout
        initial={false}
        animate={{
          width: isExpanded ? (window.innerWidth < 768 ? 'calc(100vw - 120px)' : '300px') : '40px',
          backgroundColor: isExpanded ? 'var(--input-bg, rgba(0,0,0,0.05))' : 'transparent',
        }}
        className={`flex items-center overflow-hidden rounded-full h-10 ${
          isExpanded ? 'border border-border backdrop-blur-md shadow-inner bg-foreground/5' : ''
        }`}
      >
        <button
          onClick={handleExpand}
          type="button"
          className="flex items-center justify-center h-full w-10 shrink-0 text-foreground/70 hover:text-foreground transition-colors outline-none"
          aria-label="Search"
        >
          <Search size={20} strokeWidth={1.5} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSearch}
              className="flex items-center flex-1 pr-2 h-full"
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search premium collections..."
                className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              {isSearching ? (
                <Loader2 size={16} className="animate-spin text-muted-foreground ml-2 shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}