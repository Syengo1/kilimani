'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

// Interfaces mirroring your Supabase schema
export interface ProductVariant {
  id: string;
  price_kes: number;
  stock_quantity: number;
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

export default function ProductCard({ product }: { product: Product }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Pricing & Stock Logic
  const minPrice = Math.min(...product.variants.map((v) => v.price_kes));
  const hasMultiplePrices = product.variants.some((v) => v.price_kes !== minPrice);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
  const isSoldOut = totalStock === 0;

  // Image Sorting
  const sortedImages = [...product.images].sort((a, b) => a.display_order - b.display_order);
  const validImages = sortedImages.length > 0 ? sortedImages : [{ id: 'fallback', url: '/images/placeholder-hair.jpg', display_order: 0 }];

  // Hydration-safe Currency Formatter
  const formatKES = (amount: number) => {
    return `KES ${amount.toLocaleString('en-US')}`;
  };

  // --- Interaction Handlers ---
  
  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents the Link from triggering
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network request
    setIsAdding(false);
  };

  return (
    <Link href={`/product/${product.id}`} className="group flex flex-col w-full gap-3 cursor-pointer">
      
      {/* 1. The Image Container - Airbnb Style (Square, Rounded, Overflow Hidden) */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 isolate">
        
        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          {isSoldOut && (
            <span className="bg-background/90 backdrop-blur-md text-foreground text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-sm shadow-sm">
              Sold Out
            </span>
          )}
          {product.base_attributes?.isNew && !isSoldOut && (
            <span className="bg-background/90 backdrop-blur-md text-foreground text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-sm shadow-sm">
              New Arrival
            </span>
          )}
        </div>

        {/* Floating Heart Icon 
        <button 
          onClick={toggleLike}
          className="absolute top-3 right-3 z-20 p-1.5 transition-transform active:scale-75"
          aria-label="Save to favorites"
        >
          <Heart 
            size={24} 
            className={`transition-colors duration-300 drop-shadow-md ${
              isLiked ? 'fill-red-500 text-red-500' : 'fill-black/30 text-white'
            }`} 
          />
        </button> */}

        {/* CSS-Driven Image Carousel */}
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
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Carousel Navigation Arrows & Dots */}
        {validImages.length > 1 && (
          <>
            <button 
              onClick={handlePrevImage}
              // Visible on mobile, hidden and triggered by hover on desktop
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white/90 text-stone-800 transition-all duration-300 hover:scale-105 hover:bg-white shadow-md disabled:hidden opacity-100 translate-x-0 md:opacity-0 md:-translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0"
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={handleNextImage}
              // Visible on mobile, hidden and triggered by hover on desktop
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white/90 text-stone-800 transition-all duration-300 hover:scale-105 hover:bg-white shadow-md disabled:hidden opacity-100 translate-x-0 md:opacity-0 md:translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0"
              disabled={currentIndex === validImages.length - 1}
            >
              <ChevronRight size={18} />
            </button>

            {/* Pagination Dots - Slides up on desktop hover so the Quick Add button doesn't cover them */}
            <div className="absolute left-0 right-0 z-20 flex justify-center gap-1.5 transition-all duration-500 ease-out bottom-16 md:bottom-3 md:group-hover:bottom-16">
              {validImages.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                    idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Sleek Quick Add Button */}
        {!isSoldOut && (
          <div className="absolute bottom-0 left-0 right-0 p-3 z-30 transition-all duration-500 ease-out opacity-100 translate-y-0 md:opacity-0 md:translate-y-full md:group-hover:translate-y-0 md:group-hover:opacity-100">
            <button
              onClick={handleQuickAdd}
              disabled={isAdding}
              className="w-full flex items-center justify-center gap-2 bg-background/95 backdrop-blur-md hover:bg-foreground hover:text-background text-foreground py-2.5 px-4 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 shadow-lg disabled:opacity-70 disabled:cursor-wait"
            >
              {isAdding ? (
                <span className="animate-pulse">Adding...</span>
              ) : (
                <>
                  <ShoppingBag size={14} strokeWidth={2} /> Quick Add
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 2. Typography - Airbnb Style Layout */}
      <div className="flex flex-col items-start px-0.5">
        <div className="flex justify-between items-start w-full gap-2">
          <h3 className="text-[15px] font-semibold text-foreground truncate w-full">
            {product.title}
          </h3>
        </div>
        
        {/* Dynamic Subtitle (e.g., Collection or Category) */}
        <p className="text-sm font-normal text-muted-foreground mt-0.5">
          {product.category || 'Premium Collection'}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-1 mt-1.5">
          {hasMultiplePrices && <span className="text-sm font-normal text-foreground">From</span>}
          <span className="text-[15px] font-semibold text-foreground">
            {formatKES(minPrice)}
          </span>
        </div>
      </div>

    </Link>
  );
}