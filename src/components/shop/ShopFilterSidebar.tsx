'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { SlidersHorizontal, Check, X } from 'lucide-react';

const CATEGORIES = [
  { label: 'All Collection', value: 'all' },
  { label: 'Lace Front Wigs', value: 'lace_front_wigs' },
  { label: 'Closures & Frontals', value: 'closures_frontals' },
  { label: 'Hair Bundles', value: 'bundles' },
  { label: 'Hair Care & Accessories', value: 'care' },
];

const SORT_OPTIONS = [
  { label: 'Newest Arrivals', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export function ShopFilterSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract current active filters directly from the URL
  const currentCategory = searchParams.get('category') || 'all';
  const currentSort = searchParams.get('sort') || 'newest';

  // The Engine: Creates a new URL query string without losing existing parameters
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all' || value === 'newest') {
        params.delete(name); // Keep URLs clean by removing defaults
      } else {
        params.set(name, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (key: 'category' | 'sort', value: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
    const queryString = createQueryString(key, value);
    // scroll: false prevents the page from jumping to the top every time a filter is clicked
    router.push(`${pathname}?${queryString}`, { scroll: false });
  };

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const hasActiveFilters = currentCategory !== 'all' || currentSort !== 'newest';

  return (
    <div className="bg-background border border-border/50 rounded-3xl p-5 md:p-6 shadow-sm sticky top-24">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
        <h2 className="font-serif font-black text-lg tracking-tight flex items-center gap-2">
          <SlidersHorizontal size={18} />
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 bg-foreground/5 px-2 py-1 rounded-md"
          >
            <X size={12} strokeWidth={3} /> Clear
          </button>
        )}
      </div>

      {/* Category Selection */}
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Category
        </h3>
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => handleFilterChange('category', cat.value)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-foreground/5'
                }`}
              >
                {cat.label}
                {isActive && <Check size={16} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort Selection */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Sort By
        </h3>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((sort) => {
            const isActive = currentSort === sort.value;
            return (
              <button
                key={sort.value}
                onClick={() => handleFilterChange('sort', sort.value)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'text-primary'
                    : 'text-foreground hover:bg-foreground/5'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'border-primary' : 'border-muted-foreground/30 group-hover:border-foreground/50'
                }`}>
                  {isActive && <div className="w-2 h-2 bg-primary rounded-full" />}
                </div>
                {sort.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}