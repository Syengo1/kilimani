'use client';

import { useState, useMemo } from 'react';
import { PackageSearch, LayoutGrid, Columns3 } from 'lucide-react';
import { Product } from '@/components/storefront/ProductCard';
import CategoryRow from './CategoryRow';
import DynamicIslandFilter, { SortOption } from './DynamicIslandFilter';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface FeaturedCollectionsProps {
  products: (Product & { category: string })[];
  categories: string[];
}

export default function FeaturedCollections({ products, categories }: FeaturedCollectionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('featured');
  
  // The master scaling state powered by our hydration-safe hook
  const [cardWidth, setCardWidth] = useLocalStorage('kilimani-card-width', 280);

  // PERFORMANCE: Memoize the heavy filtering and sorting calculations
  const processedProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      );
    }

    if (sortOption === 'price-asc' || sortOption === 'price-desc') {
      const minPriceMap = new Map(
        result.map(p => [p.id, Math.min(...p.variants.map(v => Number(v.price_kes)))])
      );
      
      result.sort((a, b) => {
        const priceA = minPriceMap.get(a.id) || 0;
        const priceB = minPriceMap.get(b.id) || 0;
        return sortOption === 'price-asc' ? priceA - priceB : priceB - priceA;
      });
    }

    return result;
  }, [products, searchQuery, sortOption]);

  // PERFORMANCE: Group products by category in O(N) time
  const categoryGroups = useMemo(() => {
    const groups: Record<string, typeof products> = {};
    processedProducts.forEach(product => {
      if (!groups[product.category]) groups[product.category] = [];
      groups[product.category].push(product);
    });
    return groups;
  }, [processedProducts]);

  // PERFORMANCE: Active categories preserve sort order without empty rows
  const activeCategories = useMemo(() => {
    return categories.filter(c => categoryGroups[c] && categoryGroups[c].length > 0);
  }, [categories, categoryGroups]);

  return (
    <section className="relative bg-background min-h-[50vh] pb-24 pt-6">
      
      {/* TRUE FLOATING ISLAND CONTAINER */}
      <div className="sticky top-[80px] z-30 pointer-events-none w-full mb-10 transition-all duration-300">
        <div className="pointer-events-auto max-w-4xl mx-auto px-2 md:px-0">
          <DynamicIslandFilter 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOption={sortOption}
            setSortOption={setSortOption}
            cardWidth={cardWidth}
            setCardWidth={setCardWidth}
          />
        </div>
      </div>

      {/* Premium Empty State */}
      {activeCategories.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-24 pb-20 px-4 text-center animate-in fade-in duration-500">
          <div className="bg-foreground/[0.02] border border-border/40 p-6 rounded-full mb-6 shadow-sm">
            <PackageSearch size={48} strokeWidth={1} className="text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-serif font-medium text-foreground tracking-tight">No matches found</h3>
          <p className="text-muted-foreground mt-2 text-sm max-w-sm">
            We couldn&apos;t find any products matching your current filters. Try adjusting your search criteria.
          </p>
          <button 
            onClick={() => { setSearchQuery(''); setSortOption('featured'); }}
            className="mt-8 px-8 py-3 bg-foreground text-background rounded-full hover:opacity-90 active:scale-95 transition-all text-sm font-semibold shadow-md"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Render Categories */}
      <div className="max-w-[1600px] mx-auto flex flex-col gap-10 md:gap-14 pt-4">
        {activeCategories.map((category, index) => {
          const categoryProducts = categoryGroups[category];
          return (
            <div 
              key={category}
              className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both flex flex-col"
              style={{ animationDelay: `${Math.min(index * 100, 400)}ms`, animationDuration: '700ms' }}
            >
              
              {/* CATEGORY HEADER & CONTEXTUAL SLIDER */}
              <div className="flex flex-row items-end justify-between px-4 md:px-12 mb-5">
                <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-foreground leading-none">
                  {category}
                </h2>
                
                {/* MISTOUCH-RESISTANT SIZE SLIDER 
                  - We use a custom appearance wrapper
                  - pointer-events-none disables track tapping
                  - pointer-events-auto re-enables grabbing the specific thumb
                  - touch-pan-y allows mobile users to scroll vertically right over it
                */}
                <div className="flex items-center gap-2 md:gap-3 bg-foreground/[0.02] border border-border/50 px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-colors group">
                  <LayoutGrid size={14} className="text-muted-foreground shrink-0 hidden sm:block" />
                  <input
                    type="range"
                    min="140"
                    max="400"
                    step="10"
                    value={cardWidth}
                    onChange={(e) => setCardWidth(Number(e.target.value))}
                    className="
                      w-16 md:w-24 h-1.5 bg-border/60 rounded-full appearance-none outline-none
                      touch-pan-y pointer-events-none
                      [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                      [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab active:[&::-moz-range-thumb]:cursor-grabbing [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110
                    "
                    aria-label={`Adjust ${category} size`}
                    title="Drag to adjust grid density"
                  />
                  <Columns3 size={14} className="text-muted-foreground shrink-0" />
                </div>
              </div>

              {/* Product Slider */}
              <CategoryRow 
                category={category} 
                products={categoryProducts} 
                cardWidth={cardWidth} 
              />
            </div>
          );
        })}
      </div>

    </section>
  );
}