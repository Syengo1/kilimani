'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingBag, UserCircle2, ArrowRight, X } from 'lucide-react';
import Image from 'next/image';
import { usePOSStore } from '../store/posStore';
import { POSPaymentModal } from '../checkout/POSPaymentModal';

const triggerHaptic = (intensity: 'light' | 'medium' = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(intensity === 'light' ? 30 : 50);
};

// Pass cashierId as a prop so the DB knows who made the sale
export function POSRegister({ cashierId = 'UNKNOWN' }: { cashierId?: string }) {
  const { activeTicket, updateTicketQuantity, removeFromTicket, clearTicket, setIsCartOpen } = usePOSStore();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const subtotal = useMemo(() => activeTicket.reduce((total, item) => total + (item.price * item.quantity), 0), [activeTicket]);
  const isEmpty = activeTicket.length === 0;

  return (
    <>
      <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950/80 relative border-l border-border/50 shadow-2xl md:shadow-none z-40">
        
        {/* HEADER WITH CLOSE BUTTON */}
        <div className="p-4 border-b border-border/50 shrink-0 bg-background/50 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsCartOpen(false)} className="md:hidden w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground hover:bg-foreground/10"><X size={20} /></button>
            <div className="w-10 h-10 rounded-full bg-primary/10 hidden md:flex items-center justify-center text-primary"><UserCircle2 size={20} /></div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Current Ticket</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{activeTicket.length} Items</p>
            </div>
          </div>
          {!isEmpty && <button onClick={() => { triggerHaptic('medium'); clearTicket(); }} className="text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 px-3 py-2 rounded-lg transition-colors">Clear</button>}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {isEmpty ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-4">
                <ShoppingBag size={64} strokeWidth={1} />
                <p className="text-sm font-semibold tracking-wide">Register is empty.</p>
              </motion.div>
            ) : (
              activeTicket.map((item) => {
                // FIREWALL: Check if they hit the physical inventory limit
                const isMaxed = item.quantity >= item.maxStock;

                return (
                  <motion.div layout initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -20, scale: 0.95 }} key={item.variantId} className="flex flex-col bg-background border border-border/60 rounded-2xl p-3 shadow-sm">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 relative rounded-xl overflow-hidden bg-foreground/5 shrink-0 border border-border/50">
                        <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-tight">{item.title}</h4>
                            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{item.sku}</span>
                          </div>
                          <p className="text-sm font-black text-foreground shrink-0">KES {(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-foreground/5 rounded-xl border border-border/50 p-0.5">
                            <button onClick={() => { triggerHaptic(); updateTicketQuantity(item.variantId, item.quantity - 1); }} className="w-8 h-8 flex items-center justify-center text-foreground/70 hover:bg-background rounded-lg transition-colors"><Minus size={14} strokeWidth={2.5} /></button>
                            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                            
                            {/* FIREWALL UI: Visual feedback when max stock is reached */}
                            <button 
                              disabled={isMaxed} 
                              onClick={() => { triggerHaptic(); updateTicketQuantity(item.variantId, item.quantity + 1); }} 
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isMaxed ? 'text-destructive opacity-30 cursor-not-allowed' : 'text-foreground/70 hover:bg-background'}`}
                            >
                              <Plus size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                          <button onClick={() => { triggerHaptic(); removeFromTicket(item.variantId); }} className="w-8 h-8 flex items-center justify-center text-destructive/70 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 md:p-6 bg-background border-t border-border/60 shrink-0 z-20 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Due</span>
            <span className="text-3xl font-serif font-black tracking-tight text-foreground">KES {subtotal.toLocaleString()}</span>
          </div>
          <button 
            disabled={isEmpty} 
            onClick={() => { triggerHaptic('medium'); setIsPaymentModalOpen(true); }} 
            className="w-full flex items-center justify-center gap-3 py-4 md:py-5 rounded-2xl text-lg font-black tracking-wide transition-all duration-300 touch-manipulation bg-primary text-primary-foreground hover:opacity-90 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isEmpty ? 'Cart Empty' : `Charge KES ${subtotal.toLocaleString()}`}
            {!isEmpty && <ArrowRight size={22} strokeWidth={3} className="animate-pulse" />}
          </button>
        </div>
      </div>

      {/* PHASE 4: The Payment Modal Overlay */}
      <POSPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        cashierId={cashierId} 
      />
    </>
  );
}