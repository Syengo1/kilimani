'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Lock, Loader2, ShieldCheck } from 'lucide-react';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import ProcessingOverlay from '@/components/checkout/ProcessingOverlay';
import { CheckoutCartItem } from '@/app/actions/checkout';
import { useCart } from '@/components/storefront/cart/CartContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, isHydrated, clearCart } = useCart();
  
  // Master state to trigger the M-Pesa Overlay
  const [activeOrderRef, setActiveOrderRef] = useState<string | null>(null);

  // SECURE REDIRECT: Prevent users from sitting on an empty checkout page
  useEffect(() => {
    // If the cart is loaded, empty, AND they aren't currently waiting for an M-Pesa prompt...
    if (isHydrated && items.length === 0 && !activeOrderRef) {
      router.replace('/?cart=open');
    }
  }, [isHydrated, items.length, router, activeOrderRef]);

  // If the app is still reading LocalStorage, show an Apple-style secure session loader
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-5">
        <Loader2 className="animate-spin text-foreground/40" size={36} strokeWidth={2} />
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
          <ShieldCheck size={16} />
          <p className="text-sm font-medium tracking-wide">Establishing Secure Session...</p>
        </div>
      </div>
    );
  }

  // Prevent flash before redirect if cart is empty
  if (items.length === 0 && !activeOrderRef) return null;

  // DYNAMIC CART MATH
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // FORMAT PAYLOAD FOR THE SERVER
  const cartPayload: CheckoutCartItem[] = items.map(item => ({
    variant_id: item.variantId,
    quantity: item.quantity
  }));

  const formatKES = (amount: number) => `KES ${amount.toLocaleString('en-US')}`;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 pb-24 md:pb-0">
      
      {/* 1. SECURE HEADER */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-0 z-30 shadow-sm shadow-foreground/[0.02]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link 
            href="/?cart=open" 
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Return to Cart</span>
            <span className="sm:hidden">Back</span>
          </Link>
          
          <div className="flex items-center gap-2 text-foreground font-serif text-lg md:text-xl font-medium tracking-tight">
            Kilimani Hair
          </div>

          <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <Lock size={12} />
            <span className="hidden sm:inline">Secure Checkout</span>
            <span className="sm:hidden">Secure</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT GRID */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* flex-col-reverse puts the Form at the bottom on mobile, but Summary on top. */}
        <div className="flex flex-col-reverse lg:flex-row gap-12 lg:gap-20 items-start">
          
          {/* LEFT COLUMN: The Interactive Checkout Form */}
          <div className="flex-1 w-full lg:max-w-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="hidden lg:block mb-8">
              <h1 className="text-3xl font-serif text-foreground tracking-tight">
                Complete your order
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Enter your details below. Transactions are heavily encrypted and secured.
              </p>
            </div>
            
            {/* The Payload and the Success Trigger */}
            <CheckoutForm 
              cartItems={cartPayload} 
              subtotal={subtotal}
              onSuccess={(orderRef) => {
                setActiveOrderRef(orderRef);
                // Note: We DO NOT call clearCart() here yet! 
                // We only clear the cart when the M-Pesa webhook successfully marks it 'paid'.
                // The ProcessingOverlay handles that final step.
              }} 
            />
            
            <p className="text-[11px] md:text-xs text-muted-foreground/80 text-center mt-10 leading-relaxed max-w-md mx-auto">
              By proceeding, you agree to our Terms of Service. 
              Financial transactions are processed securely via Safaricom Daraja API. 
              Your data is encrypted end-to-end.
            </p>
          </div>

          {/* RIGHT COLUMN: The Sticky Order Summary */}
          {/* w-full ensures it stretches nicely on mobile, w-[420px] caps it on desktop */}
          <div className="w-full lg:w-[420px] shrink-0 animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
            {/* h-fit and sticky ensure it locks into place exactly 112px from the top on desktop */}
            <div className="sticky top-[112px] bg-foreground/[0.02] border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="bg-foreground/10 text-foreground text-xs px-2.5 py-1 rounded-full">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
              </h2>
              
              {/* Dynamic Cart Items List */}
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-4 group">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-20 bg-stone-100 dark:bg-stone-900 rounded-xl overflow-hidden border border-border/40 shrink-0">
                      <Image 
                        src={item.image} 
                        alt={item.title} 
                        fill 
                        sizes="64px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-foreground text-background text-[10px] font-bold flex items-center justify-center rounded-full z-10 border-2 border-background shadow-sm">
                        {item.quantity}
                      </div>
                    </div>
                    
                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      {item.length && (
                        <p className="text-xs text-muted-foreground mt-1">{item.length}</p>
                      )}
                      <p className="text-sm font-semibold text-foreground mt-1.5">
                        {formatKES(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Ledger */}
              <div className="border-t border-border/50 pt-5 space-y-3.5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">{formatKES(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-medium text-foreground">Calculated dynamically</span>
                </div>
              </div>

              <div className="border-t border-border/50 mt-5 pt-5 flex justify-between items-end">
                <span className="text-base font-semibold text-foreground">Total</span>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block mb-1 uppercase tracking-wider">
                    Incl. applicable taxes
                  </span>
                  <span className="text-2xl md:text-3xl font-serif font-medium text-foreground tracking-tight">
                    {formatKES(subtotal)}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* 3. THE M-PESA MODAL PORTAL */}
      {/* If an order reference exists, the screen locks and we wait for Safaricom */}
      {activeOrderRef && (
        <ProcessingOverlay 
          orderRef={activeOrderRef} 
          onClose={() => setActiveOrderRef(null)} 
        />
      )}
      
    </div>
  );
}