'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, AlertTriangle, RefreshCw, CheckCircle2, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Configurable threshold for the conversion booster
const FREE_SHIPPING_THRESHOLD = 50000; 

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { 
    items, isHydrated, updateQuantity, removeFromCart, acceptPriceChanges, 
    isValidating, validateCart 
  } = useCart();

  // ==========================================
  // DYNAMIC FINANCIAL ENGINES
  // ==========================================
  const subtotal = useMemo(() => items.reduce((total, item) => total + (item.price * item.quantity), 0), [items]);
  
  const totalSavings = useMemo(() => items.reduce((total, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return total + ((item.originalPrice - item.price) * item.quantity);
    }
    return total;
  }, 0), [items]);

  const isCartEmpty = items.length === 0;
  const hasStaleData = useMemo(() => items.some(i => i.isStale), [items]);

  // Shipping Progress Engine
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  const formatKES = (val: number) => `KES ${val.toLocaleString('en-US')}`;

  // Smart Validation & Scroll Locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      validateCart(); 
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, validateCart]);

  if (!isHydrated) return null;

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
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="relative w-full max-w-md h-[100dvh] bg-background border-l border-border/50 shadow-2xl flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 shrink-0 bg-background/95 backdrop-blur-md z-20">
              <h2 className="font-serif font-bold text-xl tracking-wide flex items-center gap-3">
                <ShoppingBag size={20} className="text-primary" /> 
                Your Cart
                {isValidating && <RefreshCw size={14} className="animate-spin text-muted-foreground ml-1" />}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all active:scale-90"
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Shipping Progress Bar Booster */}
            {!isCartEmpty && (
              <div className="px-6 py-4 bg-foreground/[0.02] border-b border-border/30 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-foreground/80">
                    {hasFreeShipping ? '🎉 You unlocked Free Shipping!' : `Spend ${formatKES(amountToFreeShipping)} more for Free Shipping`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-border/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${shippingProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${hasFreeShipping ? 'bg-emerald-500' : 'bg-primary'}`}
                  />
                </div>
              </div>
            )}

            {/* Cart Items Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6">
              {isCartEmpty ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-5 animate-in fade-in duration-500">
                  <div className="w-24 h-24 bg-foreground/5 rounded-full flex items-center justify-center">
                    <ShoppingBag size={40} strokeWidth={1.5} className="text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-foreground">Your cart is empty</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-[250px] mx-auto">
                      Discover our premium collections and find your perfect match.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-4 px-8 py-3.5 bg-foreground text-background font-semibold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => {
                    const isOnSale = item.originalPrice && item.originalPrice > item.price;
                    const discountPercent = isOnSale ? Math.round((1 - (item.price / item.originalPrice!)) * 100) : 0;

                    return (
                      <div key={item.variantId} className="flex flex-col gap-4 group">
                        
                        {/* Main Item Row */}
                        <div className="flex gap-4">
                          <div className="w-[88px] h-[110px] relative rounded-xl overflow-hidden bg-foreground/5 shrink-0 border border-border/50">
                            <Image src={item.image} alt={item.title} fill sizes="88px" className="object-cover" />
                            {isOnSale && (
                              <div className="absolute top-0 left-0 bg-destructive text-destructive-foreground text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-br-lg z-10">
                                -{discountPercent}%
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col flex-1 justify-between py-1">
                            <div className="flex justify-between items-start gap-3">
                              <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                                {item.title}
                              </h4>
                              <button
                                onClick={() => removeFromCart(item.variantId)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1 -mr-1"
                                aria-label="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {item.length && <span className="text-xs text-muted-foreground font-medium">{item.length}</span>}
                              {item.sku && <span className="text-[9px] font-mono text-muted-foreground/60 uppercase border border-border/50 px-1 rounded">{item.sku}</span>}
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center border border-border/60 rounded-lg bg-background shadow-sm">
                                <button
                                  onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 active:bg-foreground/5 rounded-l-lg"
                                >
                                  <Minus size={14} strokeWidth={2.5} />
                                </button>
                                <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                  disabled={item.liveStock !== undefined && item.quantity >= item.liveStock}
                                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 active:bg-foreground/5 rounded-r-lg"
                                >
                                  <Plus size={14} strokeWidth={2.5} />
                                </button>
                              </div>
                              
                              {/* Item Pricing Engine */}
                              <div className="flex flex-col items-end">
                                <span className={`text-sm font-bold tracking-tight ${isOnSale ? 'text-destructive' : 'text-foreground'}`}>
                                  {formatKES(item.price * item.quantity)}
                                </span>
                                {isOnSale && (
                                  <span className="text-[10px] text-muted-foreground line-through font-medium mt-[1px]">
                                    {formatKES(item.originalPrice! * item.quantity)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* STALE DATA RESOLUTION UI */}
                        {item.isStale && (
                          <div className="flex flex-col gap-3 bg-destructive/[0.03] border border-destructive/20 p-4 rounded-xl animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-start gap-2.5 text-destructive">
                              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                              <span className="text-xs font-medium leading-relaxed">
                                {item.staleReason === 'OUT_OF_STOCK' && 'This item is no longer available.'}
                                {item.staleReason === 'PRICE_CHANGED' && `The price changed from ${formatKES(item.price)} to ${formatKES(item.livePrice!)}.`}
                                {item.staleReason === 'INSUFFICIENT_STOCK' && `Only ${item.liveStock} units left in stock.`}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 ml-6">
                              {item.staleReason === 'PRICE_CHANGED' && (
                                <button 
                                  onClick={() => acceptPriceChanges(item.variantId, item.livePrice!, item.liveOriginalPrice)}
                                  className="text-[11px] uppercase tracking-wider font-bold bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm"
                                >
                                  Accept New Price
                                </button>
                              )}
                              {item.staleReason === 'INSUFFICIENT_STOCK' && (
                                <button 
                                  onClick={() => updateQuantity(item.variantId, item.liveStock!)}
                                  className="text-[11px] uppercase tracking-wider font-bold bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm"
                                >
                                  Adjust to {item.liveStock}
                                </button>
                              )}
                              {(item.staleReason === 'OUT_OF_STOCK' || item.staleReason === 'INSUFFICIENT_STOCK') && (
                                <button 
                                  onClick={() => removeFromCart(item.variantId)}
                                  className="text-[11px] uppercase tracking-wider font-bold border border-destructive/40 text-destructive px-4 py-2 rounded-lg hover:bg-destructive/10 active:scale-95 transition-all"
                                >
                                  Remove Item
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="h-[1px] w-full bg-border/40 mt-1" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Checkout Action Footer */}
            {!isCartEmpty && (
              <div className="flex flex-col p-5 md:p-6 border-t border-border/50 bg-background/95 backdrop-blur-xl shrink-0 z-20 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                
                {/* Financial Summary */}
                <div className="space-y-2 mb-5">
                  {totalSavings > 0 && (
                    <div className="flex items-center justify-between text-sm font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <span className="flex items-center gap-1.5"><Tag size={14} /> Total Savings</span>
                      <span>-{formatKES(totalSavings)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Subtotal</span>
                    <span className="text-2xl font-serif font-black text-foreground tracking-tight">
                      {formatKES(subtotal)}
                    </span>
                  </div>
                </div>
                
                <Link
                  href="/checkout"
                  onClick={(e) => {
                    if (hasStaleData) e.preventDefault();
                    else onClose();
                  }}
                  className={`relative w-full flex items-center justify-center py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 overflow-hidden ${
                    hasStaleData 
                      ? 'bg-destructive/10 text-destructive border border-destructive/20 cursor-not-allowed shadow-none'
                      : 'bg-foreground text-background hover:opacity-90 hover:shadow-xl active:scale-[0.98]'
                  }`}
                  aria-disabled={hasStaleData}
                >
                  {hasStaleData ? 'Resolve Cart Errors to Proceed' : 'Proceed to Secure Checkout'}
                </Link>
                
                <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  Secure Encrypted Checkout
                </div>
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}