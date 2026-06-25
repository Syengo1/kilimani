'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useCart } from '@/components/storefront/cart/CartContext';
import { checkOrderStatus } from '@/app/actions/checkout';

interface ProcessingOverlayProps {
  orderRef: string;
  onClose: () => void;
}

export default function ProcessingOverlay({ orderRef, onClose }: ProcessingOverlayProps) {
  const router = useRouter();
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState<'prompt' | 'success' | 'failed'>('prompt');
  const [countdown, setCountdown] = useState(60); 
  
  // Use a ref to track mounting state and stop memory leaks if the user closes the modal
  const isPolling = useRef(true);

  useEffect(() => {
    // Reset polling flag when component mounts
    isPolling.current = true;

    if (!orderRef || status !== 'prompt') return;

    // 1. RECURSIVE POLLING ENGINE (Enterprise Standard)
    // Ensures requests never overlap, completely preventing network dogpiling
    const pollStatus = async () => {
      if (!isPolling.current) return;
      
      try {
        const currentStatus = await checkOrderStatus(orderRef);
        
        if (currentStatus === 'paid') {
          setStatus('success');
          clearCart(); // Securely wipe the cart data
          isPolling.current = false;
          
          // Auto-redirect to orders page after a brief celebration delay
          setTimeout(() => {
            router.push('/account/orders'); 
          }, 3500);
          
          return; // Terminate the recursive loop
        } else if (currentStatus === 'cancelled') {
          setStatus('failed');
          isPolling.current = false;
          return; // Terminate the recursive loop
        }
      } catch (error) {
        console.error("Status polling error:", error);
      }

      // If the order is still 'pending_payment', wait 2.5s and check again
      if (isPolling.current) {
        setTimeout(pollStatus, 2500);
      }
    };

    // Ignite the polling loop
    pollStatus();

    // 2. THE VISUAL COUNTDOWN TIMER
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus('failed'); // Auto-fail if the 60s Daraja window expires
          isPolling.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 3. CLEANUP
    // Brutally sever the network loops if the component unmounts
    return () => {
      isPolling.current = false;
      clearInterval(countdownTimer);
    };
  }, [orderRef, status, clearCart, router]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-background border border-border/60 rounded-3xl max-w-md w-full p-8 text-center shadow-2xl flex flex-col items-center relative overflow-hidden">
        
        {/* Subtle progress bar at the top of the modal */}
        {status === 'prompt' && (
          <div 
            className="absolute top-0 left-0 h-1.5 bg-primary transition-all duration-1000 ease-linear" 
            style={{ width: `${(countdown / 60) * 100}%` }}
          />
        )}
        
        {/* PROMPT STATE */}
        {status === 'prompt' && (
          <>
            <div className="relative flex items-center justify-center w-16 h-16 mb-6 mt-2">
              <Loader2 size={48} className="text-foreground animate-spin absolute" strokeWidth={1.5} />
              <div className="w-2 h-2 rounded-full bg-foreground animate-ping" />
            </div>
            <h3 className="text-xl font-serif tracking-tight font-bold text-foreground">Check Your Phone</h3>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              An M-Pesa STK push prompt has been transmitted to your device. Kindly key in your transaction PIN to finalize payment.
            </p>
            <div className="mt-8 text-xs font-mono font-medium px-4 py-2 bg-foreground/[0.03] border border-border/50 rounded-full text-foreground/70">
              Awaiting PIN entry: <span className={countdown < 15 ? 'text-destructive font-bold' : ''}>{countdown}s</span>
            </div>
          </>
        )}

        {/* FAILED STATE */}
        {status === 'failed' && (
          <div className="animate-in zoom-in-95 duration-500 w-full flex flex-col items-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-5">
              <XCircle size={32} className="text-destructive" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-serif tracking-tight font-bold text-foreground">Transaction Aborted</h3>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              The payment process was unsuccessful. This occurs if you cancelled the prompt, entered the wrong PIN, or had insufficient funds.
            </p>
            <button
              onClick={onClose}
              className="mt-8 w-full py-3.5 bg-foreground text-background font-semibold rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-md"
            >
              Modify details and retry
            </button>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && (
          <div className="animate-in zoom-in-95 duration-500 w-full flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-75" />
              <CheckCircle2 size={40} className="text-emerald-500 relative z-10" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-serif tracking-tight font-bold text-foreground">Payment Secured</h3>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Your transaction verified successfully. We are preparing your order details now.
            </p>
            
            <div className="mt-8 flex flex-col items-center gap-3 w-full">
              <Loader2 size={20} className="text-emerald-500 animate-spin" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Redirecting to Receipt...
              </span>
            </div>
            
            {/* Fallback button just in case the automatic router.push is delayed by the network */}
            <button
              onClick={() => router.push('/account/orders')}
              className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Go to Orders Now <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}