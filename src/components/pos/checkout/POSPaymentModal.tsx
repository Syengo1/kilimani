'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Banknote, Smartphone, CheckCircle2, SplitSquareHorizontal, Send, Loader2 } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { initiatePosSTKPush } from '@/app/actions/mpesa';

interface POSPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashierId: string;
}

type PaymentMode = 'cash' | 'mpesa' | 'split';

export function POSPaymentModal({ isOpen, onClose, cashierId }: POSPaymentModalProps) {
  const { activeTicket, processOfflineCheckout } = usePOSStore();
  const supabase = createClient();
  
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [mpesaAmount, setMpesaAmount] = useState<string>('');
  const [mpesaCode, setMpesaCode] = useState<string>('');
  
  // STK Push State
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isPrompting, setIsPrompting] = useState(false);
  const activeCheckoutRequestId = useRef<string | null>(null);
  
  // 🔥 ENTERPRISE UPGRADE: Safely store the exact channel to avoid killing other app listeners
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Derived state pattern to reset the modal when it opens
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const totalDue = useMemo(() => activeTicket.reduce((total, item) => total + (item.price * item.quantity), 0), [activeTicket]);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setMode('cash');
      setCashAmount(totalDue.toString());
      setMpesaAmount('0');
      setMpesaCode('');
      setCustomerPhone('');
      setIsPrompting(false);
    }
  }

  // 🔥 ENTERPRISE UPGRADE: Robust realtime subscription cleanup
  useEffect(() => {
    if (isOpen) {
      activeCheckoutRequestId.current = null;
    } else {
      // Only kill the specific STK listener, not the whole app's sockets
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }
  }, [isOpen, supabase]);

  const handleModeChange = (newMode: PaymentMode) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
    setMode(newMode);
    
    if (newMode === 'cash') {
      setCashAmount(totalDue.toString()); setMpesaAmount('0');
    } else if (newMode === 'mpesa') {
      setCashAmount('0'); setMpesaAmount(totalDue.toString());
    } else {
      setCashAmount(''); setMpesaAmount('');
    }
    setMpesaCode('');
  };

  const cashNum = mode === 'mpesa' ? 0 : (Number(cashAmount) || 0);
  const mpesaNum = mode === 'cash' ? 0 : (mode === 'mpesa' ? totalDue : (Number(mpesaAmount) || 0));
  const totalTendered = cashNum + mpesaNum;
  const balance = totalDue - totalTendered;
  const changeDue = totalTendered > totalDue ? totalTendered - totalDue : 0;
  
  const canCheckout = totalTendered >= totalDue && totalDue > 0 && (mode === 'cash' || mpesaCode.length >= 8);

  // ==========================================
  // REAL-TIME DARAJA STK PUSH LOGIC
  // ==========================================
  const handleMpesaPrompt = async () => {
    if (customerPhone.length < 9) {
      toast.error('Enter a valid phone number');
      return;
    }
    
    if (!navigator.onLine) {
      toast.error('POS is offline. Please enter the M-Pesa receipt code manually.');
      return;
    }

    setIsPrompting(true);
    toast.info('Sending prompt to customer...');
    
    try {
      const response = await initiatePosSTKPush(customerPhone, mpesaNum);
      
      if (!response.success || !response.checkoutRequestId) {
        throw new Error(response.error);
      }

      activeCheckoutRequestId.current = response.checkoutRequestId;

      const channel = supabase
        .channel(`stk-${response.checkoutRequestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE', 
            schema: 'public',
            table: 'pos_stk_requests',
            filter: `checkout_request_id=eq.${response.checkoutRequestId}`,
          },
          (payload) => {
            // STRICT TYPES: Ensure Supabase realtime payload properties are strictly typed
            const newRow = payload.new as Record<string, unknown>;
            const receipt_number = newRow.receipt_number as string | undefined;
            const status = newRow.status as string | undefined;
            const error_message = newRow.error_message as string | undefined;
            
            setIsPrompting(false);
            
            // Clean up listener instantly
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }

            if (status === 'success' && receipt_number) {
              setMpesaCode(receipt_number); 
              toast.success('Payment received! Receipt auto-filled.');
              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30]);
            } else {
              toast.error(error_message || 'Payment failed or was cancelled by user.');
            }
          }
        )
        .subscribe();

      // Store the channel so it can be killed gracefully if the modal is closed
      channelRef.current = channel;

    } catch (error) { // 🔥 FIX: Removed `any`
      console.error('[M-Pesa Prompt Error]:', error);
      // 🔥 FIX: Safely extract error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate M-Pesa prompt.';
      toast.error(errorMessage);
      setIsPrompting(false);
    }
  };

  const handleCompleteSale = () => {
    if (!canCheckout) return;
    
    const finalCashRecorded = cashNum > 0 ? cashNum - changeDue : 0;
    

    processOfflineCheckout(cashierId, mode, finalCashRecorded, mpesaNum, mpesaCode);
    
    toast.success('Sale completed successfully!');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg bg-background border border-border/50 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90dvh]"
          >
            {/* HEADER */}
            <div className="p-5 md:p-6 bg-stone-50 dark:bg-stone-900 border-b border-border/50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-serif font-black">Complete Sale</h2>
                <p className="text-xs font-mono text-muted-foreground mt-1">Total Due: KES {totalDue.toLocaleString()}</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-destructive hover:text-white transition-colors active:scale-95"><X size={20} /></button>
            </div>

            {/* PAYMENT MODE SELECTOR */}
            <div className="p-4 border-b border-border/50 bg-background shrink-0">
              <div className="flex bg-foreground/5 p-1 rounded-2xl">
                {(['cash', 'mpesa', 'split'] as PaymentMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all touch-manipulation ${
                      mode === m ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m === 'cash' && <Banknote size={16} />}
                    {m === 'mpesa' && <Smartphone size={16} />}
                    {m === 'split' && <SplitSquareHorizontal size={16} />}
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* DYNAMIC WORKSPACE */}
            <div className="p-5 md:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <AnimatePresence mode="wait">
                
                {mode === 'cash' && (
                  <motion.div key="cash" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cash Tendered (KES)</label>
                      <input 
                        type="number" placeholder="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)}
                        className="w-full p-4 bg-foreground/5 border border-transparent rounded-2xl text-2xl font-black focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setCashAmount(totalDue.toString())} className="flex-1 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors">Exact Amount</button>
                      <button onClick={() => setCashAmount('1000')} className="flex-1 py-2 bg-foreground/5 text-foreground rounded-xl text-xs font-bold hover:bg-foreground/10 transition-colors">1,000</button>
                      <button onClick={() => setCashAmount('5000')} className="flex-1 py-2 bg-foreground/5 text-foreground rounded-xl text-xs font-bold hover:bg-foreground/10 transition-colors">5,000</button>
                    </div>
                  </motion.div>
                )}

                {mode === 'mpesa' && (
                  <motion.div key="mpesa" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 flex items-center gap-2">
                        <Smartphone size={14} /> Send Payment Prompt
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="tel" placeholder="07XX XXX XXX" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                          className="flex-1 p-3 bg-background border border-emerald-500/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none"
                        />
                        <button 
                          onClick={handleMpesaPrompt} disabled={isPrompting || customerPhone.length < 9}
                          className="px-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                          {isPrompting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-emerald-600/70 leading-tight">Sends a prompt to the customer&apos;s phone for exactly KES {mpesaNum.toLocaleString()}.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between">
                        <span>Safaricom Receipt Code</span>
                        <span className="text-[9px] bg-foreground/5 px-2 py-0.5 rounded-full">Manual or Auto</span>
                      </label>
                      <input 
                        type="text" placeholder="e.g. QKT5ABCDEF" value={mpesaCode} onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                        className={`w-full p-4 border rounded-2xl font-mono font-bold uppercase focus:ring-2 outline-none transition-all ${
                          mpesaCode.length >= 8 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 focus:ring-emerald-500/20' : 'bg-foreground/5 border-transparent focus:ring-primary/20'
                        }`}
                      />
                    </div>
                  </motion.div>
                )}

                {mode === 'split' && (
                  <motion.div key="split" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cash (KES)</label>
                        <input 
                          type="number" placeholder="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)}
                          className="w-full p-3 bg-foreground/5 border border-transparent rounded-xl text-lg font-black focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">M-Pesa (KES)</label>
                        <input 
                          type="number" placeholder="0" value={mpesaAmount} onChange={(e) => setMpesaAmount(e.target.value)}
                          className="w-full p-3 bg-emerald-500/10 text-emerald-600 border-none rounded-xl text-lg font-black focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                    </div>
                    
                    {/* Split Mode STK Push */}
                    <AnimatePresence>
                       {mpesaNum > 0 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2 mb-4 mt-2">
                                <div className="flex gap-2">
                                  <input 
                                    type="tel" placeholder="Customer Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="flex-1 p-2 bg-background border border-emerald-500/20 rounded-lg text-xs font-bold outline-none"
                                  />
                                  <button onClick={handleMpesaPrompt} disabled={isPrompting || customerPhone.length < 9} className="px-3 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 disabled:opacity-50 text-xs">
                                    {isPrompting ? <Loader2 size={14} className="animate-spin" /> : 'Push'}
                                  </button>
                                </div>
                            </div>
                          </motion.div>
                       )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">M-Pesa Receipt Code</label>
                      <input 
                        type="text" placeholder="e.g. QKT5ABCDEF" value={mpesaCode} onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                        className="w-full p-3 bg-foreground/5 border-transparent border rounded-xl font-mono font-bold uppercase focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* FINANCIAL MATH SUMMARY */}
              <div className="bg-stone-50 dark:bg-stone-900/50 p-4 rounded-2xl space-y-2 border border-border/50">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Due</span><span className="font-bold">KES {totalDue.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Tendered</span><span className="font-bold">KES {totalTendered.toLocaleString()}</span></div>
                <div className="border-t border-border/50 my-2 pt-2 flex justify-between">
                  {balance > 0 ? (
                     <><span className="text-destructive font-bold text-sm">Remaining Balance</span><span className="text-destructive font-black">KES {balance.toLocaleString()}</span></>
                  ) : (
                     <><span className="text-emerald-600 font-bold text-sm">Change Due</span><span className="text-emerald-600 font-black">KES {changeDue.toLocaleString()}</span></>
                  )}
                </div>
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="p-5 md:p-6 border-t border-border/50 bg-background shrink-0">
              <button
                disabled={!canCheckout} onClick={handleCompleteSale}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-lg font-black tracking-wide transition-all active:scale-[0.98] bg-primary text-primary-foreground hover:opacity-90 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:shadow-none"
              >
                <CheckCircle2 size={24} /> Complete Sale
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}