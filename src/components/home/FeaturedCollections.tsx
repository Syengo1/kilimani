'use client';

import { useState, useMemo } from 'react';
import { PackageSearch } from 'lucide-react';
import { Product } from '@/components/storefront/ProductCard';
import CategoryRow from './CategoryRow';
import DynamicIslandFilter, { SortOption } from './DynamicIslandFilter';

interface FeaturedCollectionsProps {
  products: (Product & { category: string })[];
  categories: string[]; // ['Wigs', 'Extensions', 'Accessories', etc.]
}

export default function FeaturedCollections({ products, categories }: FeaturedCollectionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('featured');

  // Intelligent Filter & Sort Engine
  const processedProducts = useMemo(() => {
    let result = [...products];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    // 2. Sorting Logic
    if (sortOption === 'price-asc') {
      result.sort((a, b) => Math.min(...a.variants.map(v => v.price_kes)) - Math.min(...b.variants.map(v => v.price_kes)));
    } else if (sortOption === 'price-desc') {
      result.sort((a, b) => Math.max(...a.variants.map(v => v.price_kes)) - Math.max(...b.variants.map(v => v.price_kes)));
    }
    // If 'featured', we leave it in the original array order (which you fetched via limit/order in Supabase)

    return result;
  }, [products, searchQuery, sortOption]);

  if (products.length === 0) return null;

  return (
    <section className="w-full relative pb-24 bg-background">
      
      {/* The Hovering Control Center */}
      <DynamicIslandFilter 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

      {/* Intro Typography */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 mt-12 md:mt-20 mb-12 md:mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-serif text-foreground mb-6 tracking-tight">
          Explore the Catalog
        </h1>
        <p className="text-muted-foreground font-light text-base md:text-lg max-w-2xl mx-auto">
          Masterfully sourced selections to ensure unparalleled longevity and luster. Scroll horizontally to explore categories.
        </p>
      </div>

      {/* Zero State for Search */}
      {processedProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 opacity-70">
          <PackageSearch size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium text-foreground">No matches found</h3>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms or filters.</p>
        </div>
      )}

      {/* Render Airbnb-Style Vertical Category Stack */}
      <div className="max-w-[1600px] mx-auto">
        {categories.map((category) => {
          // Filter the globally processed products to just this row's category
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