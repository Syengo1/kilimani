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

  // 1. FILTER & SORT ENGINE
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    // Mathematical Sorting Logic (Safely cast stringified decimals to Numbers)
    if (sortOption === 'price-asc') {
      result.sort((a, b) => 
        Math.min(...a.variants.map(v => Number(v.price_kes))) - 
        Math.min(...b.variants.map(v => Number(v.price_kes)))
      );
    } else if (sortOption === 'price-desc') {
      result.sort((a, b) => 
        Math.max(...a.variants.map(v => Number(v.price_kes))) - 
        Math.max(...b.variants.map(v => Number(v.price_kes)))
      );
    }

    return result;
  }, [products, searchQuery, sortOption]);

  // 2. SMART PRUNING
  // Only retain categories that actually contain products after the current filters are applied.
  const activeCategories = useMemo(() => {
    return categories.filter(cat => processedProducts.some(p => p.category === cat));
  }, [categories, processedProducts]);

  if (products.length === 0) return null;

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortOption('featured');
  };

  return (
    // THEME FLUIDITY: Extends the transition down into the section background
    <section className="w-full relative pb-24 bg-background transition-colors duration-500 ease-in-out">
      
      {/* The Hovering Control Center */}
      <DynamicIslandFilter 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

      {/* Intro Typography */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 mt-12 md:mt-20 mb-12 md:mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-serif text-foreground transition-colors duration-500 mb-6 tracking-tight">
          Explore the Catalog
        </h1>
        <p className="text-muted-foreground transition-colors duration-500 font-light text-base md:text-lg max-w-2xl mx-auto">
          Masterfully sourced selections to ensure unparalleled longevity and luster. Scroll horizontally to explore categories.
        </p>
      </div>

      {/* Premium Zero State for Empty Search Results */}
      {processedProducts.length === 0 && (
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="flex flex-col items-center justify-center py-24 px-6 rounded-3xl bg-foreground/5 border border-border/50 backdrop-blur-sm transition-colors duration-500">
            <PackageSearch size={56} strokeWidth={1.5} className="text-muted-foreground mb-6" />
            <h3 className="text-2xl font-serif font-medium text-foreground">No matches found</h3>
            <p className="text-base text-muted-foreground mt-2 max-w-md text-center">
              We couldn&apos;t find any items matching your current filters. Try adjusting your search.
            </p>
            <button 
              onClick={handleClearFilters}
              className="mt-8 px-8 py-3 bg-background text-foreground border border-border/60 rounded-full hover:bg-foreground/10 active:scale-95 transition-all text-sm font-semibold shadow-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Render Airbnb-Style Vertical Category Stack */}
      <div className="max-w-[1600px] mx-auto">
        {activeCategories.map((category) => {
          // Pass only the pre-filtered products belonging to this specific category
          const categoryProducts = processedProducts.filter(p => p.category === category);
          
          return (
            <CategoryRow 
              key={category} 
              category={category} 
              products={categoryProducts} 
            />
          );
        })}
      </div>

    </section>
  );
}