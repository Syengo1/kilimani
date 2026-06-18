'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';

export type SortOption = 'featured' | 'price-asc' | 'price-desc';

interface DynamicIslandProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortOption: SortOption;
  setSortOption: (s: SortOption) => void;
}

type IslandState = 'idle' | 'search' | 'sort';

export default function DynamicIslandFilter({ searchQuery, setSearchQuery, sortOption, setSortOption }: DynamicIslandProps) {
  const [activeState, setActiveState] = useState<IslandState>('idle');
  const islandRef = useRef<HTMLDivElement>(null);

  // Close island if user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (islandRef.current && !islandRef.current.contains(event.target as Node)) {
        setActiveState('idle');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-4 md:top-6 z-50 flex justify-center w-full px-4 pointer-events-none">
      <motion.div
        ref={islandRef}
        layout
        initial={{ borderRadius: 32 }}
        className="bg-background/80 backdrop-blur-xl border border-border shadow-2xl overflow-hidden pointer-events-auto"
        style={{
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1), 0 0 20px -5px rgba(0,0,0,0.05)'
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          
          {/* STATE: IDLE (The Compact Pill) */}
          {activeState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.2 }}
              className="flex items-center px-2 py-2 gap-1"
            >
              <button 
                onClick={() => setActiveState('search')}
                className="flex items-center gap-2 px-4 py-2 hover:bg-foreground/5 rounded-full transition-colors text-sm font-medium text-foreground/80"
              >
                <Search size={16} /> 
                <span className="hidden sm:block">{searchQuery || 'Search'}</span>
              </button>
              <div className="w-[1px] h-4 bg-border" />
              <button 
                onClick={() => setActiveState('sort')}
                className="flex items-center gap-2 px-4 py-2 hover:bg-foreground/5 rounded-full transition-colors text-sm font-medium text-foreground/80"
              >
                <ArrowUpDown size={16} />
                <span className="hidden sm:block">Sort</span>
              </button>
            </motion.div>
          )}

          {/* STATE: SEARCH EXPANDED */}
          {activeState === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center p-2 w-[85vw] max-w-[400px]"
            >
              <Search size={18} className="text-muted-foreground ml-3 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm px-3 py-2 outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button onClick={() => setActiveState('idle')} className="p-2 hover:bg-foreground/5 rounded-full shrink-0 text-muted-foreground">
                <X size={18} />
              </button>
            </motion.div>
          )}

          {/* STATE: SORT EXPANDED */}
          {activeState === 'sort' && (
            <motion.div
              key="sort"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col p-2 w-[250px]"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sort By</span>
                <button onClick={() => setActiveState('idle')} className="p-1 hover:bg-foreground/5 rounded-full text-muted-foreground">
                  <X size={14} />
                </button>
              </div>
              
              {(['featured', 'price-asc', 'price-desc'] as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setSortOption(opt); setActiveState('idle'); }}
                  className={`text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                    sortOption === opt ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-foreground/5 text-foreground/80'
                  }`}
                >
                  {opt === 'featured' && 'Featured'}
                  {opt === 'price-asc' && 'Price: Low to High'}
                  {opt === 'price-desc' && 'Price: High to Low'}
                </button>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}