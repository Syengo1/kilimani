// src/components/home/FeaturedCollections.tsx
'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard, { Product } from '@/components/storefront/ProductCard';

interface FeaturedCollectionsProps {
  products: (Product & { category: string })[];
  categories: string[];
}

export default function FeaturedCollections({ products, categories }: FeaturedCollectionsProps) {
  const [activeTab, setActiveTab] = useState('All Exclusives');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter logic runs instantly on the client side without re-fetching
  const filteredProducts = products.filter(
    (product) => activeTab === 'All Exclusives' || product.category === activeTab
  );

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth > 768 ? 600 : 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (products.length === 0) {
    return null; // Or return a sleek empty state component if no inventory exists
  }

  return (
    <section className="w-full py-24 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        
        <div>
          <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-4">
            Curated For You
          </h2>
          <p className="text-stone-500 font-light text-sm md:text-base max-w-md">
            Explore our most sought-after collections. Masterfully sourced to ensure unparalleled longevity and luster.
          </p>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-6 md:gap-8 pb-2 border-b border-border w-full md:w-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`relative pb-3 text-sm font-medium uppercase tracking-wider transition-colors whitespace-nowrap z-10 ${
                activeTab === category ? 'text-primary' : 'text-stone-400 hover:text-foreground'
              }`}
            >
              {category}
              {activeTab === category && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="relative max-w-[1400px] mx-auto group">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-background/80 backdrop-blur-md p-3 rounded-full shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block hover:scale-110 hover:text-primary"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory px-6 md:px-12 gap-4 md:gap-6 pb-12 pt-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="w-[75vw] sm:w-[45vw] md:w-[30vw] lg:w-[22vw] flex-none snap-start"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-background/80 backdrop-blur-md p-3 rounded-full shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block hover:scale-110 hover:text-primary"
          aria-label="Scroll right"
        >
          <ChevronRight size={24} strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}