'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, isHydrated, updateQuantity, removeFromCart, hasStaleData, validateCart } = useCart();

  // Lock background scrolling when the drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      validateCart(); // Trigger a live database check every time they open the drawer
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, validateCart]);

  if (!isHydrated) return null;

  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const isCartEmpty = items.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md h-full bg-background border-l border-border/50 shadow-2xl flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 shrink-0">
              <h2 className="font-serif font-bold text-xl tracking-wide flex items-center gap-2">
                <ShoppingBag size={20} /> Your Cart
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {isCartEmpty ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-70 space-y-4">
                  <ShoppingBag size={48} strokeWidth={1} className="text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium text-foreground">Your cart is empty</h3>
                    <p className="text-sm text-muted-foreground mt-1">Discover our premium collections.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-2.5 bg-foreground/5 hover:bg-foreground/10 text-foreground font-medium rounded-full transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-4 group">
                      {/* Item Image */}
                      <div className="w-20 h-24 relative rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-border/50">
                        <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                      </div>

                      {/* Item Details */}
                      <div className="flex flex-col flex-1 justify-between py-0.5">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                            {item.title}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.variantId)}
                            className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Stale Data Warning Engine */}
                        {item.isStale && (
                          <div className="flex items-start gap-1.5 mt-1 text-red-500 bg-red-500/10 px-2 py-1.5 rounded-md">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                              {item.staleReason === 'OUT_OF_STOCK' && 'Out of stock'}
                              {item.staleReason === 'PRICE_CHANGED' && 'Price updated'}
                              {item.staleReason === 'INSUFFICIENT_STOCK' && `Only ${item.liveStock} left`}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity Stepper */}
                          <div className="flex items-center border border-border/50 rounded-lg bg-background/50">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-xs font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              disabled={item.liveStock !== undefined && item.quantity >= item.liveStock}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <span className="text-sm font-bold text-foreground">
                            KES {(item.price * item.quantity).toLocaleString('en-US')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Checkout Action */}
            {!isCartEmpty && (
              <div className="p-6 border-t border-border/50 bg-background/95 backdrop-blur-md shrink-0 pb-safe">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Subtotal</span>
                  <span className="text-xl font-serif font-bold text-foreground">
                    KES {subtotal.toLocaleString('en-US')}
                  </span>
                </div>
                
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className={`w-full flex items-center justify-center py-4 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 shadow-lg ${
                    hasStaleData 
                      ? 'bg-foreground/10 text-foreground/50 cursor-not-allowed shadow-none'
                      : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
                  }`}
                  style={{ pointerEvents: hasStaleData ? 'none' : 'auto' }}
                >
                  {hasStaleData ? 'Resolve Cart Errors to Checkout' : 'Secure Checkout'}
                </Link>
                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest mt-4">
                  Taxes and shipping calculated at checkout
                </p>
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}