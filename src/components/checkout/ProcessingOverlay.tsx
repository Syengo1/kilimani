'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useCart } from '@/components/storefront/cart/CartContext';
import { checkOrderStatus } from '@/app/actions/checkout';

interface ProcessingOverlayProps {
  orderRef: string;
  onClose: () => void;
}

export default function ProcessingOverlay({ orderRef, onClose }: ProcessingOverlayProps) {
  const [status, setStatus] = useState<'prompt' | 'success' | 'failed'>('prompt');
  const [countdown, setCountdown] = useState(60); // Standard M-Pesa expiry window
  
  // Bring in the cart context so we can empty it on success
  const { clearCart } = useCart();

  useEffect(() => {
    // If we already succeeded or failed, stop running timers
    if (!orderRef || status !== 'prompt') return;

    // 1. THE INTELLIGENT POLLING ENGINE
    // Checks the database every 2.5 seconds. Bypasses RLS issues for guest users.
    const pollInterval = setInterval(async () => {
      try {
        const currentStatus = await checkOrderStatus(orderRef);
        
        if (currentStatus === 'paid') {
          setStatus('success');
          clearCart(); // Securely wipe the cart data
        } else if (currentStatus === 'cancelled') {
          setStatus('failed'); // Instantly trigger the rejection UI
        }
      } catch (error) {
        console.error("Status polling error:", error);
      }
    }, 2500);

    // 2. THE VISUAL COUNTDOWN TIMER
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus('failed'); // Auto-fail if 60 seconds elapses with no webhook
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 3. CLEANUP
    // Brutally clear intervals if the component unmounts or status changes
    return () => {
      clearInterval(pollInterval);
      clearInterval(countdownTimer);
    };
  }, [orderRef, status, clearCart]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-background border border-border/60 rounded-3xl max-w-md w-full p-8 text-center shadow-2xl flex flex-col items-center relative overflow-hidden">
        
        {/* Subtle progress bar at the top of the modal */}
        {status === 'prompt' && (
          <div 
            className="absolute top-0 left-0 h-1 bg-primary transition-all duration-1000 ease-linear" 
            style={{ width: `${(countdown / 60) * 100}%` }}
          />
        )}
        
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
              Awaiting PIN entry: <span className={countdown < 15 ? 'text-destructive' : ''}>{countdown}s</span>
            </div>
          </>
        )}

        {status === 'failed' && (
          <div className="animate-in zoom-in-95 duration-300 w-full flex flex-col items-center">
            <XCircle size={56} className="text-destructive mb-5" strokeWidth={1.5} />
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

        {status === 'success' && (
          <div className="animate-in zoom-in-95 duration-300 w-full flex flex-col items-center">
            <CheckCircle2 size={56} className="text-emerald-500 mb-5" strokeWidth={1.5} />
            <h3 className="text-xl font-serif tracking-tight font-bold text-foreground">Payment Secured</h3>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Your transaction verified successfully. Order processing details and your receipt have been secured.
            </p>
            <button
              onClick={() => window.location.href = '/account/orders'}
              className="mt-8 w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-md shadow-primary/20"
            >
              Track Order Status
            </button>
          </div>
        )}
      </div>
    </div>
  );
}