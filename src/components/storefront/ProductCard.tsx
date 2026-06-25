'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Scissors, SprayCan } from 'lucide-react';
import QuickAddModal from './QuickAddModal';

// 1. STRICT NEW SCHEMA INTERFACES
export interface ProductVariant {
  id: string;
  sku: string;
  price_kes: number; 
  discount_price_kes?: number | null;
  stock_quantity: number;
  variant_attributes?: Record<string, string>;
}

export interface ProductImage {
  id: string;
  url: string;
  display_order: number;
}

export interface Product {
  id: string;
  ref_id: string;
  product_type: 'hair' | 'accessory' | 'haircare' | string;
  category?: { name: string } | null;
  collection?: { name: string } | null;
  description?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  base_attributes?: Record<string, unknown>;
}

interface ProductCardProps {
  product: Product;
  density?: 'standard' | 'compact';
}

export default function ProductCard({ product, density = 'standard' }: ProductCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isCompact = density === 'compact';

  // ==========================================
  // DYNAMIC COMPUTATION ENGINES
  // ==========================================
  
  // 1. Naming & SEO Engine[cite: 15]
  const categoryName = product.category?.name || 'exclusive-collection';
  const collectionName = product.collection?.name ? `-${product.collection.name}` : '';
  const computedTitle = `${categoryName} ${collectionName}`.trim().replace(/^-/, '');
  
  // Format into a clean, lower-case URL string (e.g., "premium-wigs-body-wave")[cite: 15]
  const seoSlug = computedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  // Combine SEO Slug + Secure Reference (e.g., "/product/premium-wigs-PRD-8F2A9B")[cite: 15]
  const secureProductUrl = `/product/${seoSlug}-${product.ref_id}`;

  // 2. The Financial & Inventory Engine[cite: 15]
  const prices = product.variants.map((v) => Number(v.discount_price_kes || v.price_kes));
  const minPrice = Math.min(...prices);
  const hasMultiplePrices = new Set(prices).size > 1;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
  const isSoldOut = totalStock === 0;

  // 3. Sale Detection[cite: 15]
  const minPriceVariant = product.variants.find(v => Number(v.discount_price_kes || v.price_kes) === minPrice);
  const isOnSale = !!minPriceVariant?.discount_price_kes;
  const originalPrice = Number(minPriceVariant?.price_kes || 0);

  // 4. Media Sorting[cite: 15]
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

  // Helper for Product Type Icon[cite: 15]
  const TypeIcon = product.product_type === 'accessory' ? Sparkles : product.product_type === 'haircare' ? SprayCan : Scissors;

  return (
    <div className="group relative flex flex-col w-full gap-3">
      
      {/* 1. MEDIA CONTAINER */}
      <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 isolate shadow-sm border border-border/40 transition-all duration-500 hover:shadow-xl hover:border-border/80">
        
        {/* FIX 1: Applied the new SEO secure URL */}
        <Link 
          href={secureProductUrl} 
          className="absolute inset-0 z-10" 
          aria-label={`View details for ${computedTitle}`} 
        />

        {/* Dynamic Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-3 pointer-events-none items-start">
          
          {isSoldOut ? (
            <div className="transform -rotate-2 drop-shadow-md">
              <span className="bg-background/90 backdrop-blur-md text-foreground/60 text-[9px] md:text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1.5 rounded-md border-2 border-dashed border-border/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-pulse" />
                Sold Out
              </span>
            </div>
          ) : isOnSale ? (
            <div className="transform rotate-3">
              <span className="bg-gradient-to-tr from-rose-500 to-red-600 text-white text-[9px] md:text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1.5 rounded-md shadow-[0_4px_20px_rgba(225,29,72,0.45)] border border-white/20 flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                </span>
                Sale
              </span>
            </div>
          ) : product.base_attributes?.isNew ? (
            <div className="transform -rotate-3">
              <span className="bg-gradient-to-tr from-emerald-500 to-teal-400 text-white text-[9px] md:text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1.5 rounded-md shadow-[0_4px_20px_rgba(16,185,129,0.35)] border border-white/20 flex items-center gap-1.5">
                <span className="animate-pulse">✨</span>
                New Arrival
              </span>
            </div>
          ) : null}

        </div>

        {/* Carousel Images */}
        <div 
          className="flex w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {validImages.map((img) => (
            <div key={img.id} className="relative w-full h-full flex-shrink-0">
              <Image
                src={img.url}
                alt={computedTitle}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Desktop Carousel Navigation */}
        {validImages.length > 1 && !isCompact && (
          <div className="hidden md:block">
            <button 
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/90 text-foreground transition-all duration-300 hover:scale-110 hover:bg-background shadow-md disabled:hidden opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button 
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/90 text-foreground transition-all duration-300 hover:scale-110 hover:bg-background shadow-md disabled:hidden opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
              disabled={currentIndex === validImages.length - 1}
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Quick Add Button */}
        {!isSoldOut && (
          <div className={`absolute left-0 right-0 z-30 transition-all duration-500 ease-out ${
            isCompact 
              ? 'bottom-2 px-2 opacity-100' 
              : 'bottom-0 p-3 opacity-100 translate-y-0 md:opacity-0 md:translate-y-full md:group-hover:translate-y-0 md:group-hover:opacity-100'
          }`}>
            <button
              onClick={() => setIsModalOpen(true)}
              className={`w-full flex items-center justify-center gap-2 bg-background/95 backdrop-blur-sm hover:bg-foreground hover:text-background text-foreground rounded-lg font-bold tracking-wide transition-all duration-300 shadow-xl active:scale-95 border border-border/20 ${
                isCompact ? 'py-2 text-[11px]' : 'py-3 text-xs'
              }`}
            >
              <ShoppingBag size={isCompact ? 14 : 16} strokeWidth={2} /> 
              {isCompact ? 'Add' : 'Quick Add'}
            </button>
          </div>
        )}
      </div>

      {/* 2. TYPOGRAPHY & DATA CONTAINER */}
      {/* FIX 2: Applied the new SEO secure URL */}
      <Link href={secureProductUrl} className="flex flex-col items-start px-1 group-hover:opacity-90 transition-opacity">
        
        {/* FIX 3: Removed `secureRef` span completely to hide IDs from public view */}
        <div className={`flex items-center w-full mb-1.5 ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
          <span className="flex items-center gap-1 text-muted-foreground uppercase font-bold tracking-wider">
            <TypeIcon size={10} /> {product.product_type}
          </span>
        </div>

        {/* Computed Title */}
        <h3 className={`font-serif font-bold text-foreground leading-tight line-clamp-2 transition-colors ${
          isCompact ? 'text-sm' : 'text-base'
        }`}>
          {computedTitle}
        </h3>

        {/* Price Ledger */}
        <div className={`flex items-end gap-2 mt-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {hasMultiplePrices && !isOnSale && (
            <span className="font-medium text-muted-foreground text-[10px] md:text-xs mb-0.5">From</span>
          )}
          
          <span className={`font-bold tracking-tight ${isOnSale ? 'text-destructive' : 'text-foreground'}`}>
            {formatKES(minPrice)}
          </span>

          {isOnSale && (
            <span className="font-medium text-muted-foreground line-through text-[10px] md:text-xs mb-[1px]">
              {formatKES(originalPrice)}
            </span>
          )}
        </div>
      </Link>

      <QuickAddModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={{ ...product, title: computedTitle } as unknown as Product & { title: string }}
      />
    </div>
  );
}