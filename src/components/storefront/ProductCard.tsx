'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

// Interfaces directly mirroring your Supabase schema relationships
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
  images: ProductImage[];
  variants: ProductVariant[];
  base_attributes?: {
    isNew?: boolean;
    label?: string;
  };
}

export default function ProductCard({ product }: { product: Product }) {
  const [isAdding, setIsAdding] = useState(false);

  // Intelligent Pricing Logic: Find the lowest price if multiple variants exist
  const minPrice = Math.min(...product.variants.map((v) => v.price_kes));
  const hasMultiplePrices = product.variants.some((v) => v.price_kes !== minPrice);
  
  // Stock Calculation
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
  const isSoldOut = totalStock === 0;

  // Image Handling: Sort by display_order to ensure consistency
  const sortedImages = [...product.images].sort((a, b) => a.display_order - b.display_order);
  const primaryImage = sortedImages[0]?.url || '/images/placeholder-hair.jpg';
  const secondaryImage = sortedImages[1]?.url; // Used for the "aware" hover cross-fade

  // Currency Formatter
  const formatKES = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the product page
    setIsAdding(true);
    
    // Simulate API call for adding to cart
    await new Promise(resolve => setTimeout(resolve, 600));
    setIsAdding(false);
    
    // Trigger your global cart drawer/toast here
  };

  return (
    <Link href={`/product/${product.id}`} className="group flex flex-col gap-4 block w-full">
      {/* Editorial Image Container - Portrait 4:5 Aspect Ratio */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-stone-100 dark:bg-[#121211]">
        
        {/* Badges / Labels */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          {isSoldOut && (
            <span className="bg-stone-900 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 shadow-sm">
              Sold Out
            </span>
          )}
          {product.base_attributes?.isNew && !isSoldOut && (
            <span className="bg-amber-600 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 shadow-sm">
              New Arrival
            </span>
          )}
        </div>

        {/* Primary Image */}
        <Image
          src={primaryImage}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className={`object-cover transition-all duration-1000 ease-out 
            ${secondaryImage ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-105'}`}
        />

        {/* Secondary "Aware" Hover Image */}
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={`${product.title} alternate view`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover opacity-0 scale-100 transition-all duration-1000 ease-out group-hover:opacity-100 group-hover:scale-105"
          />
        )}

        {/* Hover Gradient Overlay (Ensures button text is always readable) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Quick Add Button - Slides up from the bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full opacity-0 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) group-hover:translate-y-0 group-hover:opacity-100 z-20">
          <button
            onClick={handleQuickAdd}
            disabled={isSoldOut || isAdding}
            className="w-full flex items-center justify-center gap-2 bg-white/95 backdrop-blur-sm hover:bg-amber-600 hover:text-white text-stone-900 py-3.5 px-4 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isAdding ? (
              <span className="animate-pulse">Adding...</span>
            ) : isSoldOut ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingBag size={16} strokeWidth={1.5} />
                Quick Add
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Details - Borderless and Clean */}
      <div className="flex flex-col items-start px-1">
        <h3 className="text-sm font-medium text-foreground tracking-wide mb-1.5 transition-colors group-hover:text-primary">
          {product.title}
        </h3>
        
        <p className="text-sm font-light text-stone-500 dark:text-stone-400">
          {hasMultiplePrices ? 'From ' : ''}
          <span className={hasMultiplePrices ? 'text-foreground font-medium' : ''}>
            {formatKES(minPrice)}
          </span>
        </p>
      </div>
    </Link>
  );
}