'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import QuickAddModal from './QuickAddModal';

export interface ProductVariant {
  id: string;
  // Supabase often returns 'numeric' DB types as strings to prevent JS float issues. 
  // We type it as number | string to safely handle both.
  price_kes: number | string; 
  stock_quantity: number;
  variant_attributes?: {
    length?: string;
    // FIX: Replaced 'any' with 'unknown' to satisfy strict ESLint rules
    // while maintaining support for dynamic JSONB Supabase properties.
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

export default function ProductCard({ product }: { product: Product }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // MATHEMATICAL SAFETY: Coerce Supabase numeric strings to safe JS Numbers
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
    // STRUCTURAL FIX: The outer wrapper is now a <div>, preventing invalid nested anchor tags.
    <div className="group relative flex flex-col w-full gap-3">
      
      {/* 1. The Image Container - Airbnb Style */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 isolate">
        
        {/* Invisible Link covering the image (Z-Index 10) */}
        <Link 
          href={`/product/${product.id}`} 
          className="absolute inset-0 z-10" 
          aria-label={`View details for ${product.title}`} 
        />

        {/* Badges (Z-Index 20) */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-none">
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

        {/* Carousel Images (Z-Index 0) */}
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

        {/* Carousel Navigation (Z-Index 20) */}
        {validImages.length > 1 && (
          <>
            <button 
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white/90 text-stone-800 transition-all duration-300 hover:scale-105 hover:bg-white shadow-md disabled:hidden opacity-100 translate-x-0 md:opacity-0 md:-translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0"
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white/90 text-stone-800 transition-all duration-300 hover:scale-105 hover:bg-white shadow-md disabled:hidden opacity-100 translate-x-0 md:opacity-0 md:translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0"
              disabled={currentIndex === validImages.length - 1}
            >
              <ChevronRight size={18} />
            </button>

            <div className="absolute left-0 right-0 z-20 flex justify-center gap-1.5 transition-all duration-500 ease-out bottom-16 md:bottom-3 md:group-hover:bottom-16 pointer-events-none">
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

        {/* Sleek Quick Add Button (Z-Index 30) */}
        {!isSoldOut && (
          <div className="absolute bottom-0 left-0 right-0 p-3 z-30 transition-all duration-500 ease-out opacity-100 translate-y-0 md:opacity-0 md:translate-y-full md:group-hover:translate-y-0 md:group-hover:opacity-100">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-background/95 backdrop-blur-md hover:bg-foreground hover:text-background text-foreground py-2.5 px-4 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 shadow-lg active:scale-95"
            >
              <ShoppingBag size={14} strokeWidth={2} /> Quick Add
            </button>
          </div>
        )}
      </div>

      {/* 2. Typography - Safely Wrapped in its own Link */}
      <Link href={`/product/${product.id}`} className="flex flex-col items-start px-0.5">
        <h3 className="text-[15px] font-semibold text-foreground truncate w-full group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        <p className="text-sm font-normal text-muted-foreground mt-0.5">
          {product.category || 'Premium Collection'}
        </p>
        <div className="flex items-baseline gap-1 mt-1.5">
          {hasMultiplePrices && <span className="text-sm font-normal text-foreground">From</span>}
          <span className="text-[15px] font-semibold text-foreground">
            {formatKES(minPrice)}
          </span>
        </div>
      </Link>

      {/* 3. The Modal - Safely rendered completely outside the Link tree */}
      <QuickAddModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={product} 
      />

    </div>
  );
}