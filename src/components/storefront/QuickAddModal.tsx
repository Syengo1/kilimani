'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useCart } from './cart/CartContext';
import { Product, ProductVariant } from './ProductCard';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function QuickAddModal({ isOpen, onClose, product }: QuickAddModalProps) {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Safely extract and clean the length from the JSONB attribute (e.g., converts '18\"' to '18')
  const getCleanLength = (variant: ProductVariant | null) => {
    if (!variant) return null;
    const raw = variant.variant_attributes?.length as string | undefined;
    if (!raw) return null;
    return raw.replace(/["\\]/g, ''); // Strips out database escape characters
  };

  // 1. Initial State Setup & Mathematical Sorting
  useEffect(() => {
    if (isOpen && product.variants.length > 0) {
      const timer = setTimeout(() => {
        // Sort variants by price mathematically safely
        const sortedVariants = [...product.variants].sort((a, b) => Number(a.price_kes) - Number(b.price_kes));
        const firstAvailable = sortedVariants.find((v) => v.stock_quantity > 0) || sortedVariants[0];
        
        setSelectedVariant(firstAvailable);
        setIsSuccess(false); 
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, product]);

  // 2. Mobile Scroll Lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const primaryImage = [...product.images].sort((a, b) => a.display_order - b.display_order)[0]?.url || '/images/placeholder-hair.jpg';
  const selectedLength = getCleanLength(selectedVariant);

  // 3. The Dispatch Engine
  const handleConfirmAdd = async () => {
    if (!selectedVariant || selectedVariant.stock_quantity === 0) return;
    
    setIsAdding(true);
    
    // Simulate brief network delay for premium tactical feedback
    await new Promise(resolve => setTimeout(resolve, 500)); 

    addToCart({
      variantId: selectedVariant.id,
      productId: product.id,
      // Appends the cleanly formatted size to the cart title for clarity
      title: `${product.title} ${selectedLength ? `(${selectedLength}")` : ''}`.trim(),
      price: Number(selectedVariant.price_kes), 
      quantity: 1,
      image: primaryImage
    });

    setIsAdding(false);
    setIsSuccess(true);
    
    // Auto-close gracefully after success
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
        
        {/* Darkened Blur Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
        />

        {/* Modal Container: Bottom sheet on mobile, centered card on desktop */}
        <motion.div
          initial={{ y: '100%', scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: '100%', scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-background border border-border/50 shadow-2xl rounded-t-3xl md:rounded-3xl overflow-hidden pointer-events-auto pb-safe flex flex-col max-h-[85vh]"
        >
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
            <h3 className="font-serif font-bold text-lg text-foreground tracking-tight">Select Options</h3>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 hover:text-foreground transition-colors active:scale-95"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Workspace */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            
            {/* Product Summary */}
            <div className="flex gap-5 mb-8">
              <div className="w-24 h-28 relative rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-border/50 shadow-sm">
                <Image src={primaryImage} alt={product.title} fill sizes="96px" className="object-cover" />
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="font-medium text-foreground text-sm tracking-wide leading-snug">{product.title}</h4>
                <p className="text-primary font-semibold mt-2 text-xl tracking-tight">
                  KES {Number(selectedVariant?.price_kes || 0).toLocaleString('en-US')}
                </p>
                
                {/* Dynamic Scarcity Indicator */}
                {selectedVariant && selectedVariant.stock_quantity > 0 && selectedVariant.stock_quantity <= 5 && (
                  <div className="flex items-center gap-1.5 mt-2 text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md w-fit">
                    <AlertCircle size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Only {selectedVariant.stock_quantity} left
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Length / Inches Selection Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Length Selection
                </label>
                {selectedLength && (
                  <span className="text-xs font-medium text-foreground">
                    {selectedLength} Inches
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {product.variants.map((variant) => {
                  const isOutOfStock = variant.stock_quantity === 0;
                  const isSelected = selectedVariant?.id === variant.id;
                  const rawLen = variant.variant_attributes?.length as string | undefined;
                  const cleanLen = rawLen ? rawLen.replace(/["\\]/g, '') : 'Std';

                  return (
                    <button
                      key={variant.id}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedVariant(variant)}
                      className={`relative flex items-center justify-center py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                        isSelected 
                          ? 'border-primary bg-primary text-primary-foreground shadow-md scale-[0.98]' 
                          : isOutOfStock
                            ? 'border-border/40 bg-foreground/5 text-foreground/30 cursor-not-allowed'
                            : 'border-border hover:border-foreground/30 text-foreground/80 hover:bg-foreground/5 active:scale-95'
                      }`}
                    >
                      {cleanLen}{rawLen ? '"' : ''}
                      
                      {/* Diagonal Slash for Sold Out Items */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                          <div className="w-full h-[1.5px] bg-foreground/20 -rotate-12 absolute" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-5 border-t border-border/50 bg-background/95 backdrop-blur-md shrink-0">
            <button
              onClick={handleConfirmAdd}
              disabled={isAdding || isSuccess || !selectedVariant || selectedVariant.stock_quantity === 0}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 shadow-lg ${
                isSuccess 
                  ? 'bg-green-500 text-white shadow-green-500/30'
                  : 'bg-foreground text-background hover:bg-foreground/90 shadow-foreground/20 active:scale-[0.98]'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isAdding ? (
                <span className="animate-pulse flex items-center gap-2">
                  <ShoppingBag size={18} strokeWidth={2} /> Securing...
                </span>
              ) : isSuccess ? (
                <><Check size={18} strokeWidth={2.5} /> Added to Cart</>
              ) : (
                <>
                  <ShoppingBag size={18} strokeWidth={2} /> 
                  Add {selectedLength ? `${selectedLength}" ` : ''}to Cart
                </>
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}