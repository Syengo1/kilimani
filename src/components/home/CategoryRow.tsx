'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard, { Product } from '@/components/storefront/ProductCard';

interface CategoryRowProps {
  category: string;
  products: Product[];
  cardWidth: number;
}

// Notice we removed setCardWidth from props here, as this component doesn't need to change it
export default function CategoryRow({ category, products, cardWidth }: CategoryRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Safely check scroll boundaries
  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // Added a 10px buffer to prevent rounding errors on high-DPI screens
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10);
    }
  }, []);

  // Recalculate arrows when products load, window resizes, OR when the memory hook changes the card width
  useEffect(() => {
    // We wrap checkScroll in a tiny timeout to allow the CSS width transition to finish
    // before we calculate if the arrows should be visible.
    const timer = setTimeout(() => {
      checkScroll();
    }, 150); // 150ms covers the 0.1s CSS transition time

    window.addEventListener('resize', checkScroll, { passive: true });
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [products, checkScroll, cardWidth]); 

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Scroll by 2.5 cards to feel fast but controlled
      const scrollAmount = cardWidth * 2.5; 
      container.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
      // Delay the arrow check slightly to allow smooth scrolling to finish
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <div className="w-full relative group/row">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 relative">
        
        {/* Left Scroll Button */}
        <button 
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 md:p-3 rounded-full bg-background/95 backdrop-blur-md text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-border/50 transition-all duration-300 hidden md:flex active:scale-95 ${
            canScrollLeft 
              ? 'opacity-0 -translate-x-4 group-hover/row:opacity-100 group-hover/row:translate-x-0 hover:scale-110 hover:bg-background' 
              : 'opacity-0 pointer-events-none -translate-x-4'
          }`}
          aria-label={`Scroll ${category} left`}
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>

        {/* Scrollable Container */}
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory px-4 md:px-12 gap-3 md:gap-5 pb-8 pt-2"
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="flex-none snap-start"
              style={{ 
                width: `${cardWidth}px`, 
                maxWidth: '85vw',
                transition: 'width 0.15s cubic-bezier(0.4, 0, 0.2, 1)' // Smoother, Apple-like curve
              }}
            >
              <ProductCard 
                product={product} 
                density={cardWidth < 200 ? 'compact' : 'standard'} 
              />
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button 
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 md:p-3 rounded-full bg-background/95 backdrop-blur-md text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-border/50 transition-all duration-300 hidden md:flex active:scale-95 ${
            canScrollRight 
              ? 'opacity-0 translate-x-4 group-hover/row:opacity-100 group-hover/row:translate-x-0 hover:scale-110 hover:bg-background' 
              : 'opacity-0 pointer-events-none translate-x-4'
          }`}
          aria-label={`Scroll ${category} right`}
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>

      </div>
    </div>
  );
}