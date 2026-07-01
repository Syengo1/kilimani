'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Check, ShieldCheck, Truck } from 'lucide-react';
import Image from 'next/image';

export interface ShopProduct {
  id: string;
  ref_id: string;
  product_type: string;
  description: string;
  base_attributes?: Record<string, unknown> | null; 
  product_images?: { url: string }[];
  product_variants?: { id: string; price?: number; price_kes?: number; stock_quantity: number }[];
}

interface QuickViewProps {
  product: ShopProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewSheet({ product, isOpen, onClose }: QuickViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  
  // State to track the previously viewed product ID
  const [activeProductId, setActiveProductId] = useState<string | undefined>(undefined);

  // ==========================================
  // FIX: RENDER PHASE STATE UPDATE
  // ==========================================
  // This replaces the old useEffect. If the product changes, we instantly reset 
  // the cart button states without triggering a cascading re-render.
  if (product?.id !== activeProductId) {
    setActiveProductId(product?.id);
    setIsAdding(false);
    setIsAdded(false);
  }

  // Lock body scroll to prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!product) return null;

  // Extremely safe JSONB extraction (defaults to {} if null)
  const attrs = (product.base_attributes || {}) as Record<string, unknown>;
  const name = (typeof attrs?.name === 'string' ? attrs.name : null)
            || (typeof attrs?.title === 'string' ? attrs.title : null)
            || product.ref_id;
            
  // Safely grab either 'price_kes' or 'price' based on the DB fetch
  const price = product.product_variants?.[0]?.price_kes || product.product_variants?.[0]?.price || 0;
  const imageUrl = product.product_images?.[0]?.url || '/placeholder-hair.jpg';
  const inStock = (product.product_variants?.[0]?.stock_quantity || 0) > 0;

  const handleAddToCart = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
    setIsAdding(true);
    
    // Simulate optimistic UI database sync
    setTimeout(() => {
      setIsAdding(false);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose} 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
            aria-hidden="true" 
          />

          {/* Slide-Out Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={name}
            initial={{ x: '100%', y: 0 }} 
            animate={{ x: 0, y: 0 }} 
            exit={{ x: '100%', y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-background border-l border-border/50 shadow-2xl z-[110] flex flex-col sm:max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/50 shrink-0">
              <h3 className="font-serif font-black text-lg tracking-tight">Quick View</h3>
              <button 
                onClick={onClose} 
                aria-label="Close details"
                className="p-2 rounded-full hover:bg-foreground/5 transition-colors active:scale-95"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
              
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-foreground/5 border border-border/50">
                <Image 
                  src={imageUrl} 
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, 450px"
                  className="object-cover"
                />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  {product.product_type.replace('_', ' ')}
                </p>
                <h2 className="text-2xl font-serif font-black text-foreground leading-tight">{name}</h2>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-2">
                  KES {price.toLocaleString()}
                </p>
              </div>

              <div className="w-full h-px bg-border/50" />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck size={16} className="text-primary" /> 100% Premium Quality
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Truck size={16} className="text-primary" /> Same Day Delivery
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-2">Details</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description || "Premium quality hair extension. Designed for maximum comfort, durability, and a flawless natural finish."}
                </p>
              </div>
            </div>

            {/* Footer / Add to Cart */}
            <div className="p-5 border-t border-border/50 bg-background/95 backdrop-blur-md shrink-0">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || isAdding || isAdded}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                  !inStock 
                    ? 'bg-foreground/10 text-muted-foreground cursor-not-allowed' 
                    : isAdded 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'bg-foreground text-background hover:opacity-90 shadow-xl'
                }`}
              >
                {!inStock ? (
                  'Out of Stock'
                ) : isAdded ? (
                  <><Check size={18} strokeWidth={3} /> Added to Cart</>
                ) : (
                  <><ShoppingBag size={18} strokeWidth={2.5} /> Add to Cart — KES {price.toLocaleString()}</>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}