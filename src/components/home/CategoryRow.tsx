'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Square } from 'lucide-react';
import ProductCard, { Product } from '@/components/storefront/ProductCard';

interface CategoryRowProps {
  category: string;
  products: Product[];
  cardWidth: number;
  setCardWidth: (width: number) => void;
}

export default function CategoryRow({ category, products, cardWidth, setCardWidth }: CategoryRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll, { passive: true });
    return () => window.removeEventListener('resize', checkScroll);
  }, [products, checkScroll, cardWidth]); 

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="w-full flex flex-col group/row relative">
      
      {/* HEADER SECTION */}
      <div className="px-4 md:px-12 mb-4 flex items-end justify-between gap-4">
        
        <div className="min-w-0">
          <h2 className="text-xl md:text-3xl font-serif font-medium text-foreground tracking-tight truncate">
            {category}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium tracking-wide">
            {products.length} {products.length === 1 ? 'Item' : 'Items'}
          </p>
        </div>

        {/* THE FOOLPROOF SLIDER CONTAINER 
          py-2 creates a taller invisible hit-box so it's easier to grab 
        */}
        <div className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 transition-colors px-3 py-2 rounded-full border border-border/40 shrink-0">
          <LayoutGrid size={14} className="text-muted-foreground hidden sm:block" />
          
          <input
            type="range"
            min="140" 
            max="450" 
            value={cardWidth}
            onChange={(e) => setCardWidth(Number(e.target.value))}
            aria-label={`Adjust card size for ${category}`}
            className="
              relative w-16 sm:w-24 md:w-32 h-6 bg-transparent appearance-none cursor-ew-resize rounded-full
              
              /* 1. SCROLL PROTECTOR: Allows vertical scrolling to completely bypass the slider */
              touch-pan-y 
              
              /* 2. TAP PROTECTOR: Disables track clicking on the parent... */
              pointer-events-none 
              
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
              
              /* --- WEBKIT (Chrome, Safari, iOS) --- */
              [&::-webkit-slider-runnable-track]:h-1.5 
              [&::-webkit-slider-runnable-track]:bg-foreground/20 
              [&::-webkit-slider-runnable-track]:rounded-full

              /* ...but explicitly re-enables clicking/dragging ONLY on the thumb */
              [&::-webkit-slider-thumb]:pointer-events-auto 
              
              [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:w-4 
              [&::-webkit-slider-thumb]:h-4 
              [&::-webkit-slider-thumb]:-mt-[5px] 
              [&::-webkit-slider-thumb]:bg-primary 
              [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,0,0,0.25)] 
              
              /* 3. VISUAL FEEDBACK: Thumb inflates smoothly when grabbed */
              [&::-webkit-slider-thumb]:transition-transform 
              [&::-webkit-slider-thumb]:duration-200
              [&::-webkit-slider-thumb]:active:scale-[1.6]

              /* --- FIREFOX --- */
              [&::-moz-range-track]:h-1.5 
              [&::-moz-range-track]:bg-foreground/20 
              [&::-moz-range-track]:rounded-full

              [&::-moz-range-thumb]:pointer-events-auto 
              
              [&::-moz-range-thumb]:appearance-none 
              [&::-moz-range-thumb]:w-4 
              [&::-moz-range-thumb]:h-4 
              [&::-moz-range-thumb]:border-none 
              [&::-moz-range-thumb]:bg-primary 
              [&::-moz-range-thumb]:rounded-full 
              [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(0,0,0,0.25)] 
              
              [&::-moz-range-thumb]:transition-transform 
              [&::-moz-range-thumb]:duration-200
              [&::-moz-range-thumb]:active:scale-[1.6]
            "
          />
          
          <Square size={14} className="text-muted-foreground hidden sm:block" />
        </div>

      </div>

      {/* ROW CONTENT */}
      <div className="relative w-full">
        
        <button 
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 md:p-3 rounded-full bg-background/95 backdrop-blur-md text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-border/50 transition-all duration-300 hidden md:flex active:scale-95 ${
            canScrollLeft 
              ? 'opacity-0 -translate-x-4 group-hover/row:opacity-100 group-hover/row:translate-x-0 hover:scale-105 cursor-pointer' 
              : 'opacity-0 pointer-events-none'
          }`}
          aria-label={`Scroll ${category} left`}
        >
          <ChevronLeft size={20} strokeWidth={2.5} className="text-foreground/80" />
        </button>

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
                transition: 'width 0.1s ease-out' 
              }}
            >
              <ProductCard 
                product={product} 
                density={cardWidth < 200 ? 'compact' : 'standard'} 
              />
            </div>
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 md:p-3 rounded-full bg-background/95 backdrop-blur-md text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-border/50 transition-all duration-300 hidden md:flex active:scale-95 ${
            canScrollRight 
              ? 'opacity-0 translate-x-4 group-hover/row:opacity-100 group-hover/row:translate-x-0 hover:scale-105 cursor-pointer' 
              : 'opacity-0 pointer-events-none'
          }`}
          aria-label={`Scroll ${category} right`}
        >
          <ChevronRight size={20} strokeWidth={2.5} className="text-foreground/80" />
        </button>
        
      </div>
    </div>
  );
}