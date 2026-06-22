'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Lock, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import ProcessingOverlay from '@/components/checkout/ProcessingOverlay';
import { CheckoutCartItem } from '@/app/actions/checkout';
import { useCart } from '@/components/storefront/cart/CartContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, isHydrated } = useCart();
  
  const [activeOrderRef, setActiveOrderRef] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && items.length === 0 && !activeOrderRef) {
      router.replace('/?cart=open');
    }
  }, [isHydrated, items.length, router, activeOrderRef]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Loader2 className="animate-spin text-primary/40" size={48} strokeWidth={1.5} />
          <Lock size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
          <ShieldCheck size={18} className="text-emerald-500" />
          <p className="text-sm font-semibold tracking-wide">Establishing 256-bit Secure Session...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !activeOrderRef) return null;

  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  const cartPayload: CheckoutCartItem[] = items.map(item => ({
    variant_id: item.variantId,
    quantity: item.quantity
  }));

  const formatKES = (amount: number) => `KES ${amount.toLocaleString('en-US')}`;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 pb-24 md:pb-0">
      
      {/* 1. SECURE HEADER */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur-xl sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-[72px] flex items-center justify-between">
          <Link 
            href="/?cart=open" 
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all active:scale-95 group"
          >
            <div className="p-1.5 bg-foreground/[0.03] rounded-full group-hover:bg-foreground/[0.06] transition-colors">
              <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            </div>
            <span className="hidden sm:inline">Return to Store</span>
          </Link>
          
          <div className="flex items-center gap-2 text-foreground font-serif text-xl md:text-2xl font-bold tracking-tight">
            Kilimani Hair
          </div>

          <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-2 rounded-full border border-emerald-500/20 shadow-sm">
            <Lock size={12} strokeWidth={2.5} />
            <span className="hidden sm:inline">SSL Secured</span>
            <span className="sm:hidden">Secure</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT GRID */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-14">
        <div className="flex flex-col-reverse lg:flex-row gap-12 lg:gap-24 items-start">
          
          {/* LEFT COLUMN: The Interactive Checkout Form */}
          <div className="flex-1 w-full lg:max-w-[550px] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="hidden lg:block mb-10">
              <h1 className="text-3xl lg:text-4xl font-serif text-foreground tracking-tight font-bold">
                Express Checkout
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <p>Transactions are heavily encrypted and secured.</p>
              </div>
            </div>
            
            <CheckoutForm 
              cartItems={cartPayload} 
              subtotal={subtotal}
              onSuccess={(orderRef) => setActiveOrderRef(orderRef)} 
            />
            
            <div className="mt-12 p-5 border border-border/40 rounded-2xl bg-foreground/[0.01]">
              <p className="text-[11px] md:text-xs text-muted-foreground/80 text-center leading-relaxed max-w-md mx-auto">
                By proceeding, you agree to our Terms of Service. 
                Financial transactions are processed securely via Safaricom Daraja API. 
                Kilimani Hair does not store your payment credentials.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: The Sticky Order Summary */}
          <div className="w-full lg:w-[440px] shrink-0 animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
            <div className="sticky top-[112px] bg-foreground/[0.015] border border-border/60 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/5">
              <h2 className="text-xl font-bold font-serif text-foreground mb-6 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="bg-foreground text-background font-sans text-xs px-3 py-1 rounded-full font-bold">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
              </h2>
              
              {/* Dynamic Cart Items List */}
              <div className="space-y-5 mb-8 max-h-[45vh] overflow-y-auto custom-scrollbar pr-2">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-4 group">
                    <div className="relative w-20 h-24 bg-stone-100 dark:bg-stone-900 rounded-xl overflow-hidden border border-border/40 shrink-0">
                      <Image 
                        src={item.image} 
                        alt={item.title} 
                        fill 
                        sizes="80px"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-foreground text-background text-[11px] font-bold flex items-center justify-center rounded-full z-10 border-[3px] border-background shadow-sm">
                        {item.quantity}
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      {item.length && (
                        <p className="text-xs text-muted-foreground font-medium mt-1">{item.length}</p>
                      )}
                      <p className="text-sm font-bold text-foreground mt-2">
                        {formatKES(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Ledger */}
              <div className="border-t border-border/60 pt-6 space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground font-medium">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatKES(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground font-medium">
                  <span>Shipping</span>
                  <span className="text-foreground italic">Calculated by the system</span>
                </div>
              </div>

              <div className="border-t border-foreground/10 mt-6 pt-6 flex justify-between items-end">
                <span className="text-lg font-bold text-foreground">Total</span>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-muted-foreground block mb-1 uppercase tracking-widest">
                    Incl. Taxes
                  </span>
                  <span className="text-3xl md:text-4xl font-serif font-bold text-primary tracking-tight">
                    {formatKES(subtotal)}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* 3. THE M-PESA MODAL PORTAL */}
      {activeOrderRef && (
        <ProcessingOverlay 
          orderRef={activeOrderRef} 
          onClose={() => setActiveOrderRef(null)} 
        />
      )}
      
    </div>
  );
}