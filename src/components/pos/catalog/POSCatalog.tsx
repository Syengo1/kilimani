'use client';

import { useState, useMemo, useDeferredValue, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, X } from 'lucide-react';
import Image from 'next/image';
import { usePOSStore, POSProduct, POSVariant } from '../store/posStore';
import { POSSearchBar } from './POSSearchBar';

const triggerHaptic = (intensity: 'light' | 'medium' = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(intensity === 'light' ? 30 : 50);
};

// ==========================================
// ENTERPRISE OPTIMIZATION: Memoized Card
// Prevents the background grid from re-rendering when the modal opens/closes
// ==========================================
const CatalogCard = memo(({ 
  product, 
  index, 
  onTap 
}: { 
  product: POSProduct; 
  index: number; 
  onTap: (p: POSProduct) => void;
}) => {
  const primaryImage = product.images?.[0]?.url || '/images/placeholder.jpg';
  const totalStock = product.variants.reduce((acc, v) => acc + (v.stock_quantity || 0), 0);
  const isOut = totalStock <= 0;
  
  const displaySku = product.variants.length === 1 ? product.variants[0].sku : product.ref_id;
  const firstVariant = product.variants[0];
  const basePrice = Number(firstVariant?.price_kes || 0);
  const discountRaw = firstVariant?.discount_price_kes;
  const isSale = discountRaw && Number(discountRaw) < basePrice;
  const activePrice = isSale ? Number(discountRaw) : basePrice;

  return (
    <motion.button
      layoutId={`product-${product.id}`}
      onClick={() => onTap(product)}
      disabled={isOut}
      className={`group relative flex flex-col text-left bg-background border border-border/60 rounded-xl p-2 shadow-sm transition-all active:scale-95 touch-manipulation h-[160px] ${
        isOut ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-primary/40 hover:shadow-md'
      }`}
    >
      <div className="w-full h-20 relative rounded-lg overflow-hidden bg-foreground/5 mb-2 shrink-0">
        <Image 
          src={primaryImage} 
          alt={product.title} 
          fill 
          sizes="(max-width: 768px) 33vw, 15vw" 
          className="object-cover" 
          priority={index < 10} // 🔥 FIX: Only eager-load the first 10 images (Above the fold LCP)
        />
        
        <div className="absolute top-1 left-1 flex flex-col gap-1">
          {isSale && !isOut && (
            <span className="bg-destructive text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm">SALE</span>
          )}
        </div>

        {isOut && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-lg">Out</span>
          </div>
        )}
        {product.variants.length > 1 && !isOut && (
          <div className="absolute bottom-1 right-1 bg-background/90 backdrop-blur-md text-foreground text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            {product.variants.length} Opts
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-1 w-full justify-between overflow-hidden">
        <div>
          <h3 className="text-xs sm:text-sm font-mono font-black text-foreground truncate w-full" title={displaySku}>{displaySku}</h3>
          <p className="text-[9px] font-medium text-muted-foreground truncate w-full mt-0.5" title={product.title}>{product.title}</p>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5 w-full">
          <p className="text-xs sm:text-sm font-black text-primary tracking-tight">{activePrice.toLocaleString()}</p>
          {isSale && <p className="text-[9px] font-bold text-muted-foreground line-through">{basePrice.toLocaleString()}</p>}
        </div>
      </div>
    </motion.button>
  );
});
CatalogCard.displayName = 'CatalogCard';


// ==========================================
// MAIN CATALOG COMPONENT
// ==========================================
export function POSCatalog() {
  const { catalog, addToTicket } = usePOSStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  // 🔥 ENTERPRISE OPTIMIZATION: React 18 Deferred Value
  // This keeps the text input butter-smooth while the heavy filtering happens in the background.
  const deferredSearchQuery = useDeferredValue(searchQuery); 
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<POSProduct | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(catalog.map(p => p.product_type || 'General'));
    return ['All', ...Array.from(cats)];
  }, [catalog]);

  // Deep Fuzzy Search Engine (Now uses the deferred background query)
  const filteredCatalog = useMemo(() => {
    const query = deferredSearchQuery.toLowerCase().trim();
    return catalog.filter(product => {
      const matchesSearch = 
        product.title.toLowerCase().includes(query) || 
        product.ref_id.toLowerCase().includes(query) ||
        product.variants.some(v => v.sku?.toLowerCase().includes(query));
      
      const matchesCategory = activeCategory === 'All' || product.product_type === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [catalog, deferredSearchQuery, activeCategory]);

  // 🔥 ENTERPRISE OPTIMIZATION: useCallback 
  // Locks the function in memory so the Memoized CatalogCards don't re-render
  const handleProductTap = useCallback((product: POSProduct) => {
    triggerHaptic('light');
    if (product.variants.length === 1) {
      const variant = product.variants[0];
      if (variant.stock_quantity <= 0) return; 
      addToTicket({
        variantId: variant.id, 
        productId: product.id,
        title: product.title, 
        sku: variant.sku,
        price: Number(variant.discount_price_kes || variant.price_kes),
        quantity: 1, 
        image: product.images?.[0]?.url || '/images/placeholder.jpg',
        maxStock: variant.stock_quantity
      });
      return;
    }
    setSelectedProduct(product);
  }, [addToTicket]);

  const handleVariantAdd = useCallback((product: POSProduct, variant: POSVariant) => {
    triggerHaptic('medium');
    const lengthRaw = variant.variant_attributes?.length;
    const lengthLabel = lengthRaw ? lengthRaw.replace(/["\\]/g, '') + '"' : '';

    addToTicket({
      variantId: variant.id, 
      productId: product.id,
      title: `${product.title} ${lengthLabel}`.trim(), 
      sku: variant.sku,
      price: Number(variant.discount_price_kes || variant.price_kes),
      quantity: 1, 
      image: product.images?.[0]?.url || '/images/placeholder.jpg',
      maxStock: variant.stock_quantity
    });
    setSelectedProduct(null);
  }, [addToTicket]);

  return (
    <div className="flex flex-col h-full bg-stone-100/50 dark:bg-card relative">
      
      {/* HEADER & FILTERS */}
      <div className="p-3 border-b border-border/50 shrink-0 space-y-3 bg-background/95 backdrop-blur-xl z-20">
        <POSSearchBar query={searchQuery} setQuery={setSearchQuery} />

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); triggerHaptic(); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all active:scale-95 touch-manipulation ${
                activeCategory === cat ? 'bg-foreground text-background shadow-md' : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID WORKSPACE */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-3">
        {filteredCatalog.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3 opacity-60">
            <Layers size={48} strokeWidth={1.5} />
            <p className="text-sm font-semibold">No products match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 pb-32">
            {filteredCatalog.map((product, index) => (
              <CatalogCard 
                key={product.id} 
                product={product} 
                index={index} 
                onTap={handleProductTap} 
              />
            ))}
          </div>
        )}
      </div>

      {/* RAPID VARIANT SELECTOR MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-background/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-background border-t border-border/50 rounded-t-2xl shadow-2xl z-50 p-4 pb-[max(env(safe-area-inset-bottom),1rem)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base">{selectedProduct.title}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">{selectedProduct.ref_id}</p>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="p-2 bg-foreground/5 rounded-full"><X size={16} /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
                {selectedProduct.variants.map((v) => {
                  const isOut = v.stock_quantity <= 0;
                  const lengthRaw = v.variant_attributes?.length;
                  const label = lengthRaw ? lengthRaw.replace(/["\\]/g, '') + '"' : 'Base';
                  
                  const baseVariantPrice = Number(v.price_kes || 0);
                  const isVariantSale = v.discount_price_kes && Number(v.discount_price_kes) < baseVariantPrice;
                  const activeVariantPrice = isVariantSale ? Number(v.discount_price_kes) : baseVariantPrice;

                  return (
                    <button
                      key={v.id} disabled={isOut} onClick={() => handleVariantAdd(selectedProduct, v)}
                      className={`flex flex-col items-start justify-center p-3 rounded-xl border transition-all active:scale-95 touch-manipulation ${
                        isOut ? 'opacity-40 border-border/50 bg-foreground/5' : 'border-border bg-background shadow-sm hover:border-primary hover:shadow-md'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-muted-foreground mb-1 w-full truncate text-left">{v.sku}</span>
                      <span className="font-bold text-foreground text-xs">{label}</span>
                      
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[10px] font-black text-primary">KES {activeVariantPrice.toLocaleString()}</span>
                        {isVariantSale && (
                          <span className="text-[8px] font-bold text-muted-foreground line-through">{baseVariantPrice.toLocaleString()}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}