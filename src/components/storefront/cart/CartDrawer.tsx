'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, AlertTriangle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { 
    items, isHydrated, updateQuantity, removeFromCart, acceptPriceChanges, 
    hasStaleData, isValidating, validateCart 
  } = useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      validateCart(); 
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, validateCart]);

  if (!isHydrated) return null;

  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const isCartEmpty = items.length === 0;

  const formatKES = (val: number) => `KES ${val.toLocaleString('en-US')}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md h-full bg-background border-l border-border/50 shadow-2xl flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 shrink-0 bg-background z-10">
              <h2 className="font-serif font-bold text-xl tracking-wide flex items-center gap-2">
                <ShoppingBag size={20} /> Your Cart
                {isValidating && <RefreshCw size={14} className="animate-spin text-muted-foreground ml-2" />}
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
                    <div key={item.variantId} className="flex flex-col gap-3 group">
                      
                      {/* Main Item Row */}
                      <div className="flex gap-4">
                        <div className="w-20 h-24 relative rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-border/50">
                          <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                        </div>

                        <div className="flex flex-col flex-1 justify-between py-0.5">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                              {item.title}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.variantId)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          {item.length && <p className="text-xs text-muted-foreground">{item.length}</p>}

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-border/50 rounded-lg bg-background/50">
                              <button
                                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                disabled={item.liveStock !== undefined && item.quantity >= item.liveStock}
                                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="text-sm font-bold text-foreground">
                              {formatKES(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONABLE STALE DATA RESOLUTION UI */}
                      {item.isStale && (
                        <div className="flex flex-col gap-2 bg-destructive/10 border border-destructive/20 p-3 rounded-xl animate-in fade-in zoom-in-95 duration-300">
                          <div className="flex items-start gap-2 text-destructive">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <span className="text-xs font-medium leading-relaxed">
                              {item.staleReason === 'OUT_OF_STOCK' && 'This item is no longer available.'}
                              {item.staleReason === 'PRICE_CHANGED' && `The price changed from ${formatKES(item.price)} to ${formatKES(item.livePrice!)}.`}
                              {item.staleReason === 'INSUFFICIENT_STOCK' && `Only ${item.liveStock} units left in stock.`}
                            </span>
                          </div>
                          
                          {/* Resolution Buttons */}
                          <div className="flex gap-2 ml-5">
                            {item.staleReason === 'PRICE_CHANGED' && (
                              <button 
                                onClick={() => acceptPriceChanges(item.variantId, item.livePrice!)}
                                className="text-[10px] uppercase tracking-wider font-bold bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md hover:opacity-90 active:scale-95 transition-all"
                              >
                                Accept New Price
                              </button>
                            )}
                            {item.staleReason === 'INSUFFICIENT_STOCK' && (
                              <button 
                                onClick={() => updateQuantity(item.variantId, item.liveStock!)}
                                className="text-[10px] uppercase tracking-wider font-bold bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md hover:opacity-90 active:scale-95 transition-all"
                              >
                                Adjust to {item.liveStock}
                              </button>
                            )}
                            {(item.staleReason === 'OUT_OF_STOCK' || item.staleReason === 'INSUFFICIENT_STOCK') && (
                              <button 
                                onClick={() => removeFromCart(item.variantId)}
                                className="text-[10px] uppercase tracking-wider font-bold border border-destructive/40 text-destructive px-3 py-1.5 rounded-md hover:bg-destructive/10 active:scale-95 transition-all"
                              >
                                Remove Item
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Action Footer */}
            {!isCartEmpty && (
              <div className="p-6 border-t border-border/50 bg-background/95 backdrop-blur-md shrink-0 pb-safe">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Subtotal</span>
                  <span className="text-xl font-serif font-bold text-foreground">
                    {formatKES(subtotal)}
                  </span>
                </div>
                
                <Link
                  href="/checkout"
                  onClick={(e) => {
                    if (hasStaleData) e.preventDefault();
                    else onClose();
                  }}
                  className={`w-full flex items-center justify-center py-4 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 shadow-lg ${
                    hasStaleData 
                      ? 'bg-destructive/10 text-destructive border border-destructive/20 cursor-not-allowed shadow-none'
                      : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
                  }`}
                  aria-disabled={hasStaleData}
                >
                  {hasStaleData ? 'Resolve Cart Errors to Proceed' : 'Secure Checkout'}
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