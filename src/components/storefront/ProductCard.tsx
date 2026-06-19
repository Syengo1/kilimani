'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import QuickAddModal from './QuickAddModal';

export interface ProductVariant {
  id: string;
  price_kes: number | string; 
  stock_quantity: number;
  variant_attributes?: {
    length?: string;
    [key: string]: unknown; 
  };
}

export interface ProductImage {
  id: string;
  url: string;
  display_order: number;
}

export interface Product {
  id: string;
  title: string;
  category?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  base_attributes?: {
    isNew?: boolean;
    label?: string;
  };
}

interface ProductCardProps {
  product: Product;
  density?: 'standard' | 'compact';
}

export default function ProductCard({ product, density = 'standard' }: ProductCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isCompact = density === 'compact';

  // MATHEMATICAL SAFETY
  const minPrice = Math.min(...product.variants.map((v) => Number(v.price_kes)));
  const hasMultiplePrices = product.variants.some((v) => Number(v.price_kes) !== minPrice);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
  const isSoldOut = totalStock === 0;

  const sortedImages = [...product.images].sort((a, b) => a.display_order - b.display_order);
  const validImages = sortedImages.length > 0 ? sortedImages : [{ id: 'fallback', url: '/images/placeholder-hair.jpg', display_order: 0 }];

  const formatKES = (amount: number) => `KES ${amount.toLocaleString('en-US')}`;

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  return (
    <div className="group relative flex flex-col w-full gap-2.5">
      
      {/* 1. The Image Container */}
      {/* Hair products look best in portrait. aspect-[4/5] saves vertical scroll space compared to aspect-square */}
      <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 isolate shadow-sm border border-border/20">
        
        <Link 
          href={`/product/${product.id}`} 
          className="absolute inset-0 z-10" 
          aria-label={`View details for ${product.title}`} 
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5 pointer-events-none">
          {isSoldOut && (
            <span className="bg-background/90 backdrop-blur-md text-foreground text-[9px] md:text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded shadow-sm">
              Sold Out
            </span>
          )}
          {product.base_attributes?.isNew && !isSoldOut && (
            <span className="bg-background/90 backdrop-blur-md text-foreground text-[9px] md:text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded shadow-sm">
              New
            </span>
          )}
        </div>

        {/* Carousel Images */}
        <div 
          className="flex w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {validImages.map((img) => (
            <div key={img.id} className="relative w-full h-full flex-shrink-0">
              <Image
                src={img.url}
                alt={product.title}
                fill
                // OPTIMIZED SIZING: We tell the browser it will be 50vw on mobile, not 100vw, drastically improving load speeds
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Desktop Carousel Navigation (Hidden on Mobile for cleaner UI) */}
        {validImages.length > 1 && !isCompact && (
          <div className="hidden md:block">
            <button 
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white/90 text-stone-800 transition-all duration-300 hover:scale-105 hover:bg-white shadow-md disabled:hidden opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white/90 text-stone-800 transition-all duration-300 hover:scale-105 hover:bg-white shadow-md disabled:hidden opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
              disabled={currentIndex === validImages.length - 1}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Carousel Dots */}
        {validImages.length > 1 && (
          <div className="absolute left-0 right-0 z-20 flex justify-center gap-1.5 transition-all duration-500 ease-out bottom-3 pointer-events-none">
            {validImages.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 rounded-full transition-all duration-300 shadow-sm ${
                  idx === currentIndex ? 'w-3 bg-white' : 'w-1 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Quick Add Button - Dynamically scales based on density */}
        {!isSoldOut && (
          <div className={`absolute left-0 right-0 z-30 transition-all duration-500 ease-out ${
            isCompact 
              ? 'bottom-2 px-2 opacity-100' // Always visible, smaller on mobile compact mode
              : 'bottom-0 p-3 opacity-100 translate-y-0 md:opacity-0 md:translate-y-full md:group-hover:translate-y-0 md:group-hover:opacity-100'
          }`}>
            <button
              onClick={() => setIsModalOpen(true)}
              className={`w-full flex items-center justify-center gap-1.5 bg-background/90 backdrop-blur-md hover:bg-foreground hover:text-background text-foreground rounded-lg font-semibold tracking-wide transition-all duration-300 shadow-lg active:scale-95 ${
                isCompact ? 'py-1.5 text-[10px]' : 'py-2.5 text-xs'
              }`}
            >
              <ShoppingBag size={isCompact ? 12 : 14} strokeWidth={2} /> 
              {isCompact ? 'Add' : 'Quick Add'}
            </button>
          </div>
        )}
      </div>

      {/* 2. Typography - Safely scales down when density is compact */}
      <Link href={`/product/${product.id}`} className="flex flex-col items-start px-0.5">
        <h3 className={`font-semibold text-foreground truncate w-full group-hover:text-primary transition-colors ${
          isCompact ? 'text-xs md:text-sm' : 'text-[15px]'
        }`}>
          {product.title}
        </h3>
        <p className={`font-normal text-muted-foreground mt-0.5 ${
          isCompact ? 'text-[10px] md:text-xs' : 'text-sm'
        }`}>
          {product.category || 'Premium Collection'}
        </p>
        <div className={`flex items-baseline gap-1 ${isCompact ? 'mt-1' : 'mt-1.5'}`}>
          {hasMultiplePrices && <span className={`font-normal text-foreground ${isCompact ? 'text-[10px]' : 'text-sm'}`}>From</span>}
          <span className={`font-semibold text-foreground ${isCompact ? 'text-sm' : 'text-[15px]'}`}>
            {formatKES(minPrice)}
          </span>
        </div>
      </Link>

      <QuickAddModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={product} />
    </div>
  );
}