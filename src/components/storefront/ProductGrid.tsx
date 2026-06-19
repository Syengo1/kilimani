'use client';

import { useState } from 'react';
import { LayoutGrid, Rows3 } from 'lucide-react';
import ProductCard, { Product } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export default function ProductGrid({ products, title }: ProductGridProps) {
  // 'compact' = 2 columns on mobile, 4 on desktop
  // 'standard' = 1 column on mobile, 3 on desktop
  const [density, setDensity] = useState<'compact' | 'standard'>('compact');

  if (products.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-4 md:gap-6">
      
      {/* Grid Controls Header */}
      <div className="flex items-end justify-between px-2">
        {title && (
          <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground">
            {title}
          </h2>
        )}

        {/* View Toggles */}
        <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-lg border border-border/40 ml-auto">
          <button
            onClick={() => setDensity('standard')}
            className={`p-1.5 rounded-md transition-all duration-300 ${
              density === 'standard' 
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Standard View"
          >
            {/* Rows icon looks like a large single column on mobile */}
            <Rows3 size={16} strokeWidth={density === 'standard' ? 2 : 1.5} />
          </button>
          <button
            onClick={() => setDensity('compact')}
            className={`p-1.5 rounded-md transition-all duration-300 ${
              density === 'compact' 
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Compact View"
          >
            {/* Grid icon represents the dense multi-column layout */}
            <LayoutGrid size={16} strokeWidth={density === 'compact' ? 2 : 1.5} />
          </button>
        </div>
      </div>

      {/* The Dynamic Layout Engine */}
      <div 
        className={`grid transition-all duration-500 ease-in-out ${
          density === 'compact'
            // COMPACT: 2 col mobile, 3 col tablet, 4-5 col desktop (Tight gaps)
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-6 md:gap-x-4 md:gap-y-8'
            // STANDARD: 1 col mobile, 2 col tablet, 3 col desktop (Breathing room)
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-y-12'
        }`}
      >
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            density={density} 
          />
        ))}
      </div>
    </div>
  );
}