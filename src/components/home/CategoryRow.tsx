'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard, { Product } from '@/components/storefront/ProductCard';

interface CategoryRowProps {
  category: string;
  products: Product[];
}

export default function CategoryRow({ category, products }: CategoryRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      // Calculates dynamic scroll amount based on screen size
      const scrollAmount = window.innerWidth > 768 ? window.innerWidth * 0.6 : window.innerWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Do not render the row if filtering removes all products in this category
  if (products.length === 0) return null;

  return (
    <div className="w-full flex flex-col mb-12 md:mb-16 group/row relative">
      <div className="px-6 md:px-12 mb-4 md:mb-6 flex items-end justify-between">
        <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground tracking-tight">
          {category}
        </h2>
      </div>

      <div className="relative w-full">
        {/* Left Scroll Button - Hidden on mobile, appears on desktop hover */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-background/90 backdrop-blur-md text-foreground shadow-xl border border-border/50 opacity-0 md:-translate-x-4 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-300 hover:scale-105 hidden md:flex active:scale-95"
          aria-label={`Scroll ${category} left`}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Scroll Container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory px-6 md:px-12 gap-4 md:gap-6 pb-8"
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="w-[85vw] sm:w-[45vw] md:w-[30vw] lg:w-[22vw] flex-none snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button 
          onClick={() => scroll('right')}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-background/90 backdrop-blur-md text-foreground shadow-xl border border-border/50 opacity-0 md:translate-x-4 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-300 hover:scale-105 hidden md:flex active:scale-95"
          aria-label={`Scroll ${category} right`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}