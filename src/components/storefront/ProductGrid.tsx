'use client';

import { useState } from 'react';
import { LayoutGrid, Rows3, PackageSearch } from 'lucide-react';
import ProductCard, { Product } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export default function ProductGrid({ products, title }: ProductGridProps) {
  // 'compact' = High density (Mobile: 2 col, Desktop: 4-5 col)
  // 'standard' = Luxury breathing room (Mobile: 1 col, Desktop: 3 col)
  const [density, setDensity] = useState<'compact' | 'standard'>('compact');

  // 1. GRACEFUL EMPTY STATE
  // Instead of silently returning null, we show a premium fallback UI
  if (!products || products.length === 0) {
    return (
      <section className="w-full flex flex-col items-center justify-center py-20 px-4 text-center bg-foreground/[0.02] border border-border/40 rounded-3xl animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center mb-5 shadow-sm">
          <PackageSearch className="text-muted-foreground" size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-serif font-bold text-foreground tracking-tight">
          No Products Found
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
          We couldn&apos;t find any products matching your current criteria. Please adjust your filters or check back later for new arrivals.
        </p>
      </section>
    );
  }

  return (
    // 2. SEMANTIC HTML: Using <section> instead of a standard <div>
    <section className="w-full flex flex-col gap-5 md:gap-8">
      
      {/* Grid Controls Header */}
      <header className="flex items-end justify-between px-1">
        {title && (
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight">
            {title}
          </h2>
        )}

        {/* Luxury View Toggles */}
        <nav className="flex items-center gap-1 bg-foreground/[0.03] p-1.5 rounded-xl border border-border/40 ml-auto shadow-inner">
          <button
            onClick={() => setDensity('standard')}
            className={`p-2 rounded-lg transition-all duration-300 ${
              density === 'standard' 
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Switch to Standard Luxury View"
            title="Standard View"
          >
            <Rows3 size={16} strokeWidth={density === 'standard' ? 2.5 : 1.5} />
          </button>
          <button
            onClick={() => setDensity('compact')}
            className={`p-2 rounded-lg transition-all duration-300 ${
              density === 'compact' 
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Switch to Compact Catalogue View"
            title="Compact View"
          >
            <LayoutGrid size={16} strokeWidth={density === 'compact' ? 2.5 : 1.5} />
          </button>
        </nav>
      </header>

      {/* 3. SEMANTIC ACCESSIBILITY: Using <ul role="list"> and <li> */}
      {/* The Dynamic Layout Engine */}
      <ul 
        role="list"
        className={`grid transition-all duration-700 ease-out ${
          density === 'compact'
            // COMPACT: Dense catalogue layout
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-8 md:gap-x-5 md:gap-y-12'
            // STANDARD: Premium boutique layout
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10 md:gap-x-8 md:gap-y-16'
        }`}
      >
        {products.map((product) => (
          // 4. LAYOUT HARDENING: 'flex justify-center' ensures cards never stretch awkwardly
          <li key={product.id} className="flex justify-center w-full">
            <ProductCard 
              product={product} 
              density={density} 
            />
          </li>
        ))}
      </ul>
    </section>
  );
}