'use client';

import { useState, useMemo } from 'react';
import { PackageSearch } from 'lucide-react';
import { Product } from '@/components/storefront/ProductCard';
import CategoryRow from './CategoryRow';
import DynamicIslandFilter, { SortOption } from './DynamicIslandFilter';

interface FeaturedCollectionsProps {
  products: (Product & { category: string })[];
  categories: string[];
}

export default function FeaturedCollections({ products, categories }: FeaturedCollectionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('featured');
  
  // The master scaling state
  const [cardWidth, setCardWidth] = useState(260);

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

  const activeCategories = useMemo(() => {
    return categories.filter(cat => processedProducts.some(p => p.category === cat));
  }, [categories, processedProducts]);

  if (products.length === 0) return null;

  return (
    <section className="w-full relative pb-24 bg-background transition-colors duration-500 ease-in-out">
      
      <DynamicIslandFilter 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

      <div className="max-w-[1600px] mx-auto px-4 md:px-12 mt-12 md:mt-20 mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-6xl font-serif text-foreground mb-4 md:mb-6 tracking-tight">
          Explore the Catalog
        </h1>
        <p className="text-muted-foreground font-light text-sm md:text-lg max-w-2xl mx-auto px-4">
          Masterfully sourced selections to ensure unparalleled longevity and luster. Scroll horizontally to explore categories.
        </p>
      </div>

      {/* 1. REMOVED: The sticky floating slider has been completely deleted from here */}

      {processedProducts.length === 0 && (
        <div className="max-w-[1600px] mx-auto px-4 md:px-12">
          <div className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl bg-foreground/5 border border-border/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
            <PackageSearch size={56} strokeWidth={1.5} className="text-muted-foreground mb-6" />
            <h3 className="text-2xl font-serif font-medium text-foreground">No matches found</h3>
            <button 
              onClick={() => { setSearchQuery(''); setSortOption('featured'); }}
              className="mt-8 px-8 py-3 bg-background text-foreground border border-border/60 rounded-full hover:bg-foreground/10 active:scale-95 transition-all text-sm font-semibold shadow-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto flex flex-col gap-8 md:gap-12">
        {activeCategories.map((category, index) => {
          const categoryProducts = processedProducts.filter(p => p.category === category);
          return (
            <div 
              key={category}
              className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
              style={{ animationDelay: `${index * 150}ms`, animationDuration: '700ms' }}
            >
              {/* 2. UPDATE: Passing setCardWidth down to every row */}
              <CategoryRow 
                category={category} 
                products={categoryProducts} 
                cardWidth={cardWidth} 
                setCardWidth={setCardWidth}
              />
            </div>
          );
        })}
      </div>

    </section>
  );
}