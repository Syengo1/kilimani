'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickViewSheet } from './QuickViewSheet';
import { PackageX } from 'lucide-react';
import Image from 'next/image';

// 1. Updated Interface to include the new 'name' field
export interface ShopProduct {
  id: string;
  ref_id: string;
  name: string; // The new dedicated column
  product_type: string;
  description: string;
  base_attributes?: Record<string, unknown> | null;
  product_images?: { url: string }[];
  product_variants?: { id: string; price?: number; price_kes?: number; stock_quantity: number }[];
}

export function ProductGrid({ products }: { products: ShopProduct[] }) {
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);

  if (products.length === 0) {
    return (
      <div className="w-full h-96 border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
        <PackageX size={48} className="mb-4 opacity-20" />
        <h3 className="font-serif font-black text-xl text-foreground">No Products Found</h3>
        <p className="text-sm mt-1">Try adjusting your filters or category.</p>
      </div>
    );
  }

  return (
    <>
      {/* 2. UI FIX: Increased column count for desktop to shrink card sizes */}
      <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {products.map((product, index) => {
            
            // 3. Directly use the new name column
            const displayName = product.name || product.ref_id;
            const price = product.product_variants?.[0]?.price_kes || product.product_variants?.[0]?.price || 0;
            const imageUrl = product.product_images?.[0]?.url || '/placeholder-hair.jpg';
            const isPriority = index < 4;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25, type: 'spring', stiffness: 250, damping: 25 }}
                key={product.id} onClick={() => setSelectedProduct(product)} className="group flex flex-col cursor-pointer"
              >
                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-foreground/5 border border-border/50 mb-3 shadow-sm transition-shadow group-hover:shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                    <span className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-xl">
                      Quick View
                    </span>
                  </div>

                  <Image
                    src={imageUrl}
                    alt={displayName}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    priority={isPriority}
                  />
                </div>

                <div className="px-1 flex flex-col flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    {product.product_type.replace('_', ' ')}
                  </p>
                  <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-2">
                    {displayName}
                  </h3>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <p className="font-black text-sm text-emerald-600 dark:text-emerald-500">
                      KES {price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <QuickViewSheet product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}