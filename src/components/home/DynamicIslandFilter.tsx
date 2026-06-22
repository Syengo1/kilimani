'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal, ChevronDown, Check, LayoutGrid, Columns3 } from 'lucide-react';

export type SortOption = 'featured' | 'price-asc' | 'price-desc';

export interface DynamicIslandProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  sortOption: SortOption;
  setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;
  cardWidth: number;
  setCardWidth: (value: number | ((val: number) => number)) => void;
}

// Apple-tier physics for the liquid layout morphing
const islandSpring = {
  type: "spring",
  stiffness: 400,
  damping: 30,
} as const;;

export default function DynamicIslandFilter({
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  cardWidth,
  setCardWidth
}: DynamicIslandProps) {
  // Island Layout States
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Performance Search State
  const [localSearch, setLocalSearch] = useState(searchQuery);
  
  const islandRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external search clears
  useEffect(() => {
    const timer = setTimeout(() => setLocalSearch(searchQuery), 0);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce Engine
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== localSearch) {
        setSearchQuery(localSearch);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery, searchQuery]);

  // The "Not In Use" Auto-Collapse Engine
  useEffect(() => {
    function handleInteractOutside(event: MouseEvent | TouchEvent) {
      if (islandRef.current && !islandRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setIsSortOpen(false);
      }
    }
    
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (isSortOpen) setIsSortOpen(false);
        else setIsExpanded(false);
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleInteractOutside);
      document.addEventListener('touchstart', handleInteractOutside, { passive: true });
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleInteractOutside);
      document.removeEventListener('touchstart', handleInteractOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isExpanded, isSortOpen]);

  // Auto-focus the search bar when the island expands
  useEffect(() => {
    if (isExpanded && !isSortOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded, isSortOpen]);

  const handleClearSearch = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent closing the island when clearing
    setLocalSearch('');
    setSearchQuery('');
    inputRef.current?.focus();
  }, [setSearchQuery]);

  const sortLabels: Record<SortOption, string> = {
    'featured': 'Featured',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low'
  };

  const hasActiveFilters = localSearch.trim() !== '' || sortOption !== 'featured';

  return (
    <div className="flex justify-center w-full px-2">
      <motion.div
        layout
        ref={islandRef}
        transition={islandSpring}
        onClick={() => !isExpanded && setIsExpanded(true)}
        className={`relative overflow-hidden bg-background/95 backdrop-blur-xl border shadow-[0_12px_40px_rgb(0,0,0,0.08)] mx-auto ${
          isExpanded 
            ? 'w-full max-w-4xl p-2 md:p-2.5 rounded-3xl md:rounded-full' 
            : 'w-[140px] h-[44px] rounded-full cursor-pointer hover:bg-foreground/[0.03]'
        } ${
          hasActiveFilters && !isExpanded 
            ? 'border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)]' 
            : 'border-border/60'
        }`}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* ============================================================== */
            /* 1. COLLAPSED RESTING STATE (The "True" Dynamic Island)         */
            /* ============================================================== */
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="flex items-center justify-center gap-3 w-full h-full text-muted-foreground"
            >
              <Search size={16} strokeWidth={2.5} />
              <div className="w-[1px] h-4 bg-border/60" />
              <SlidersHorizontal size={16} strokeWidth={2.5} />
              
              {/* Notification Dot for Active Memory */}
              {hasActiveFilters && (
                <span className="absolute top-2.5 right-3 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </motion.div>
          ) : (
            /* ============================================================== */
            /* 2. EXPANDED CONTROL CENTER STATE                               */
            /* ============================================================== */
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="flex flex-col w-full"
            >
              {/* Main Controls Row */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4">
                
                {/* Search Bar */}
                <div className="relative flex-1 group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search collections, textures..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full bg-foreground/[0.03] hover:bg-foreground/[0.05] focus:bg-foreground/[0.04] border border-transparent rounded-full py-3 pl-11 pr-10 text-sm outline-none transition-all duration-300 placeholder:text-muted-foreground/70"
                  />
                  {localSearch && (
                    <button 
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground active:scale-95 transition-all"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </div>

                {/* Desktop & Sort Controls */}
                <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 px-2 md:px-0">
                  
                  {/* Memory Grid Slider (Desktop Only) */}
                  <div className="hidden md:flex items-center gap-3 px-4 border-l border-border/50">
                    <LayoutGrid size={16} className="text-muted-foreground shrink-0" />
                    <input
                      type="range"
                      min="160"
                      max="400"
                      step="10"
                      value={cardWidth}
                      onChange={(e) => setCardWidth(Number(e.target.value))}
                      className="w-24 h-1.5 bg-border/50 rounded-full appearance-none cursor-pointer accent-foreground hover:accent-primary focus:outline-none transition-all"
                    />
                    <Columns3 size={16} className="text-muted-foreground shrink-0" />
                  </div>

                  <div className="hidden md:block h-6 w-[1px] bg-border/50" />

                  {/* Native Sort Trigger */}
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 active:scale-95 ${
                      isSortOpen || sortOption !== 'featured'
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                    }`}
                  >
                    <SlidersHorizontal size={16} className={isSortOpen || sortOption !== 'featured' ? 'text-primary' : ''} />
                    <span className="hidden sm:inline whitespace-nowrap">{sortLabels[sortOption]}</span>
                    <span className="sm:hidden whitespace-nowrap">Sort</span>
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>
                </div>
              </div>

              {/* Native Internal Sort Menu (Pushes the Island Height Down) */}
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ opacity: { duration: 0.2 } }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 px-1 pb-1 pt-3 md:pt-4 border-t border-border/40 mt-3 md:mt-2">
                      {(Object.entries(sortLabels) as [SortOption, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setSortOption(key as SortOption);
                            setIsSortOpen(false);
                            // Do not collapse the whole island immediately so they can see it applied
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 md:py-2.5 rounded-2xl md:rounded-xl text-sm transition-all duration-200 active:scale-95 ${
                            sortOption === key 
                              ? 'bg-primary text-primary-foreground font-semibold shadow-md' 
                              : 'bg-foreground/[0.03] text-foreground/80 hover:bg-foreground/[0.08]'
                          }`}
                        >
                          {label}
                          {sortOption === key && (
                            <Check size={16} strokeWidth={3} className="text-primary-foreground animate-in zoom-in-50" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}