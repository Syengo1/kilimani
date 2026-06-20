'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Clean client initialization specifically optimized for webhook verification listening
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProcessingOverlayProps {
  orderRef: string;
  onClose: () => void;
}

export default function ProcessingOverlay({ orderRef, onClose }: ProcessingOverlayProps) {
  const [status, setStatus] = useState<'prompt' | 'processing' | 'success' | 'failed'>('prompt');
  const [countdown, setCountdown] = useState(60); // standard M-Pesa expiry logic window

  useEffect(() => {
    if (!orderRef) return;

    // Realtime Database connection subscription checking changes matching this order id
    const orderSubscription = supabase
      .channel(`order-status-${orderRef}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderRef}` },
        (payload) => {
          const newStatus = payload.new.status;
          if (newStatus === 'paid') {
            setStatus('success');
          } else if (newStatus === 'cancelled') {
            setStatus('failed');
          }
        }
      )
      .subscribe();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus('failed');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      supabase.removeChannel(orderSubscription);
    };
  }, [orderRef]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-background border border-border/60 rounded-3xl max-w-md w-full p-8 text-center shadow-2xl flex flex-col items-center">
        
        {status === 'prompt' && (
          <>
            <div className="relative flex items-center justify-center w-16 h-16 mb-6">
              <Loader2 size={48} className="text-foreground animate-spin absolute" />
              <div className="w-2 h-2 rounded-full bg-foreground animate-ping" />
            </div>
            <h3 className="text-xl font-medium tracking-tight text-foreground">Check Your Phone</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              An M-Pesa STK push prompt has been transmitted to your device. Kindly key in your transaction PIN to finalize payment.
            </p>
            <div className="mt-6 text-xs font-mono px-3 py-1.5 bg-foreground/5 rounded-full text-muted-foreground">
              Awaiting PIN entry: {countdown}s
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle size={52} className="text-destructive mb-4" />
            <h3 className="text-xl font-medium tracking-tight text-foreground">Transaction Aborted</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              The payment process was unsuccessful. This occurs if the prompt timed out, was cancelled manually, or due to insufficient balance.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full py-3 bg-foreground text-background font-semibold rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Modify details and retry
            </button>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={52} className="text-emerald-500 mb-4 animate-in zoom-in-50 duration-300" />
            <h3 className="text-xl font-medium tracking-tight text-foreground">Payment Secured</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Your transaction verified successfully. Order files and processing details have been compiled and sent to your email.
            </p>
            <button
              onClick={() => window.location.href = '/account/orders'}
              className="mt-6 w-full py-3 bg-foreground text-background font-semibold rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Track Order Status
            </button>
          </>
        )}
      </div>
    </div>
  );
}